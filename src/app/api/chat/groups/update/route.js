import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST(request) {
  try {
    const body = await request.json();
    const { groupId, name, description, avatar } = body;

    if (!groupId) {
      return NextResponse.json(
        { error: 'Group ID is required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('positivity');
    const groups = db.collection('groups');

    const updateData = {};
    if (name) updateData.groupName = name;
    if (description !== undefined) updateData.description = description;
    if (avatar) updateData.avatar = avatar;

    const result = await groups.updateOne(
      { groupId: groupId },
      { 
        $set: {
          ...updateData,
          updatedAt: new Date().toISOString()
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    console.log('✅ Group updated:', groupId);

    return NextResponse.json({
      success: true,
      message: 'Group updated successfully'
    });

  } catch (error) {
    console.error('Error updating group:', error);
    return NextResponse.json(
      { error: 'Failed to update group' },
      { status: 500 }
    );
  }
}
