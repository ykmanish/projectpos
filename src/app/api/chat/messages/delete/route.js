import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      roomId, 
      timestamp, 
      senderId, 
      deleteForEveryone, 
      isGroupMessage,
      deletedBy,
      deletedByAdmin,
      deletedByName
    } = body;

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
      // Prepare update data
      const updateData = {
        deleted: true,
        deletedAt: new Date().toISOString(),
        attachments: []
      };

      // If this is an admin deletion, preserve that info
      if (deletedByAdmin) {
        updateData.deletedByAdmin = true;
        updateData.deletedBy = deletedBy;
        updateData.deletedByName = deletedByName;
        updateData.content = `This message was deleted by admin (${deletedByName})`;
      } else {
        updateData.content = 'This message was deleted';
      }

      const result = await messages.updateOne(
        {
          roomId: roomId,
          timestamp: timestamp,
          senderId: senderId
        },
        {
          $set: updateData
        }
      );

      console.log(`🗑️ Marked message as deleted for everyone:`, {
        modifiedCount: result.modifiedCount,
        isAdminDelete: deletedByAdmin,
        deletedByName: deletedByName
      });

      return NextResponse.json({
        success: true,
        modifiedCount: result.modifiedCount,
        deletedByAdmin,
        deletedByName
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