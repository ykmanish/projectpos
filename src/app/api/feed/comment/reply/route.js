import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request) {
  try {
    const { postId, commentIndex, userId, userName, avatar, reply, replyToUserName } = await request.json();

    if (!postId || commentIndex === undefined || !userId || !userName || !reply) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('positivity');
    const feedPosts = db.collection('feedPosts');

    const newReply = {
      userId,
      userName,
      userAvatar: avatar,
      text: reply,
      timestamp: new Date(),
      likes: [],
      likeCount: 0,
      replyToUserName: replyToUserName || null
    };

    await feedPosts.updateOne(
      { _id: new ObjectId(postId) },
      {
        $push: { [`comments.${commentIndex}.replies`]: newReply }
      }
    );

    return NextResponse.json({
      success: true,
      reply: newReply
    });

  } catch (error) {
    console.error('Error adding reply:', error);
    return NextResponse.json(
      { error: 'Failed to add reply' },
      { status: 500 }
    );
  }
}
