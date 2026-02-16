// app/api/friends/status/route.js

import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const targetUserId = searchParams.get('targetUserId');

    if (!userId || !targetUserId) {
      return NextResponse.json(
        { error: 'userId and targetUserId required' },
        { status: 400 }
      );
    }

    if (userId === targetUserId) {
      return NextResponse.json({
        success: true,
        status: 'self'
      });
    }

    const client = await clientPromise;
    const db = client.db('positivity');
    const friendships = db.collection('friendships');

    // Check friendship status
    const friendship = await friendships.findOne({
      $or: [
        { userId: userId, friendId: targetUserId },
        { userId: targetUserId, friendId: userId }
      ]
    });

    let status = 'none';
    if (friendship) {
      if (friendship.status === 'accepted') {
        status = 'friends';
      } else if (friendship.status === 'pending') {
        status = friendship.userId === userId ? 'pending_sent' : 'pending_received';
      }
    }

    return NextResponse.json({
      success: true,
      status
    });

  } catch (error) {
    console.error('Error checking friendship status:', error);
    return NextResponse.json(
      { error: 'Failed to check friendship status' },
      { status: 500 }
    );
  }
}