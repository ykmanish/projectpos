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
    const blocks = db.collection('blocks');
    const users = db.collection('users');

    // Find all blocked users
    const blockedEntries = await blocks.find({ userId }).toArray();
    
    const blockedIds = blockedEntries.map(entry => entry.blockedId);
    
    // Get blocked user details
    const blockedUsers = await users.find(
      { userId: { $in: blockedIds } },
      { projection: { userId: 1, name: 1, preferredName: 1, username: 1, avatar: 1 } }
    ).toArray();

    const formattedBlocked = blockedUsers.map(user => ({
      userId: user.userId,
      userName: user.preferredName || user.name,
      username: user.username,
      avatar: user.avatar ? JSON.parse(user.avatar) : null
    }));

    return NextResponse.json({
      success: true,
      blocked: formattedBlocked
    });

  } catch (error) {
    console.error('Error fetching blocked users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blocked users' },
      { status: 500 }
    );
  }
}