import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST(request) {
  try {
    const { userId, friendId } = await request.json();

    if (!userId || !friendId) {
      return NextResponse.json(
        { error: 'userId and friendId required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('positivity');
    const friendships = db.collection('friendships');

    // Delete the friendship
    const result = await friendships.deleteOne({
      $or: [
        { userId: userId, friendId: friendId },
        { userId: friendId, friendId: userId }
      ]
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Friendship not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Unfriended successfully'
    });

  } catch (error) {
    console.error('Error unfriending:', error);
    return NextResponse.json(
      { error: 'Failed to unfriend' },
      { status: 500 }
    );
  }
}