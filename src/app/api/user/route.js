// app/api/user/route.js (update the POST method)

import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    let client;
    try {
      client = await clientPromise;
    } catch (dbError) {
      console.error('MongoDB connection failed in GET:', dbError);
      return NextResponse.json(
        { error: 'Database connection error', details: dbError.message },
        { status: 503 }
      );
    }

    const db = client.db('positivity');
    const users = db.collection('users');

    const user = await users.findOne({ userId });
    if (!user) {
      return NextResponse.json({ user: { userId, points: 0, history: [] } });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('GET /api/user error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, name, action, entry } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    let client;
    try {
      client = await clientPromise;
    } catch (dbError) {
      console.error('MongoDB connection failed in POST:', dbError);
      return NextResponse.json(
        { error: 'Database connection error', details: dbError.message },
        { status: 503 }
      );
    }

    const db = client.db('positivity');
    const users = db.collection('users');

    // Save user name
    if (name) {
      const result = await users.findOneAndUpdate(
        { userId },
        { $set: { name } },
        { upsert: true, returnDocument: 'after' }
      );
      return NextResponse.json({ user: result.value });
    }

    // Add a point and reflection
    if (action === 'addPoint' && entry) {
      // Check if user already completed today's daily task
      if (entry.type === 'daily') {
        const todayStr = new Date().toLocaleDateString('en-CA');
        const existingUser = await users.findOne({ userId });
        
        const alreadyCompletedToday = existingUser?.history?.some(
          (h) => h.date === todayStr && h.type === 'daily'
        );

        if (alreadyCompletedToday) {
          return NextResponse.json(
            { error: 'Already completed today\'s task' },
            { status: 400 }
          );
        }
      }

      // Try to update existing document
      const updateResult = await users.updateOne(
        { userId },
        {
          $push: { history: { $each: [entry], $position: 0 } },
          $inc: { points: entry.points || 1 },
        }
      );

      if (updateResult.matchedCount === 0) {
        // No document exists – insert a new one with the first entry
        const newUser = {
          userId,
          points: entry.points || 1,
          history: [entry],
        };
        await users.insertOne(newUser);
        return NextResponse.json({ user: newUser });
      }

      // Document was updated – fetch the latest version
      const updatedUser = await users.findOne({ userId });
      return NextResponse.json({ user: updatedUser });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('POST /api/user error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}