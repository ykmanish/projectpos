// app/api/user/contacts/route.js
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('positivity');
    
    // Get all accepted friendships for this user
    const friendships = db.collection('friendships');
    const users = db.collection('users');
    
    // Find all accepted friendships
    const friendsList = await friendships.find({
      $or: [
        { userId: userId, status: 'accepted' },
        { friendId: userId, status: 'accepted' }
      ]
    }).toArray();

    // Get friend IDs
    const friendIds = friendsList.map(f => 
      f.userId === userId ? f.friendId : f.userId
    );

    if (friendIds.length === 0) {
      return NextResponse.json({
        success: true,
        contacts: []
      });
    }

    // Get friend details
    const friends = await users.find(
      { userId: { $in: friendIds } },
      { 
        projection: { 
          userId: 1, 
          name: 1, 
          preferredName: 1, 
          username: 1, 
          avatar: 1,
          lastSeen: 1 
        } 
      }
    ).toArray();

    // Get recent chats to add last message info
    const messages = db.collection('messages');
    
    const contactsWithRecent = await Promise.all(
      friends.map(async (friend) => {
        // Find the last message between current user and this contact
        const roomId = [userId, friend.userId].sort().join('-');
        
        const lastMessage = await messages
          .find({
            roomId: roomId,
            $or: [
              { senderId: userId, receiverId: friend.userId },
              { senderId: friend.userId, receiverId: userId }
            ]
          })
          .sort({ timestamp: -1 })
          .limit(1)
          .toArray();

        // Parse avatar
        let parsedAvatar = null;
        if (friend.avatar) {
          try {
            parsedAvatar = typeof friend.avatar === 'string' 
              ? JSON.parse(friend.avatar) 
              : friend.avatar;
          } catch (e) {
            console.error('Failed to parse avatar:', e);
          }
        }

        return {
          userId: friend.userId,
          userName: friend.preferredName || friend.name,
          username: friend.username,
          avatar: parsedAvatar,
          lastMessageAt: lastMessage[0]?.timestamp,
          lastMessage: lastMessage[0]?.content,
          lastSeen: friend.lastSeen
        };
      })
    );

    // Sort by last message time (most recent first)
    contactsWithRecent.sort((a, b) => {
      if (!a.lastMessageAt) return 1;
      if (!b.lastMessageAt) return -1;
      return new Date(b.lastMessageAt) - new Date(a.lastMessageAt);
    });

    return NextResponse.json({
      success: true,
      contacts: contactsWithRecent
    });

  } catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}