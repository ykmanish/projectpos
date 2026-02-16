// app/api/friends/requests/route.js

import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('positivity');
    const friendships = db.collection('friendships');
    const users = db.collection('users');

    // Find pending requests where this user is the friendId (received requests)
    const requests = await friendships.find({
      friendId: userId,
      status: 'pending'
    }).sort({ createdAt: -1 }).toArray();

    // Get requester details
    const requesterIds = requests.map(r => r.userId);
    const requesters = await users.find(
      { userId: { $in: requesterIds } },
      { projection: { userId: 1, name: 1, preferredName: 1, username: 1, avatar: 1 } }
    ).toArray();

    // Format response
    const formattedRequests = requests.map(request => {
      const requester = requesters.find(r => r.userId === request.userId);
      return {
        _id: request._id.toString(),
        userId: request.userId,
        userName: requester?.preferredName || requester?.name || 'Unknown',
        username: requester?.username,
        avatar: requester?.avatar ? JSON.parse(requester.avatar) : null,
        sentAt: request.createdAt
      };
    });

    return NextResponse.json({
      success: true,
      requests: formattedRequests
    });

  } catch (error) {
    console.error('Error fetching friend requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch friend requests' },
      { status: 500 }
    );
  }
}