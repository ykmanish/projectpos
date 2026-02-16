import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const targetId = searchParams.get('targetId');

    if (!userId || !targetId) {
      return NextResponse.json(
        { error: 'userId and targetId required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('positivity');
    const blocks = db.collection('blocks');

    // Check if user has blocked target
    const block = await blocks.findOne({ userId, blockedId: targetId });

    return NextResponse.json({
      success: true,
      isBlocked: !!block
    });

  } catch (error) {
    console.error('Error checking block status:', error);
    return NextResponse.json(
      { error: 'Failed to check block status' },
      { status: 500 }
    );
  }
}