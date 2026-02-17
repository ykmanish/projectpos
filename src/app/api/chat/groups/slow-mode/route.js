// app/api/chat/groups/slow-mode/route.js
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST(request) {
  try {
    const body = await request.json();
    const { groupId, userId, settings } = body;

    if (!groupId || !userId || settings === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('positivity');
    const groups = db.collection('groups');

    // Check if user is admin
    const group = await groups.findOne({ groupId });
    
    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    const member = group.members?.find(m => m.userId === userId);
    
    if (member?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can modify slow mode settings' },
        { status: 403 }
      );
    }

    // Update the group with slow mode settings
    const result = await groups.updateOne(
      { groupId },
      {
        $set: {
          'settings.slowMode': settings,
          updatedAt: new Date().toISOString()
        }
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'Failed to update settings' },
        { status: 500 }
      );
    }

    console.log(`⏱️ Slow mode updated for group ${groupId}:`, settings);

    return NextResponse.json({
      success: true,
      message: 'Slow mode settings updated successfully'
    });

  } catch (error) {
    console.error('Error updating slow mode:', error);
    return NextResponse.json(
      { error: 'Failed to update slow mode settings' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch slow mode settings
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');

    if (!groupId) {
      return NextResponse.json(
        { error: 'Group ID required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('positivity');
    const groups = db.collection('groups');

    const group = await groups.findOne(
      { groupId },
      { projection: { 'settings.slowMode': 1 } }
    );

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      slowMode: group.settings?.slowMode || { enabled: false, cooldown: 30 }
    });

  } catch (error) {
    console.error('Error fetching slow mode:', error);
    return NextResponse.json(
      { error: 'Failed to fetch slow mode settings' },
      { status: 500 }
    );
  }
}