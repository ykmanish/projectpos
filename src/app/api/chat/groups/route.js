// src/app/api/chat/groups/route.js

import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { customAlphabet } from 'nanoid';

const generateGroupCode = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 6);

// GET - Fetch user's groups or specific group
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const groupId = searchParams.get('groupId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('positivity');
    const groups = db.collection('groups');
    const users = db.collection('users');

    if (groupId) {
      // Fetch specific group
      const group = await groups.findOne({ groupId });
      
      if (!group) {
        return NextResponse.json(
          { error: 'Group not found' },
          { status: 404 }
        );
      }

      // Get member details
      const memberIds = group.members.map(m => m.userId);
      const memberUsers = await users.find(
        { userId: { $in: memberIds } },
        { projection: { userId: 1, name: 1, preferredName: 1, username: 1, avatar: 1 } }
      ).toArray();

      const memberMap = {};
      memberUsers.forEach(user => {
        memberMap[user.userId] = {
          userId: user.userId,
          userName: user.preferredName || user.name,
          username: user.username,
          avatar: user.avatar
        };
      });

      // Enhance members with user details
      const enhancedMembers = group.members.map(member => ({
        ...member,
        ...memberMap[member.userId]
      }));

      return NextResponse.json({
        success: true,
        group: {
          ...group,
          members: enhancedMembers
        }
      });
    }

    // Fetch all groups for user
    const userGroups = await groups.find({
      'members.userId': userId
    }).sort({ lastActivity: -1 }).toArray();

    // Get all member IDs
    const allMemberIds = [...new Set(userGroups.flatMap(g => 
      g.members.map(m => m.userId)
    ))];

    const memberUsers = await users.find(
      { userId: { $in: allMemberIds } },
        { projection: { userId: 1, name: 1, preferredName: 1, username: 1, avatar: 1 } }
    ).toArray();

    const memberMap = {};
    memberUsers.forEach(user => {
      memberMap[user.userId] = {
        userId: user.userId,
        userName: user.preferredName || user.name,
        username: user.username,
        avatar: user.avatar
      };
    });

    // Enhance all groups with member details
    const enhancedGroups = userGroups.map(group => ({
      ...group,
      members: group.members.map(member => ({
        ...member,
        ...memberMap[member.userId]
      }))
    }));

    return NextResponse.json({
      success: true,
      groups: enhancedGroups
    });

  } catch (error) {
    console.error('Error fetching groups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch groups' },
      { status: 500 }
    );
  }
}

