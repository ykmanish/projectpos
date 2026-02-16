import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, messageId, roomId, timestamp, senderId } = body;

    if (!userId || !messageId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('positivity');
    const deletedMessages = db.collection('deletedMessages');

    // Store which messages this user has deleted (for their view only)
    const deletedRecord = {
      userId,
      messageId,
      roomId,
      timestamp,
      senderId,
      deletedAt: new Date().toISOString(),
      createdAt: new Date()
    };

    // Use upsert to avoid duplicates
    await deletedMessages.updateOne(
      { userId, messageId },
      { $set: deletedRecord },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Message deleted for you only'
    });

  } catch (error) {
    console.error('Error deleting message for user:', error);
    return NextResponse.json(
      { error: 'Failed to delete message' },
      { status: 500 }
    );
  }
}
