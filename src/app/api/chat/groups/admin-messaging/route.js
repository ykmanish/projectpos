import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST(request) {
  try {
    const body = await request.json();
    const { groupId, userId, enabled } = body;

    if (!groupId || !userId || enabled === undefined) {
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
        { error: 'Only admins can modify admin messaging settings' },
        { status: 403 }
      );
    }

    // Update the group with admin messaging settings
    const result = await groups.updateOne(
      { groupId },
      {
        $set: {
          'settings.onlyAdminsCanMessage': enabled,
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

    console.log(`🔒 Admin messaging updated for group ${groupId}:`, { onlyAdminsCanMessage: enabled });

    return NextResponse.json({
      success: true,
      message: 'Admin messaging settings updated successfully',
      onlyAdminsCanMessage: enabled
    });

  } catch (error) {
    console.error('Error updating admin messaging:', error);
    return NextResponse.json(
      { error: 'Failed to update admin messaging settings' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch admin messaging settings
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
      { projection: { 'settings.onlyAdminsCanMessage': 1 } }
    );

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      onlyAdminsCanMessage: group.settings?.onlyAdminsCanMessage || false
    });

  } catch (error) {
    console.error('Error fetching admin messaging:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin messaging settings' },
      { status: 500 }
    );
  }
}