// app/api/ventout/comment/like/route.js

import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request) {
  try {
    const body = await request.json();
    const { ventId, commentIndex, replyIndex, userId } = body;

    if (!ventId || commentIndex === undefined || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('positivity');
    const vents = db.collection('vents');

    const vent = await vents.findOne({ _id: new ObjectId(ventId) });
    
    if (!vent || !vent.comments || !vent.comments[commentIndex]) {
      return NextResponse.json(
        { success: false, error: 'Comment not found' },
        { status: 404 }
      );
    }

    let updateQuery;
    let hasLiked;

    if (replyIndex !== null && replyIndex !== undefined) {
      // Like a reply
      const reply = vent.comments[commentIndex].replies?.[replyIndex];
      if (!reply) {
        return NextResponse.json(
          { success: false, error: 'Reply not found' },
          { status: 404 }
        );
      }

      hasLiked = reply.likes?.includes(userId);
      
      const replyPath = `comments.${commentIndex}.replies.${replyIndex}`;
      
      if (hasLiked) {
        updateQuery = {
          $pull: { [`${replyPath}.likes`]: userId },
          $inc: { [`${replyPath}.likeCount`]: -1 }
        };
      } else {
        updateQuery = {
          $push: { [`${replyPath}.likes`]: userId },
          $inc: { [`${replyPath}.likeCount`]: 1 }
        };
      }
    } else {
      // Like a main comment
      const comment = vent.comments[commentIndex];
      hasLiked = comment.likes?.includes(userId);
      
      if (hasLiked) {
        updateQuery = {
          $pull: { [`comments.${commentIndex}.likes`]: userId },
          $inc: { [`comments.${commentIndex}.likeCount`]: -1 }
        };
      } else {
        updateQuery = {
          $push: { [`comments.${commentIndex}.likes`]: userId },
          $inc: { [`comments.${commentIndex}.likeCount`]: 1 }
        };
      }
    }

    await vents.updateOne(
      { _id: new ObjectId(ventId) },
      updateQuery
    );

    return NextResponse.json({ 
      success: true, 
      liked: !hasLiked 
    });
  } catch (error) {
    console.error('Error liking comment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to like comment' },
      { status: 500 }
    );
  }
}