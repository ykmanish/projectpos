// app/api/friends/route.js

import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

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
    const blocks = db.collection('blocks');

    // Find all accepted friendships for this user
    const friendsList = await friendships.find({
      $or: [
        { userId: userId, status: 'accepted' },
        { friendId: userId, status: 'accepted' }
      ]
    }).toArray();

    // Get friend IDs
    const friendIds = friendsList.map(f => 
      f.userId === userId ? f.friendId : f.userId
    );

    // If no friends, return empty array
    if (friendIds.length === 0) {
      return NextResponse.json({
        success: true,
        friends: []
      });
    }

    // Get all blocked users
    const blockedEntries = await blocks.find({ userId }).toArray();
    const blockedIds = new Set(blockedEntries.map(b => b.blockedId));

    // Get friend details
    const friends = await users.find(
      { userId: { $in: friendIds } },
      { projection: { userId: 1, name: 1, preferredName: 1, username: 1, avatar: 1 } }
    ).toArray();

    // Format response with block status
    const formattedFriends = friends.map(f => {
      // Parse avatar if it exists
      let parsedAvatar = null;
      if (f.avatar) {
        try {
          parsedAvatar = typeof f.avatar === 'string' ? JSON.parse(f.avatar) : f.avatar;
        } catch (e) {
          console.error('Failed to parse avatar for user:', f.userId, e);
        }
      }

      return {
        userId: f.userId,
        userName: f.preferredName || f.name,
        username: f.username,
        avatar: parsedAvatar,
        isBlocked: blockedIds.has(f.userId) // Add block status
      };
    });

    return NextResponse.json({
      success: true,
      friends: formattedFriends
    });

  } catch (error) {
    console.error('Error fetching friends:', error);
    return NextResponse.json(
      { error: 'Failed to fetch friends' },
      { status: 500 }
    );
  }
}