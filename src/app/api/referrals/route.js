// app/api/referrals/route.js

import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

// Generate a unique referral code
function generateReferralCode(userId) {
  // Create a short, readable code from userId
  const code = userId.replace('user_', '').slice(0, 8).toUpperCase();
  return code;
}

// GET /api/referrals?userId=xxx
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('positivity');
    const referrals = db.collection('referrals');
    const users = db.collection('users');

    // Get user's referral data
    let userReferral = await referrals.findOne({ userId });
    
    // If no referral record exists, create one
    if (!userReferral) {
      const referralCode = generateReferralCode(userId);
      const newReferral = {
        userId,
        referralCode,
        referrals: [],
        totalReferrals: 0,
        referralPoints: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await referrals.insertOne(newReferral);
      userReferral = newReferral;
    }

    // Get details of referred users
    const referredUsers = await users.find({
      referredBy: userId
    }).project({
      name: 1,
      email: 1,
      createdAt: 1,
      onboardingCompleted: 1
    }).toArray();

    // Format referral data
    const formattedReferrals = referredUsers.map((user, index) => ({
      id: `ref_${index}`,
      name: user.name || 'New User',
      email: user.email,
      joinedDate: user.createdAt,
      status: user.onboardingCompleted ? 'Active' : 'Pending',
      completedOnboarding: user.onboardingCompleted || false
    }));

    return NextResponse.json({
      success: true,
      referralCode: userReferral.referralCode,
      referrals: formattedReferrals,
      totalReferrals: formattedReferrals.length,
      referralPoints: formattedReferrals.length * 50 // 50 points per referral
    });

  } catch (error) {
    console.error('GET /api/referrals error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch referral data', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/referrals - Process a new referral during signup
export async function POST(request) {
  try {
    const { referralCode, newUserId, newUserEmail, newUserName } = await request.json();

    if (!referralCode || !newUserId) {
      return NextResponse.json(
        { error: 'referralCode and newUserId are required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('positivity');
    const referrals = db.collection('referrals');
    const users = db.collection('users');

    // Find the referrer by referral code
    const referrer = await referrals.findOne({ referralCode });
    
    if (!referrer) {
      return NextResponse.json(
        { error: 'Invalid referral code' },
        { status: 404 }
      );
    }

    // Check if this user was already referred
    const existingUser = await users.findOne({ userId: newUserId });
    if (existingUser && existingUser.referredBy) {
      return NextResponse.json(
        { error: 'User already has a referrer' },
        { status: 400 }
      );
    }

    // Update the new user with referrer info
    await users.updateOne(
      { userId: newUserId },
      { 
        $set: { 
          referredBy: referrer.userId,
          referredAt: new Date()
        } 
      }
    );

    // Add 50 points to referrer
    await users.updateOne(
      { userId: referrer.userId },
      { $inc: { points: 50 } }
    );

    // Add referral record
    await referrals.updateOne(
      { userId: referrer.userId },
      { 
        $push: { 
          referrals: {
            userId: newUserId,
            email: newUserEmail,
            name: newUserName,
            joinedAt: new Date(),
            status: 'pending'
          }
        },
        $inc: { 
          totalReferrals: 1,
          referralPoints: 50 
        },
        $set: { updatedAt: new Date() }
      }
    );

    // Add points history entry for referrer
    const pointsHistoryEntry = {
      date: new Date().toLocaleDateString('en-CA'),
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      reflection: `Referral bonus for inviting ${newUserName || 'a new user'}`,
      points: 50,
      type: 'referral'
    };

    await users.updateOne(
      { userId: referrer.userId },
      { 
        $push: { 
          history: { $each: [pointsHistoryEntry], $position: 0 }
        }
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Referral processed successfully',
      referrerId: referrer.userId
    });

  } catch (error) {
    console.error('POST /api/referrals error:', error);
    return NextResponse.json(
      { error: 'Failed to process referral', details: error.message },
      { status: 500 }
    );
  }
}