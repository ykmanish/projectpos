// app/api/friends/request/route.js

import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST(request) {
  try {
    const { userId, targetUserId } = await request.json();

    if (!userId || !targetUserId) {
      return NextResponse.json(
        { error: 'userId and targetUserId required' },
        { status: 400 }
      );
    }

    if (userId === targetUserId) {
      return NextResponse.json(
        { error: 'Cannot send friend request to yourself' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('positivity');
    const friendships = db.collection('friendships');

    // Check if friendship already exists
    const existing = await friendships.findOne({
      $or: [
        { userId: userId, friendId: targetUserId },
        { userId: targetUserId, friendId: userId }
      ]
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Friendship already exists or request pending' },
        { status: 400 }
      );
    }

    // Create new friend request
    const newRequest = {
      userId: userId,
      friendId: targetUserId,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await friendships.insertOne(newRequest);

    return NextResponse.json({
      success: true,
      message: 'Friend request sent'
    });

  } catch (error) {
    console.error('Error sending friend request:', error);
    return NextResponse.json(
      { error: 'Failed to send friend request' },
      { status: 500 }
    );
  }
}