import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

// GET - Fetch messages for a room or last messages for all rooms
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');

    const client = await clientPromise;
    const db = client.db('positivity');
    const messages = db.collection('messages');
    const deletedMessages = db.collection('deletedMessages');
    const groups = db.collection('groups');

    // Get last messages for all GROUP rooms
    if (action === 'group-last-messages' && userId) {
      try {
        // Get all groups where user is a member
        const userGroups = await groups
          .find({
            'members.userId': userId
          })
          .toArray();

        const groupIds = userGroups.map(g => g.groupId);

        if (groupIds.length === 0) {
          return NextResponse.json({
            success: true,
            groupLastMessages: []
          });
        }

        // Get user's deleted messages
        const userDeletedMessages = await deletedMessages
          .find({ userId })
          .toArray();
        
        const deletedMessageIds = userDeletedMessages.map(dm => dm.messageId);

        const lastMessages = await messages.aggregate([
          {
            $match: {
              roomId: { $in: groupIds },
              isGroupMessage: true
            }
          },
          {
            $addFields: {
              messageId: {
                $concat: ['$roomId', '-', '$timestamp', '-', '$senderId']
              }
            }
          },
          {
            $match: {
              messageId: { $nin: deletedMessageIds }
            }
          },
          {
            $sort: { timestamp: -1 }
          },
          {
            $group: {
              _id: '$roomId',
              lastMessage: { $first: '$$ROOT' },
              allMessages: { $push: '$$ROOT' }
            }
          },
          {
            $addFields: {
              unreadCount: {
                $size: {
                  $filter: {
                    input: '$allMessages',
                    as: 'msg',
                    cond: {
                      $and: [
                        // Message NOT sent by current user
                        { $ne: ['$$msg.senderId', userId] },
                        // Current user is NOT in readBy array (or readBy doesn't exist)
                        {
                          $or: [
                            { $eq: [{ $ifNull: ['$$msg.readBy', []] }, []] },
                            { $not: { $in: [userId, { $ifNull: ['$$msg.readBy', []] }] } }
                          ]
                        }
                      ]
                    }
                  }
                }
              }
            }
          },
          {
            $project: {
              _id: 1,
              lastMessage: 1,
              unreadCount: 1
            }
          }
        ]).toArray();

        console.log('📨 Group last messages fetched:', lastMessages.length);
        lastMessages.forEach(msg => {
          console.log(`  ↳ Group ${msg._id}: ${msg.unreadCount} unread messages`);
        });

        return NextResponse.json({
          success: true,
          groupLastMessages: lastMessages
        });
      } catch (error) {
        console.error('Error fetching group last messages:', error);
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }
    }

    // Get last messages for all DIRECT MESSAGE rooms
    if (action === 'last-messages' && userId) {
      // Get user's deleted messages
      const userDeletedMessages = await deletedMessages
        .find({ userId })
        .toArray();
      
      const deletedMessageIds = userDeletedMessages.map(dm => dm.messageId);

      const lastMessages = await messages.aggregate([
        {
          $match: {
            $or: [
              { senderId: userId },
              { receiverId: userId }
            ],
            isGroupMessage: { $ne: true }
          }
        },
        {
          $addFields: {
            messageId: {
              $concat: ['$roomId', '-', '$timestamp', '-', '$senderId']
            }
          }
        },
        {
          $match: {
            messageId: { $nin: deletedMessageIds }
          }
        },
        {
          $sort: { timestamp: -1 }
        },
        {
          $group: {
            _id: '$roomId',
            lastMessage: { $first: '$$ROOT' },
            unreadCount: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$receiverId', userId] },
                      { $eq: ['$read', false] }
                    ]
                  },
                  1,
                  0
                ]
              }
            }
          }
        }
      ]).toArray();

      return NextResponse.json({
        success: true,
        lastMessages: lastMessages
      });
    }

    // Get messages for specific room
    if (!roomId) {
      return NextResponse.json(
        { error: 'roomId required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'userId required' },
        { status: 400 }
      );
    }

    // Get user's deleted messages for this room
    const userDeletedMessages = await deletedMessages
      .find({ userId, roomId })
      .toArray();
    
    const deletedMessageIds = userDeletedMessages.map(dm => dm.messageId);

    // Get messages for this room, sorted by timestamp
    // Include deleted messages (they will show as "This message was deleted")
    const chatMessages = await messages
      .find({ 
        roomId
      })
      .sort({ timestamp: 1 })
      .limit(100)
      .toArray();

    // Filter out messages deleted by this user (delete for me only)
    const filteredMessages = chatMessages.filter(msg => {
      const msgId = `${msg.roomId}-${msg.timestamp}-${msg.senderId}`;
      return !deletedMessageIds.includes(msgId);
    });

    console.log(`📨 Fetched ${filteredMessages.length} messages for room ${roomId}`);

    return NextResponse.json({
      success: true,
      messages: filteredMessages
    });

  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// POST - Create a new message
export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      roomId, 
      senderId, 
      receiverId, 
      content, 
      attachments, 
      timestamp, 
      isGroupMessage,
      senderName,
      delivered,
      deliveredAt
    } = body;

    if (!roomId || !senderId || !receiverId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('positivity');
    const messages = db.collection('messages');

    const now = new Date().toISOString();

    const message = {
      roomId,
      senderId,
      receiverId,
      content: content || '',
      attachments: attachments || [],
      timestamp: timestamp || now,
      delivered: delivered !== undefined ? delivered : true,
      deliveredAt: deliveredAt || now,
      read: false,
      readBy: isGroupMessage ? [senderId] : undefined,
      reactions: [],
      edited: false,
      deleted: false,
      isGroupMessage: isGroupMessage || false,
      senderName: senderName || undefined,
      createdAt: new Date()
    };

    const result = await messages.insertOne(message);

    console.log('✅ Message saved to DB:', {
      roomId,
      senderId,
      isGroupMessage,
      delivered: message.delivered,
      deliveredAt: message.deliveredAt,
      readBy: message.readBy
    });

    return NextResponse.json({
      success: true,
      message: { ...message, _id: result.insertedId }
    });

  } catch (error) {
    console.error('Error saving message:', error);
    return NextResponse.json(
      { error: 'Failed to save message' },
      { status: 500 }
    );
  }
}

// PATCH - Mark messages as read (kept for backward compatibility)
export async function PATCH(request) {
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
          senderId: { $ne: userId },
          isGroupMessage: true,
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
          read: false
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

// DELETE - Delete all messages in a room (cleanup)
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');
    const userId = searchParams.get('userId');

    if (!roomId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('positivity');
    const messages = db.collection('messages');

    const result = await messages.deleteMany({
      roomId: roomId,
      $or: [
        { senderId: userId },
        { receiverId: userId }
      ]
    });

    return NextResponse.json({
      success: true,
      deletedCount: result.deletedCount
    });

  } catch (error) {
    console.error('Error deleting messages:', error);
    return NextResponse.json(
      { error: 'Failed to delete messages' },
      { status: 500 }
    );
  }
}
