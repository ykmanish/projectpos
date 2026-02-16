import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST(request) {
  try {
    const { userId, blockedId } = await request.json();

    if (!userId || !blockedId) {
      return NextResponse.json(
        { error: 'userId and blockedId required' },
        { status: 400 }
      );
    }

    if (userId === blockedId) {
      return NextResponse.json(
        { error: 'Cannot block yourself' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('positivity');
    const blocks = db.collection('blocks');
    const friendships = db.collection('friendships');

    // Check if already blocked
    const existingBlock = await blocks.findOne({ userId, blockedId });
    if (existingBlock) {
      return NextResponse.json(
        { error: 'User already blocked' },
        { status: 400 }
      );
    }

    // DO NOT REMOVE FRIENDSHIP - Keep them as friends
    // Users can block friends without unfriending them
    // This allows them to unblock later and resume friendship

    // Add to blocks collection
    await blocks.insertOne({
      userId,
      blockedId,
      createdAt: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'User blocked successfully'
    });

  } catch (error) {
    console.error('Error blocking user:', error);
    return NextResponse.json(
      { error: 'Failed to block user' },
      { status: 500 }
    );
  }
}
