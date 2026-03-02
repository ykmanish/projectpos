// app/api/auth/signin/route.js
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import clientPromise from '@/lib/mongodb';
import { createToken, setTokenCookie } from '@/lib/auth';

export async function POST(request) {
  console.log('=== SIGNIN API CALLED ===');
  
  try {
    const { email, password } = await request.json();
    console.log('Signin attempt for email:', email);

    if (!email || !password) {
      console.log('Validation failed: missing fields');
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    console.log('Connecting to MongoDB...');
    const client = await clientPromise;
    const db = client.db('positivity');
    const users = db.collection('users');

    console.log('Looking up user...');
    const user = await users.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.log('User not found');
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }
    console.log('User found:', user.userId);

    console.log('Comparing passwords...');
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.log('Invalid password');
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }
    console.log('Password valid');

    // Create token for authentication
    console.log('Creating token...');
    const token = createToken({
      id: user.userId || user._id.toString(),
      email: user.email,
      name: user.name,
    });

    // Prepare user data for response
    const userData = {
      id: user.userId || user._id.toString(),
      email: user.email,
      name: user.name,
      preferredName: user.preferredName || user.name,
      points: user.points || 0,
      history: user.history || [],
      onboardingCompleted: user.onboardingCompleted || false,
      createdAt: user.createdAt,
      referredBy: user.referredBy || null,
    };

    // Create response
    const response = NextResponse.json({
      success: true,
      user: userData,
      message: 'Signed in successfully',
    });

    // Set the authentication cookie
    console.log('Setting cookie...');
    setTokenCookie(response, token);
    console.log('=== SIGNIN COMPLETED SUCCESSFULLY ===');

    return response;
  } catch (error) {
    console.error('=== SIGNIN ERROR ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return NextResponse.json(
      { error: 'Failed to sign in' },
      { status: 500 }
    );
  }
}