import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

// GET - Fetch AI action logs for a group
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');
    const limit = parseInt(searchParams.get('limit') || '100');

    if (!groupId) {
      return NextResponse.json(
        { error: 'Group ID required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('positivity');
    const actionLogs = db.collection('ai_action_logs');

    const logs = await actionLogs
      .find({ groupId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();

    return NextResponse.json({
      success: true,
      logs
    });

  } catch (error) {
    console.error('Error fetching AI action logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch logs' },
      { status: 500 }
    );
  }
}

// POST - Save an AI action log
export async function POST(request) {
  try {
    const body = await request.json();
    const { groupId, log } = body;

    if (!groupId || !log) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('positivity');
    const actionLogs = db.collection('ai_action_logs');

    const logData = {
      ...log,
      groupId,
      savedAt: new Date().toISOString()
    };

    await actionLogs.insertOne(logData);

    return NextResponse.json({
      success: true
    });

  } catch (error) {
    console.error('Error saving AI action log:', error);
    return NextResponse.json(
      { error: 'Failed to save log' },
      { status: 500 }
    );
  }
}