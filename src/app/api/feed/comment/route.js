import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request) {
  try {
    const { postId, userId, userName, avatar, comment } = await request.json();

    if (!postId || !userId || !userName || !comment) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('positivity');
    const feedPosts = db.collection('feedPosts');

    const newComment = {
      userId,
      userName,
      userAvatar: avatar,
      text: comment,
      timestamp: new Date(),
      likes: [],
      likeCount: 0,
      replies: []
    };

    await feedPosts.updateOne(
      { _id: new ObjectId(postId) },
      {
        $push: { comments: newComment },
        $inc: { commentCount: 1 }
      }
    );

    return NextResponse.json({
      success: true,
      comment: newComment
    });

  } catch (error) {
    console.error('Error adding comment:', error);
    return NextResponse.json(
      { error: 'Failed to add comment' },
      { status: 500 }
    );
  }
}
