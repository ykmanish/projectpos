// app/api/users/search/route.js

import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const currentUserId = searchParams.get('currentUserId');

    if (!query || !currentUserId) {
      return NextResponse.json(
        { error: 'Search query and currentUserId required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('positivity');
    const users = db.collection('users');

    // Search by username or name (case-insensitive)
    const searchResults = await users.find({
      $and: [
        { userId: { $ne: currentUserId } }, // Exclude current user
        {
          $or: [
            { username: { $regex: query, $options: 'i' } },
            { preferredName: { $regex: query, $options: 'i' } },
            { name: { $regex: query, $options: 'i' } }
          ]
        }
      ]
    })
    .limit(10)
    .project({
      userId: 1,
      name: 1,
      preferredName: 1,
      username: 1,
      avatar: 1,
      // Get reflection count
      history: { $size: '$history' }
    })
    .toArray();

    // Format results
    const formattedResults = searchResults.map(user => ({
      userId: user.userId,
      userName: user.preferredName || user.name,
      username: user.username,
      avatar: user.avatar ? JSON.parse(user.avatar) : null,
      totalReflections: user.history || 0,
      daysOnPlatform: Math.floor((new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24)) || 1
    }));

    return NextResponse.json({
      success: true,
      users: formattedResults
    });

  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json(
      { error: 'Failed to search users' },
      { status: 500 }
    );
  }
}