// app/api/friends/request/accept/route.js

import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request) {
  try {
    const { userId, requestId } = await request.json();

    if (!userId || !requestId) {
      return NextResponse.json(
        { error: 'userId and requestId required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('positivity');
    const friendships = db.collection('friendships');

    // Find and update the request
    const result = await friendships.updateOne(
      { 
        _id: new ObjectId(requestId),
        friendId: userId,
        status: 'pending'
      },
      {
        $set: {
          status: 'accepted',
          acceptedAt: new Date(),
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Friend request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Friend request accepted'
    });

  } catch (error) {
    console.error('Error accepting friend request:', error);
    return NextResponse.json(
      { error: 'Failed to accept friend request' },
      { status: 500 }
    );
  }
}