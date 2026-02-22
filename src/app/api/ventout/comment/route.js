// app/api/ventout/comment/route.js

import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request) {
  try {
    const body = await request.json();
    const { ventId, userId, userName, avatar, comment, commentIndex, replyToUserName } = body;

    if (!ventId || !userId || !comment) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('positivity');
    const vents = db.collection('vents');

    const newComment = {
      userId,
      userName,
      userAvatar: avatar,
      text: comment,
      timestamp: new Date().toISOString(),
      likes: [],
      likeCount: 0,
      isAnonymous: userName === 'Anonymous'
    };

    let updateQuery;
    
    if (commentIndex !== undefined && commentIndex !== null) {
      // This is a reply to an existing comment
      newComment.replyToUserName = replyToUserName;
      
      updateQuery = {
        $push: { [`comments.${commentIndex}.replies`]: newComment },
        $inc: { commentCount: 1 }
      };
    } else {
      // This is a new top-level comment
      newComment.replies = [];
      
      updateQuery = {
        $push: { comments: newComment },
        $inc: { commentCount: 1 }
      };
    }

    await vents.updateOne(
      { _id: new ObjectId(ventId) },
      updateQuery
    );

    return NextResponse.json({ 
      success: true, 
      comment: newComment 
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add comment' },
      { status: 500 }
    );
  }
}