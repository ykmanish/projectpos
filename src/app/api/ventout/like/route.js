// app/api/ventout/like/route.js

import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request) {
  try {
    const body = await request.json();
    const { ventId, userId } = body;

    if (!ventId || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('positivity');
    const vents = db.collection('vents');

    const vent = await vents.findOne({ _id: new ObjectId(ventId) });
    
    if (!vent) {
      return NextResponse.json(
        { success: false, error: 'Vent not found' },
        { status: 404 }
      );
    }

    const hasLiked = vent.likes?.includes(userId);
    
    if (hasLiked) {
      // Unlike
      await vents.updateOne(
        { _id: new ObjectId(ventId) },
        { 
          $pull: { likes: userId },
          $inc: { likeCount: -1 }
        }
      );
    } else {
      // Like
      await vents.updateOne(
        { _id: new ObjectId(ventId) },
        { 
          $push: { likes: userId },
          $inc: { likeCount: 1 }
        }
      );
    }

    return NextResponse.json({ 
      success: true, 
      liked: !hasLiked 
    });
  } catch (error) {
    console.error('Error liking vent:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to like vent' },
      { status: 500 }
    );
  }
}