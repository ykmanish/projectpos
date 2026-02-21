import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST(request) {
  try {
    const body = await request.json();
    const { approvalId, groupId, respondedBy, approved } = body;

    if (!approvalId || !groupId || !respondedBy) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('positivity');
    const approvals = db.collection('pending_approvals');
    const groups = db.collection('groups');
    const actionLogs = db.collection('ai_action_logs');

    // Verify the responder is an admin
    const group = await groups.findOne({ groupId });
    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    const adminMember = group.members.find(m => m.userId === respondedBy);
    if (!adminMember || adminMember.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can respond to approvals' },
        { status: 403 }
      );
    }

    // Get the approval request
    const approval = await approvals.findOne({ id: approvalId, groupId });
    if (!approval) {
      return NextResponse.json(
        { error: 'Approval request not found' },
        { status: 404 }
      );
    }

    // Update approval status
    await approvals.updateOne(
      { id: approvalId },
      { 
        $set: { 
          status: approved ? 'approved' : 'rejected',
          respondedBy,
          respondedAt: new Date().toISOString()
        }
      }
    );

    // Log the action
    await actionLogs.insertOne({
      groupId,
      action: approved ? 'action_approved' : 'action_rejected',
      details: {
        approvalId,
        action: approval.action,
        target: approval.target,
        reason: approval.reason,
        respondedBy
      },
      status: 'success',
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      approved,
      request: approval
    });

  } catch (error) {
    console.error('Error responding to approval:', error);
    return NextResponse.json(
      { error: 'Failed to process response' },
      { status: 500 }
    );
  }
}