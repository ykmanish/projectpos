import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    const userId = searchParams.get('userId');

    if (!username) {
      return NextResponse.json({ error: 'username required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('positivity');
    const users = db.collection('users');

    const existing = await users.findOne({ username, userId: { $ne: userId } });
    return NextResponse.json({ available: !existing });
  } catch (error) {
    console.error('Check username error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}