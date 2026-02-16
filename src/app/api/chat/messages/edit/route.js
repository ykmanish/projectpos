import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST(request) {
  try {
    const body = await request.json();
    const { roomId, timestamp, senderId, content } = body;

    if (!roomId || !timestamp || !senderId || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('positivity');
    const messages = db.collection('messages');

    const result = await messages.updateOne(
      {
        roomId,
        timestamp,
        senderId
      },
      {
        $set: {
          content,
          edited: true,
          editedAt: new Date().toISOString()
        }
      }
    );

    return NextResponse.json({
      success: true,
      modified: result.modifiedCount > 0
    });

  } catch (error) {
    console.error('Error editing message:', error);
    return NextResponse.json(
      { error: 'Failed to edit message' },
      { status: 500 }
    );
  }
}
