// app/api/ventout/route.js

import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request) {
  try {
    const client = await clientPromise;
    const db = client.db('positivity');
    const vents = db.collection('vents');

    const allVents = await vents
      .find({})
      .sort({ timestamp: -1 })
      .limit(50)
      .toArray();

    return NextResponse.json({ success: true, vents: allVents });
  } catch (error) {
    console.error('Error fetching vents:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch vents' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, userName, text, isAnonymous, avatar } = body;

    if (!userId || !text) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('positivity');
    const vents = db.collection('vents');

    const newVent = {
      userId,
      userName: isAnonymous ? 'Anonymous' : userName,
      originalUserId: isAnonymous ? null : userId, // Store original ID for moderation if needed
      text,
      isAnonymous,
      userAvatar: isAnonymous ? null : avatar,
      timestamp: new Date().toISOString(),
      likes: [],
      likeCount: 0,
      comments: [],
      commentCount: 0,
      reports: []
    };

    const result = await vents.insertOne(newVent);
    
    return NextResponse.json({ 
      success: true, 
      vent: { ...newVent, _id: result.insertedId } 
    });
  } catch (error) {
    console.error('Error creating vent:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create vent' },
      { status: 500 }
    );
  }
}