// POST - Create new group
export async function POST(request) {
  try {
    const body = await request.json();
    console.log('📝 Received group creation request:', body);
    
    const { name, description, createdBy, members = [], avatar } = body;

    if (!name || !createdBy) {
      return NextResponse.json(
        { error: 'Group name and creator required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('positivity');
    const groups = db.collection('groups');
    const users = db.collection('users');

    // Get creator details
    const creator = await users.findOne({ userId: createdBy });
    if (!creator) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      );
    }

    // Get member details
    let memberUsers = [];
    if (members.length > 0) {
      memberUsers = await users.find(
        { userId: { $in: members } },
        { projection: { userId: 1, name: 1, preferredName: 1, username: 1, avatar: 1 } }
      ).toArray();
    }

    // Generate unique group ID and code
    const groupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    let inviteCode = generateGroupCode();

    // Ensure unique invite code
    let existingGroup = await groups.findOne({ inviteCode });
    while (existingGroup) {
      inviteCode = generateGroupCode();
      existingGroup = await groups.findOne({ inviteCode });
    }

    // Build group members with full details
    const groupMembers = [
      {
        userId: createdBy,
        userName: creator.preferredName || creator.name,
        username: creator.username,
        avatar: creator.avatar,
        role: 'admin',
        joinedAt: new Date().toISOString(),
        addedBy: createdBy
      },
      ...memberUsers.map(user => ({
        userId: user.userId,
        userName: user.preferredName || user.name,
        username: user.username,
        avatar: user.avatar,
        role: 'member',
        joinedAt: new Date().toISOString(),
        addedBy: createdBy
      }))
    ];

    const group = {
      groupId,
      groupName: name,
      description: description || '',
      avatar: avatar || null,
      inviteCode,
      createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      members: groupMembers,
      settings: {
        allowMemberInvite: true,
        allowMemberPost: true,
        onlyAdminsCanMessage: false,
        slowMode: {
          enabled: false,
          cooldown: 30
        }
      },
      lastActivity: new Date().toISOString(),
      totalMessages: 0
    };

    console.log('💾 Saving group:', {
      groupId,
      name: group.groupName,
      membersCount: groupMembers.length,
      hasAvatar: !!group.avatar
    });

    const result = await groups.insertOne(group);

    console.log('✅ Group created successfully:', groupId);

    return NextResponse.json({
      success: true,
      group: {
        ...group,
        _id: result.insertedId
      }
    });

  } catch (error) {
    console.error('❌ Error creating group:', error);
    return NextResponse.json(
      { error: 'Failed to create group: ' + error.message },
      { status: 500 }
    );
  }
}

// PATCH - Update group settings
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { groupId, userId, updates } = body;

    if (!groupId || !userId || !updates) {
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
        { error: 'Only admins can update group settings' },
        { status: 403 }
      );
    }

    // Update allowed fields
    const allowedUpdates = {};
    
    if (updates.name !== undefined) {
      allowedUpdates.groupName = updates.name;
    }
    if (updates.description !== undefined) {
      allowedUpdates.description = updates.description;
    }
    if (updates.avatar !== undefined) {
      allowedUpdates.avatar = updates.avatar;
    }
    if (updates.allowMemberInvite !== undefined) {
      allowedUpdates['settings.allowMemberInvite'] = updates.allowMemberInvite;
    }
    if (updates.allowMemberPost !== undefined) {
      allowedUpdates['settings.allowMemberPost'] = updates.allowMemberPost;
    }
    if (updates.onlyAdminsCanMessage !== undefined) {
      allowedUpdates['settings.onlyAdminsCanMessage'] = updates.onlyAdminsCanMessage;
    }
    if (updates.slowMode !== undefined) {
      allowedUpdates['settings.slowMode'] = updates.slowMode;
    }

    allowedUpdates.updatedAt = new Date().toISOString();

    await groups.updateOne(
      { groupId },
      { $set: allowedUpdates }
    );

    const updatedGroup = await groups.findOne({ groupId });

    console.log('✅ Group updated successfully:', groupId);

    // REMOVED THE SOCKET EMISSION CODE - let the client handle socket events

    return NextResponse.json({
      success: true,
      group: updatedGroup
    });

  } catch (error) {
    console.error('Error updating group:', error);
    return NextResponse.json(
      { error: 'Failed to update group' },
      { status: 500 }
    );
  }
}

// DELETE - Delete group or leave group
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');

    if (!groupId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('positivity');
    const groups = db.collection('groups');

    const group = await groups.findOne({ groupId });
    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    const member = group.members.find(m => m.userId === userId);
    if (!member) {
      return NextResponse.json(
        { error: 'User is not a member of this group' },
        { status: 403 }
      );
    }

    if (action === 'delete') {
      // Check if user is admin
      if (member.role !== 'admin') {
        return NextResponse.json(
          { error: 'Only admins can delete the group' },
          { status: 403 }
        );
      }

      await groups.deleteOne({ groupId });
      console.log('✅ Group deleted:', groupId);

      // REMOVED THE SOCKET EMISSION CODE - let the client handle socket events

      return NextResponse.json({
        success: true,
        message: 'Group deleted successfully'
      });

    } else if (action === 'leave') {
      // Remove user from members
      const updatedMembers = group.members.filter(m => m.userId !== userId);

      // If no members left, delete the group
      if (updatedMembers.length === 0) {
        await groups.deleteOne({ groupId });
        console.log('✅ Group deleted (last member left):', groupId);
        
        return NextResponse.json({
          success: true,
          message: 'Left group successfully (group deleted)'
        });
      }

      // If the leaving user was an admin, promote the next member
      if (member.role === 'admin') {
        // Find the longest standing member to promote
        const sortedMembers = [...updatedMembers].sort(
          (a, b) => new Date(a.joinedAt) - new Date(b.joinedAt)
        );
        if (sortedMembers.length > 0) {
          sortedMembers[0].role = 'admin';
        }
      }

      await groups.updateOne(
        { groupId },
        { 
          $set: { 
            members: updatedMembers,
            updatedAt: new Date().toISOString()
          } 
        }
      );

      console.log('✅ User left group:', userId, groupId);

      // REMOVED THE SOCKET EMISSION CODE - let the client handle socket events

      return NextResponse.json({
        success: true,
        message: 'Left group successfully'
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "delete" or "leave"' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error deleting/leaving group:', error);
    return NextResponse.json(
      { error: 'Failed to process request: ' + error.message },
      { status: 500 }
    );
  }
}