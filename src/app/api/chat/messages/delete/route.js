import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST(request) {
  try {
    const body = await request.json();
    const { roomId, timestamp, senderId, deleteForEveryone, isGroupMessage } = body;

    if (!roomId || !timestamp || !senderId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('positivity');
    const messages = db.collection('messages');

    if (deleteForEveryone) {
      // Mark message as deleted for everyone (keep the message but mark it)
      const result = await messages.updateOne(
        {
          roomId: roomId,
          timestamp: timestamp,
          senderId: senderId
        },
        {
          $set: {
            deleted: true,
            deletedAt: new Date().toISOString(),
            content: 'This message was deleted',
            attachments: []
          }
        }
      );

      console.log(`🗑️ Marked message as deleted for everyone: ${result.modifiedCount} modified`);

      return NextResponse.json({
        success: true,
        modifiedCount: result.modifiedCount
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid delete operation'
    });

  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json(
      { error: 'Failed to delete message' },
      { status: 500 }
    );
  }
}
