import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

// POST - Add member, change role, remove member
export async function POST(request) {
  try {
    const body = await request.json();
    const { groupId, adminId, action, targetUserId, role } = body;

    if (!groupId || !adminId || !action || !targetUserId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('positivity');
    const groups = db.collection('groups');

    // Get group and verify admin
    const group = await groups.findOne({ groupId });
    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    const adminMember = group.members.find(m => m.userId === adminId);
    if (!adminMember || adminMember.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can manage members' },
        { status: 403 }
      );
    }

    // Check if target is the last admin
    if (targetUserId !== adminId) {
      const targetMember = group.members.find(m => m.userId === targetUserId);
      if (targetMember?.role === 'admin') {
        const adminCount = group.members.filter(m => m.role === 'admin').length;
        if (adminCount <= 1 && (action === 'demote' || action === 'remove')) {
          return NextResponse.json(
            { error: 'Cannot remove the last admin' },
            { status: 400 }
          );
        }
      }
    }

    let result;

    switch (action) {
      case 'add':
        // Check if already member
        if (group.members.some(m => m.userId === targetUserId)) {
          return NextResponse.json(
            { error: 'User is already a member' },
            { status: 400 }
          );
        }

        result = await groups.updateOne(
          { groupId },
          {
            $push: {
              members: {
                userId: targetUserId,
                role: 'member',
                joinedAt: new Date().toISOString(),
                addedBy: adminId
              }
            }
          }
        );
        break;

      case 'remove':
        result = await groups.updateOne(
          { groupId },
          {
            $pull: {
              members: { userId: targetUserId }
            }
          }
        );
        break;

      case 'promote':
        result = await groups.updateOne(
          { 
            groupId,
            'members.userId': targetUserId 
          },
          {
            $set: {
              'members.$.role': 'admin'
            }
          }
        );
        break;

      case 'demote':
        result = await groups.updateOne(
          { 
            groupId,
            'members.userId': targetUserId 
          },
          {
            $set: {
              'members.$.role': 'member'
            }
          }
        );
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    // Get updated group with member details
    const updatedGroup = await groups.findOne({ groupId });

    return NextResponse.json({
      success: true,
      group: updatedGroup
    });

  } catch (error) {
    console.error('Error managing group members:', error);
    return NextResponse.json(
      { error: 'Failed to manage members' },
      { status: 500 }
    );
  }
}