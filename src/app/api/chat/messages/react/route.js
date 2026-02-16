import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST(request) {
  try {
    const body = await request.json();
    const { roomId, timestamp, senderId, reactions } = body;

    if (!roomId || !timestamp || !senderId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('positivity');
    const messages = db.collection('messages');

    const result = await messages.updateOne(
      { roomId, timestamp, senderId },
      {
        $set: {
          reactions: reactions || []
        }
      }
    );

    return NextResponse.json({
      success: true,
      modified: result.modifiedCount > 0
    });

  } catch (error) {
    console.error('Error reacting to message:', error);
    return NextResponse.json(
      { error: 'Failed to react to message' },
      { status: 500 }
    );
  }
}
