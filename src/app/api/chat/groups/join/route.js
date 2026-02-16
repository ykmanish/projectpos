import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST(request) {
  try {
    const body = await request.json();
    const { inviteCode, userId } = body;

    if (!inviteCode || !userId) {
      return NextResponse.json(
        { error: 'Invite code and userId required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('positivity');
    const groups = db.collection('groups');

    // Find group by invite code
    const group = await groups.findOne({ inviteCode: inviteCode.toUpperCase() });
    
    if (!group) {
      return NextResponse.json(
        { error: 'Invalid invite code' },
        { status: 404 }
      );
    }

    // Check if user is already a member
    const existingMember = group.members.find(m => m.userId === userId);
    if (existingMember) {
      return NextResponse.json(
        { error: 'You are already a member of this group' },
        { status: 400 }
      );
    }

    // Check if group allows member invites
    if (!group.settings?.allowMemberInvite) {
      const creator = group.members.find(m => m.role === 'admin');
      return NextResponse.json(
        { error: 'This group is invite-only. Only admins can add members.' },
        { status: 403 }
      );
    }

    // Add user to group
    const updatedGroup = await groups.findOneAndUpdate(
      { groupId: group.groupId },
      {
        $push: {
          members: {
            userId,
            role: 'member',
            joinedAt: new Date().toISOString(),
            addedBy: 'self'
          }
        }
      },
      { returnDocument: 'after' }
    );

    return NextResponse.json({
      success: true,
      group: updatedGroup.value
    });

  } catch (error) {
    console.error('Error joining group:', error);
    return NextResponse.json(
      { error: 'Failed to join group' },
      { status: 500 }
    );
  }
}