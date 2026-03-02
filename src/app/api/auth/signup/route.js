// app/api/auth/signup/route.js
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import clientPromise from '@/lib/mongodb';
import { createToken, setTokenCookie } from '@/lib/auth';

export async function POST(request) {
  console.log('=== SIGNUP API CALLED ===');
  
  try {
    const body = await request.json();
    console.log('Request body:', { ...body, password: '[REDACTED]' });
    
    const { name, email, password, referralCode } = body;

    // Validation
    if (!name || !email || !password) {
      console.log('Validation failed: missing fields');
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('Validation failed: invalid email');
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Password validation
    if (password.length < 6) {
      console.log('Validation failed: password too short');
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    console.log('Connecting to MongoDB...');
    const client = await clientPromise;
    console.log('MongoDB connected successfully');
    
    const db = client.db('positivity');
    const users = db.collection('users');
    const referrals = db.collection('referrals');
    const encryptionKeys = db.collection('encryptionKeys');

    // Check if user already exists
    console.log('Checking for existing user...');
    const existingUser = await users.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log('User already exists');
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }
    console.log('No existing user found');

    // Hash password
    console.log('Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Password hashed successfully');

    // Generate userId
    const userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    console.log('Generated userId:', userId);

    // Generate encryption keys for the new user
    console.log('🔐 Generating encryption keys for new user:', userId);
    let publicKey = null;
    let privateKey = null;
    let fingerprint = null;

    try {
      // Generate RSA key pair for encryption
      const keyPair = await generateKeyPair();
      publicKey = keyPair.publicKey;
      privateKey = keyPair.privateKey;
      
      // Generate fingerprint from public key
      fingerprint = generateFingerprint(publicKey);
      
      console.log('✅ Encryption keys generated successfully');
    } catch (keyError) {
      console.error('❌ Failed to generate encryption keys:', keyError);
      // Continue with signup even if key generation fails
    }

    // Initial points (start with 0)
    let initialPoints = 0;
    let referredBy = null;
    let referralBonusEntry = null;

    // If referral code was provided, process it
    if (referralCode) {
      console.log('Processing referral code:', referralCode);
      const referrer = await referrals.findOne({ referralCode });
      if (referrer) {
        console.log('Referrer found:', referrer.userId);
        referredBy = referrer.userId;
        
        // Give 50 points to the new user
        initialPoints = 50;
        
        // Create points history entry for new user's referral bonus
        referralBonusEntry = {
          date: new Date().toLocaleDateString('en-CA'),
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          reflection: 'Welcome bonus from referral! +50 points',
          points: 50,
          type: 'referral_bonus'
        };

        // Add 50 points to referrer
        await users.updateOne(
          { userId: referrer.userId },
          { $inc: { points: 50 } }
        );

        // Add points history for referrer
        const referrerPointsEntry = {
          date: new Date().toLocaleDateString('en-CA'),
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          reflection: `Referral bonus for inviting ${name.trim()}`,
          points: 50,
          type: 'referral'
        };

        await users.updateOne(
          { userId: referrer.userId },
          { 
            $push: { 
              history: { $each: [referrerPointsEntry], $position: 0 }
            }
          }
        );

        // Update referral record
        await referrals.updateOne(
          { userId: referrer.userId },
          { 
            $push: { 
              referrals: {
                userId,
                email: email.toLowerCase(),
                name: name.trim(),
                joinedAt: new Date(),
                status: 'active'
              }
            },
            $inc: { 
              totalReferrals: 1,
              referralPoints: 50 
            },
            $set: { updatedAt: new Date() }
          }
        );
        console.log('Referral processing complete');
      } else {
        console.log('No referrer found for code:', referralCode);
      }
    }

    // Create new user
    console.log('Creating new user document...');
    const newUser = {
      userId,
      email: email.toLowerCase(),
      password: hashedPassword,
      name: name.trim(),
      preferredName: name.trim(),
      onboardingCompleted: false,
      points: initialPoints,
      history: referralBonusEntry ? [referralBonusEntry] : [],
      referredBy: referredBy,
      referredAt: referredBy ? new Date() : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const insertResult = await users.insertOne(newUser);
    console.log('User inserted with ID:', insertResult.insertedId);

    // Store encryption keys if they were generated successfully
    if (publicKey && privateKey) {
      console.log('Storing encryption keys...');
      await encryptionKeys.insertOne({
        userId,
        publicKey,
        privateKey,
        fingerprint,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('🔐 Encryption keys stored in database');
    }

    // Create referral record for new user (for their own referral code)
    const referralCode_ = userId.replace('user_', '').slice(0, 8).toUpperCase();
    console.log('Creating referral record with code:', referralCode_);
    
    await referrals.insertOne({
      userId,
      referralCode: referralCode_,
      referrals: [],
      totalReferrals: 0,
      referralPoints: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('Referral record created');

    // Create token for authentication
    console.log('Creating auth token...');
    const token = createToken({
      id: userId,
      email: email.toLowerCase(),
      name: name.trim(),
    });
    console.log('Token created');

    // Prepare user data for response
    const userData = {
      id: userId,
      email: email.toLowerCase(),
      name: name.trim(),
      preferredName: name.trim(),
      points: initialPoints,
      history: referralBonusEntry ? [referralBonusEntry] : [],
      onboardingCompleted: false,
      createdAt: newUser.createdAt,
      referredBy: referredBy,
      referralCode: referralCode_,
    };

    // Create response
    console.log('Creating response...');
    const response = NextResponse.json({
      success: true,
      user: userData,
      message: referralCode 
        ? 'Account created successfully! You received 50 bonus points from your referral! 🎉' 
        : 'Account created successfully!',
    });

    // Set the authentication cookie
    console.log('Setting auth cookie...');
    setTokenCookie(response, token);
    console.log('=== SIGNUP COMPLETED SUCCESSFULLY ===');

    return response;
  } catch (error) {
    console.error('=== SIGNUP ERROR ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return NextResponse.json(
      { error: 'Failed to create account', details: error.message },
      { status: 500 }
    );
  }
}

// Helper function to generate RSA key pair
async function generateKeyPair() {
  try {
    const crypto = require('crypto');
    
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });
    
    return { publicKey, privateKey };
  } catch (error) {
    console.error('Error generating key pair:', error);
    throw error;
  }
}

// Helper function to generate fingerprint from public key
function generateFingerprint(publicKey) {
  try {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256').update(publicKey).digest('hex');
    const groups = hash.match(/.{1,4}/g);
    if (groups && groups.length >= 8) {
      return groups.slice(0, 8).join(' ').toUpperCase();
    }
    return hash.substring(0, 32).toUpperCase();
  } catch (error) {
    console.error('❌ Error generating fingerprint:', error);
    return 'ERROR';
  }
}