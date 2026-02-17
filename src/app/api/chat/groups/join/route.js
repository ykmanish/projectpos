// app/api/chat/groups/join/route.js
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import crypto from 'crypto';

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
    const users = db.collection('users');
    const encryptionKeys = db.collection('encryptionKeys');
    const groupKeys = db.collection('groupEncryptionKeys');

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
      return NextResponse.json(
        { error: 'This group is invite-only. Only admins can add members.' },
        { status: 403 }
      );
    }

    // Get user details
    const user = await users.findOne({ userId });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const joinTimestamp = new Date().toISOString();

    // Add user to group
    const newMember = {
      userId,
      userName: user.preferredName || user.name,
      username: user.username,
      avatar: user.avatar,
      role: 'member',
      joinedAt: joinTimestamp,
      addedBy: 'self'
    };

    await groups.updateOne(
      { groupId: group.groupId },
      {
        $push: { members: newMember },
        $set: { updatedAt: joinTimestamp }
      }
    );

    // Handle encryption - share group key with new member
    try {
      // Get the group key document
      const groupKeyDoc = await groupKeys.findOne({ groupId: group.groupId });
      
      if (groupKeyDoc) {
        console.log('🔑 Found existing group key, sharing with new member...');
        
        // Get new member's public key
        const newMemberKeys = await encryptionKeys.findOne({ userId });
        
        if (newMemberKeys && newMemberKeys.publicKey) {
          // Get any existing member's encrypted key to decrypt the group key
          // We'll use the first admin's key if available, otherwise any member
          const anyMemberKey = groupKeyDoc.memberKeys.find(mk => mk.userId !== userId);
          
          if (anyMemberKey) {
            // Get that member's private key to decrypt the group key
            const memberKeys = await encryptionKeys.findOne({ userId: anyMemberKey.userId });
            
            if (memberKeys && memberKeys.privateKey) {
              try {
                // Decrypt the group key using existing member's private key
                const decryptedGroupKey = crypto.privateDecrypt(
                  {
                    key: memberKeys.privateKey,
                    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                    oaepHash: 'sha256'
                  },
                  Buffer.from(anyMemberKey.encryptedKey, 'base64')
                ).toString('base64');

                // Encrypt the group key for the new member
                const encryptedForNewMember = crypto.publicEncrypt(
                  {
                    key: newMemberKeys.publicKey,
                    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                    oaepHash: 'sha256'
                  },
                  Buffer.from(decryptedGroupKey, 'base64')
                ).toString('base64');

                // Add the new member's encrypted key
                await groupKeys.updateOne(
                  { groupId: group.groupId },
                  { 
                    $push: { 
                      memberKeys: {
                        userId,
                        encryptedKey: encryptedForNewMember
                      }
                    },
                    $set: { updatedAt: new Date() }
                  }
                );

                console.log('✅ Group key shared with new member');
              } catch (keyError) {
                console.error('❌ Error sharing group key:', keyError);
              }
            }
          }
        }
      } else {
        console.log('⚠️ No group key found for group, will be created when first message is sent');
      }
    } catch (encryptionError) {
      console.error('❌ Error handling group encryption:', encryptionError);
      // Continue even if encryption fails - group will still work but messages won't be encrypted
    }

    // Get updated group
    const updatedGroup = await groups.findOne({ groupId: group.groupId });

    return NextResponse.json({
      success: true,
      group: updatedGroup,
      joinTimestamp
    });

  } catch (error) {
    console.error('Error joining group:', error);
    return NextResponse.json(
      { error: 'Failed to join group' },
      { status: 500 }
    );
  }
}