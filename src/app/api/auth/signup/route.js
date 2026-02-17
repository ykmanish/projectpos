// app/api/auth/signup/route.js

import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import clientPromise from '@/lib/mongodb';

export async function POST(request) {
  try {
    const { name, email, password, referralCode } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Password validation
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('positivity');
    const users = db.collection('users');
    const referrals = db.collection('referrals');
    const encryptionKeys = db.collection('encryptionKeys');

    // Check if user already exists
    const existingUser = await users.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate userId
    const userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

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
      // We can retry key generation later
    }

    // Initial points (start with 0)
    let initialPoints = 0;
    let referredBy = null;
    let referralBonusEntry = null;

    // If referral code was provided, process it
    if (referralCode) {
      const referrer = await referrals.findOne({ referralCode });
      if (referrer) {
        referredBy = referrer.userId;
        
        // NEW: Give 50 points to the new user
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
      }
    }

    // Create new user
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

    await users.insertOne(newUser);

    // Store encryption keys if they were generated successfully
    if (publicKey && privateKey) {
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
    await referrals.insertOne({
      userId,
      referralCode: userId.replace('user_', '').slice(0, 8).toUpperCase(),
      referrals: [],
      totalReferrals: 0,
      referralPoints: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Return user without password
    const { password: _, ...userWithoutPassword } = newUser;

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
      message: referralCode 
        ? 'Account created successfully! You received 50 bonus points from your referral! 🎉' 
        : 'Account created successfully!',
    });
  } catch (error) {
    console.error('Signup error:', error);
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