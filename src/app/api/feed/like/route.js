// app/api/feed/like/route.js

import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST(request) {
  try {
    const { postId, userId } = await request.json();

    if (!postId || !userId) {
      return NextResponse.json(
        { error: 'postId and userId required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('positivity');
    const feedPosts = db.collection('feedPosts');
    const { ObjectId } = require('mongodb');

    const post = await feedPosts.findOne({ _id: new ObjectId(postId) });
    
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    const hasLiked = post.likes?.includes(userId);
    
    let update;
    if (hasLiked) {
      // Unlike
      update = {
        $pull: { likes: userId },
        $inc: { likeCount: -1 }
      };
    } else {
      // Like
      update = {
        $push: { likes: userId },
        $inc: { likeCount: 1 }
      };
    }

    await feedPosts.updateOne(
      { _id: new ObjectId(postId) },
      update
    );

    return NextResponse.json({
      success: true,
      liked: !hasLiked
    });

  } catch (error) {
    console.error('Error toggling like:', error);
    return NextResponse.json(
      { error: 'Failed to toggle like' },
      { status: 500 }
    );
  }
}