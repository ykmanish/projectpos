import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST(request) {
  try {
    const { userId, preferredName, primaryGoal, interests, reminderTime, currentMood } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('positivity');
    const users = db.collection('users');

    const updateData = {
      onboardingCompleted: true,
      updatedAt: new Date(),
    };

    if (preferredName) updateData.preferredName = preferredName.trim();
    if (primaryGoal) updateData.primaryGoal = primaryGoal;
    if (interests) updateData.interests = interests;
    if (reminderTime) updateData.reminderTime = reminderTime;
    if (currentMood) updateData.currentMood = currentMood;

    const result = await users.findOneAndUpdate(
      { userId },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!result.value) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const { password: _, ...userWithoutPassword } = result.value;

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Onboarding error:', error);
    return NextResponse.json(
      { error: 'Failed to complete onboarding', details: error.message },
      { status: 500 }
    );
  }
}
