import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

// GET - Fetch pending approvals for a group
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
    const approvals = db.collection('pending_approvals');

    const pendingApprovals = await approvals
      .find({ 
        groupId,
        status: 'pending',
        expiresAt: { $gt: new Date().toISOString() }
      })
      .sort({ requestedAt: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      approvals: pendingApprovals
    });

  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch approvals' },
      { status: 500 }
    );
  }
}

// POST - Create a new pending approval
export async function POST(request) {
  try {
    const body = await request.json();
    const { groupId, approval } = body;

    if (!groupId || !approval) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('positivity');
    const approvals = db.collection('pending_approvals');

    // Set expiration to 30 minutes
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    const approvalData = {
      ...approval,
      groupId,
      expiresAt,
      createdAt: new Date().toISOString()
    };

    await approvals.insertOne(approvalData);

    return NextResponse.json({
      success: true,
      approval: approvalData
    });

  } catch (error) {
    console.error('Error creating pending approval:', error);
    return NextResponse.json(
      { error: 'Failed to create approval' },
      { status: 500 }
    );
  }
}