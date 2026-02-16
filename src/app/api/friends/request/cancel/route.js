// app/api/friends/request/cancel/route.js

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

    const client = await clientPromise;
    const db = client.db('positivity');
    const friendships = db.collection('friendships');

    // Delete the pending request
    const result = await friendships.deleteOne({
      userId: userId,
      friendId: targetUserId,
      status: 'pending'
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Friend request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Friend request cancelled'
    });

  } catch (error) {
    console.error('Error cancelling friend request:', error);
    return NextResponse.json(
      { error: 'Failed to cancel friend request' },
      { status: 500 }
    );
  }
}