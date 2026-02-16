import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { customAlphabet } from 'nanoid';

const generateGroupCode = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 6);

export async function POST(request) {
  try {
    const body = await request.json();
    const { groupId, userId } = body;

    if (!groupId || !userId) {
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

    const member = group.members.find(m => m.userId === userId);
    if (!member || member.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can regenerate invite code' },
        { status: 403 }
      );
    }

    // Generate new invite code
    const newInviteCode = generateGroupCode();

    await groups.updateOne(
      { groupId },
      { $set: { inviteCode: newInviteCode } }
    );

    return NextResponse.json({
      success: true,
      inviteCode: newInviteCode
    });

  } catch (error) {
    console.error('Error regenerating invite code:', error);
    return NextResponse.json(
      { error: 'Failed to regenerate invite code' },
      { status: 500 }
    );
  }
}