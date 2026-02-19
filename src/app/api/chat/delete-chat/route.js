// app/api/chat/delete-chat/route.js

import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST(request) {
  try {
    const body = await request.json();
    const { roomId, userId, friendId } = body;

    if (!roomId || !userId || !friendId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('positivity');
    const messages = db.collection('messages');
    const deletedMessages = db.collection('deletedMessages');

    console.log(`🗑️ Deleting chat for user ${userId} in room ${roomId}`);

    // Get all messages in this room
    const roomMessages = await messages.find({ roomId }).toArray();

    // Mark all messages as deleted for this user
    const deletePromises = roomMessages.map(async (msg) => {
      const messageId = `${msg.roomId}-${msg.timestamp}-${msg.senderId}`;
      
      // Check if already deleted for this user
      const existing = await deletedMessages.findOne({ userId, messageId });
      
      if (!existing) {
        // Store in deletedMessages collection
        await deletedMessages.insertOne({
          userId,
          messageId,
          roomId: msg.roomId,
          timestamp: msg.timestamp,
          senderId: msg.senderId,
          deletedAt: new Date().toISOString(),
          createdAt: new Date()
        });
      }
    });

    await Promise.all(deletePromises);

    console.log(`✅ Chat deleted successfully for user ${userId}`);

    return NextResponse.json({
      success: true,
      message: 'Chat deleted successfully',
      deletedCount: roomMessages.length
    });

  } catch (error) {
    console.error('Error deleting chat:', error);
    return NextResponse.json(
      { error: 'Failed to delete chat' },
      { status: 500 }
    );
  }
}