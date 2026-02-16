// app/api/friends/request/reject/route.js

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

    // Delete the request (reject)
    const result = await friendships.deleteOne({
      _id: new ObjectId(requestId),
      friendId: userId,
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
      message: 'Friend request rejected'
    });

  } catch (error) {
    console.error('Error rejecting friend request:', error);
    return NextResponse.json(
      { error: 'Failed to reject friend request' },
      { status: 500 }
    );
  }
}