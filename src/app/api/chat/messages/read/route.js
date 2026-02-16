import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST(request) {
  try {
    const body = await request.json();
    const { roomId, userId, isGroupMessage } = body;

    if (!roomId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('positivity');
    const messages = db.collection('messages');

    let result;

    if (isGroupMessage) {
      console.log(`📖 Marking group messages as read for user ${userId} in room ${roomId}`);
      
      // For group messages, add userId to readBy array
      result = await messages.updateMany(
        {
          roomId: roomId,
          senderId: { $ne: userId }, // Don't mark own messages
          isGroupMessage: true,
          deleted: { $ne: true },
          $or: [
            { readBy: { $exists: false } },
            { readBy: { $not: { $in: [userId] } } }
          ]
        },
        {
          $addToSet: { readBy: userId },
          $set: { 
            read: true,
            readAt: new Date().toISOString() 
          }
        }
      );
      
      console.log(`✅ Marked ${result.modifiedCount} group messages as read for user ${userId}`);
    } else {
      console.log(`📖 Marking direct messages as read in room ${roomId}`);
      
      // For direct messages, use the old method
      result = await messages.updateMany(
        {
          roomId: roomId,
          receiverId: userId,
          read: false,
          deleted: { $ne: true }
        },
        {
          $set: { 
            read: true, 
            readAt: new Date().toISOString() 
          }
        }
      );
      
      console.log(`✅ Marked ${result.modifiedCount} direct messages as read`);
    }

    return NextResponse.json({
      success: true,
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark messages as read' },
      { status: 500 }
    );
  }
}
