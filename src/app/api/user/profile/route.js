import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function PUT(request) {
  try {
    const { userId, preferredName, username, avatar } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('positivity');
    const users = db.collection('users');

    // Check username uniqueness if provided
    if (username) {
      const existing = await users.findOne({ username, userId: { $ne: userId } });
      if (existing) {
        return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
      }
    }

    const updateData = {};
    if (preferredName) updateData.preferredName = preferredName.trim();
    if (username !== undefined) updateData.username = username || null;
    if (avatar) updateData.avatar = avatar; // avatar is a JSON string

    const result = await users.findOneAndUpdate(
      { userId },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!result.value) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { password, ...userWithoutPassword } = result.value;
    return NextResponse.json({ success: true, user: userWithoutPassword });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}