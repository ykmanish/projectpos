import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST(request) {
  try {
    const body = await request.json();
    const { roomId, timestamp, senderId, deliveredAt, isGroupMessage } = body;

    if (!roomId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('positivity');
    const messages = db.collection('messages');

    let query = {
      roomId: roomId,
      delivered: { $ne: true }
    };

    // For specific message delivery
    if (timestamp && senderId) {
      query = {
        roomId: roomId,
        timestamp: timestamp,
        senderId: senderId
      };
    }

    const result = await messages.updateMany(
      query,
      {
        $set: { 
          delivered: true, 
          deliveredAt: deliveredAt || new Date().toISOString() 
        }
      }
    );

    console.log(`✅ Marked ${result.modifiedCount} messages as delivered in room ${roomId}`);

    return NextResponse.json({
      success: true,
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    console.error('Error marking messages as delivered:', error);
    return NextResponse.json(
      { error: 'Failed to mark messages as delivered' },
      { status: 500 }
    );
  }
}
