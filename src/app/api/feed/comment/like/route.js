import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request) {
  try {
    const { postId, commentIndex, replyIndex, userId } = await request.json();

    if (!postId || commentIndex === undefined || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('positivity');
    const feedPosts = db.collection('feedPosts');

    const post = await feedPosts.findOne({ _id: new ObjectId(postId) });
    
    if (!post || !post.comments || !post.comments[commentIndex]) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    let hasLiked;
    let update;

    if (replyIndex !== null && replyIndex !== undefined) {
      // Like/unlike a reply
      const reply = post.comments[commentIndex].replies?.[replyIndex];
      if (!reply) {
        return NextResponse.json(
          { error: 'Reply not found' },
          { status: 404 }
        );
      }

      hasLiked = reply.likes?.includes(userId);
      
      if (hasLiked) {
        // Unlike reply
        update = {
          $pull: { [`comments.${commentIndex}.replies.${replyIndex}.likes`]: userId },
          $inc: { [`comments.${commentIndex}.replies.${replyIndex}.likeCount`]: -1 }
        };
      } else {
        // Like reply
        update = {
          $push: { [`comments.${commentIndex}.replies.${replyIndex}.likes`]: userId },
          $inc: { [`comments.${commentIndex}.replies.${replyIndex}.likeCount`]: 1 }
        };
      }
    } else {
      // Like/unlike a comment
      const comment = post.comments[commentIndex];
      hasLiked = comment.likes?.includes(userId);
      
      if (hasLiked) {
        // Unlike comment
        update = {
          $pull: { [`comments.${commentIndex}.likes`]: userId },
          $inc: { [`comments.${commentIndex}.likeCount`]: -1 }
        };
      } else {
        // Like comment
        update = {
          $push: { [`comments.${commentIndex}.likes`]: userId },
          $inc: { [`comments.${commentIndex}.likeCount`]: 1 }
        };
      }
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
    console.error('Error toggling comment like:', error);
    return NextResponse.json(
      { error: 'Failed to toggle comment like' },
      { status: 500 }
    );
  }
}
