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

    const client = await clientPromise;
    const db = client.db('positivity');
    const blocks = db.collection('blocks');

    // Remove from blocks collection
    const result = await blocks.deleteOne({ userId, blockedId });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Block not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'User unblocked successfully'
    });

  } catch (error) {
    console.error('Error unblocking user:', error);
    return NextResponse.json(
      { error: 'Failed to unblock user' },
      { status: 500 }
    );
  }
}