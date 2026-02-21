import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

// GET - Fetch AI permissions for a group
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
    const permissions = db.collection('ai_permissions');

    const aiPermissions = await permissions.findOne({ groupId });

    if (!aiPermissions) {
      // Return default permissions
      return NextResponse.json({
        success: true,
        permissions: {
          canModerate: false,
          canManageUsers: false,
          canCreateContent: false,
          canAccessInfo: true,
          canWarn: false,
          canMute: false,
          canKick: false,
          canBan: false,
          canDeleteMessages: false,
          permissions: [],
          temporaryPermissions: [],
          grantedBy: null,
          grantedAt: null,
          expiresAt: null
        }
      });
    }

    // Check if permissions have expired
    if (aiPermissions.expiresAt && new Date(aiPermissions.expiresAt) < new Date()) {
      // Permissions expired - reset to default
      await permissions.deleteOne({ groupId });
      
      return NextResponse.json({
        success: true,
        permissions: {
          canModerate: false,
          canManageUsers: false,
          canCreateContent: false,
          canAccessInfo: true,
          canWarn: false,
          canMute: false,
          canKick: false,
          canBan: false,
          canDeleteMessages: false,
          permissions: [],
          temporaryPermissions: [],
          grantedBy: null,
          grantedAt: null,
          expiresAt: null
        }
      });
    }

    return NextResponse.json({
      success: true,
      permissions: aiPermissions
    });

  } catch (error) {
    console.error('Error fetching AI permissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch permissions' },
      { status: 500 }
    );
  }
}

// POST - Grant or update AI permissions
export async function POST(request) {
  try {
    const body = await request.json();
    const { groupId, grantedBy, permissions, duration } = body;

    if (!groupId || !grantedBy) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('positivity');
    const permissionsColl = db.collection('ai_permissions');
    const groups = db.collection('groups');
    const actionLogs = db.collection('ai_action_logs');

    // Verify the granter is an admin
    const group = await groups.findOne({ groupId });
    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    const adminMember = group.members.find(m => m.userId === grantedBy);
    if (!adminMember || adminMember.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can grant permissions' },
        { status: 403 }
      );
    }

    const now = new Date();
    const expiresAt = duration ? new Date(now.getTime() + duration) : null;

    const permissionData = {
      groupId,
      ...permissions,
      grantedBy,
      grantedAt: now.toISOString(),
      expiresAt: expiresAt?.toISOString() || null,
      updatedAt: now.toISOString()
    };

    await permissionsColl.updateOne(
      { groupId },
      { $set: permissionData },
      { upsert: true }
    );

    // Log the action
    await actionLogs.insertOne({
      groupId,
      action: 'permissions_granted',
      details: {
        grantedBy,
        permissions,
        duration
      },
      status: 'success',
      timestamp: now.toISOString()
    });

    return NextResponse.json({
      success: true,
      permissions: permissionData
    });

  } catch (error) {
    console.error('Error granting AI permissions:', error);
    return NextResponse.json(
      { error: 'Failed to grant permissions' },
      { status: 500 }
    );
  }
}

// DELETE - Revoke AI permissions
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');
    const revokedBy = searchParams.get('userId');

    if (!groupId || !revokedBy) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('positivity');
    const permissions = db.collection('ai_permissions');
    const groups = db.collection('groups');
    const actionLogs = db.collection('ai_action_logs');

    // Verify the revoker is an admin
    const group = await groups.findOne({ groupId });
    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    const adminMember = group.members.find(m => m.userId === revokedBy);
    if (!adminMember || adminMember.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can revoke permissions' },
        { status: 403 }
      );
    }

    await permissions.deleteOne({ groupId });

    // Log the action
    await actionLogs.insertOne({
      groupId,
      action: 'permissions_revoked',
      details: {
        revokedBy
      },
      status: 'success',
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Permissions revoked'
    });

  } catch (error) {
    console.error('Error revoking AI permissions:', error);
    return NextResponse.json(
      { error: 'Failed to revoke permissions' },
      { status: 500 }
    );
  }
}