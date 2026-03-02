// app/api/auth/signin/route.js
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import clientPromise from '@/lib/mongodb';
import { createToken, setTokenCookie } from '@/lib/auth';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('positivity');
    const users = db.collection('users');

    const user = await users.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Create token for authentication
    const token = createToken({
      id: user.userId || user._id.toString(),
      email: user.email,
      name: user.name,
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

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

    // Set the authentication cookie using your existing function
    setTokenCookie(response, token);

    return response;
  } catch (error) {
    console.error('Signin error:', error);
    return NextResponse.json(
      { error: 'Failed to sign in' },
      { status: 500 }
    );
  }
}