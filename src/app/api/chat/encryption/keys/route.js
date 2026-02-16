// app/api/chat/encryption/route.js
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import crypto from 'crypto';

// Helper functions (inline to avoid import issues)
function generateKeyPair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });
  return { publicKey, privateKey };
}

function generateSharedSecret() {
  return crypto.randomBytes(32).toString('base64');
}

function encryptSharedSecret(sharedSecret, publicKey) {
  const encrypted = crypto.publicEncrypt(
    {
      key: publicKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    Buffer.from(sharedSecret, 'base64')
  );
  return encrypted.toString('base64');
}

function generateSafetyNumber(publicKey1, publicKey2) {
  const keys = [publicKey1, publicKey2].sort();
  const combined = keys.join('');
  const hash = crypto.createHash('sha256').update(combined).digest();
  
  const safetyNumber = [];
  for (let i = 0; i < 12; i++) {
    const chunk = hash.readUInt32BE(i * 4) % 100000;
    safetyNumber.push(chunk.toString().padStart(5, '0'));
  }
  return safetyNumber.join(' ');
}

function generateFingerprint(publicKey) {
  const hash = crypto.createHash('sha256').update(publicKey).digest('hex');
  return hash.match(/.{1,4}/g).slice(0, 8).join(' ').toUpperCase();
}

// GET - Retrieve keys or secrets
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const targetUserId = searchParams.get('targetUserId');
    const roomId = searchParams.get('roomId');
    const action = searchParams.get('action');

    console.log('🔍 GET /api/chat/encryption:', { userId, targetUserId, roomId, action });

    const client = await clientPromise;
    const db = client.db('positivity');
    const keys = db.collection('encryptionKeys');

    // Get user's own keys
    if (action === 'my-keys' && userId) {
      const userKeys = await keys.findOne({ userId });
      
      if (!userKeys) {
        console.log('❌ No keys found for user:', userId);
        return NextResponse.json({
          success: false,
          message: 'No keys found'
        }, { status: 404 });
      }

      console.log('✅ Keys found for user:', userId);
      return NextResponse.json({
        success: true,
        publicKey: userKeys.publicKey,
        privateKey: userKeys.privateKey,
        fingerprint: userKeys.fingerprint
      });
    }

    // Get shared secret for direct chat
    if (action === 'shared-secret' && userId && targetUserId) {
      const chatRoomId = [userId, targetUserId].sort().join('-');
      
      const sharedSecrets = db.collection('sharedSecrets');
      let secret = await sharedSecrets.findOne({ roomId: chatRoomId });

      if (!secret) {
        console.log('❌ No shared secret found for room:', chatRoomId);
        return NextResponse.json({
          success: false,
          message: 'No shared secret found'
        }, { status: 404 });
      }

      const userSecret = secret.secrets.find(s => s.userId === userId);
      
      if (!userSecret) {
        console.log('❌ No secret for user:', userId);
        return NextResponse.json({
          success: false,
          message: 'No secret for this user'
        }, { status: 404 });
      }

      console.log('✅ Shared secret found');
      return NextResponse.json({
        success: true,
        encryptedSecret: userSecret.encryptedSecret,
        isVerified: secret.isVerified || false,
        verifiedAt: secret.verifiedAt
      });
    }

    // Get group encryption key
    if (action === 'group-key' && userId && roomId) {
      const groupKeys = db.collection('groupEncryptionKeys');
      const groupKey = await groupKeys.findOne({ groupId: roomId });

      if (!groupKey) {
        console.log('❌ No group key found');
        return NextResponse.json({
          success: false,
          message: 'No group key found'
        }, { status: 404 });
      }

      const userKey = groupKey.memberKeys.find(mk => mk.userId === userId);

      if (!userKey) {
        console.log('❌ No key for user in group');
        return NextResponse.json({
          success: false,
          message: 'No key for this user'
        }, { status: 404 });
      }

      console.log('✅ Group key found');
      return NextResponse.json({
        success: true,
        encryptedKey: userKey.encryptedKey
      });
    }

    // Get safety number
    if (action === 'safety-number' && userId && targetUserId) {
      const [user1Keys, user2Keys] = await Promise.all([
        keys.findOne({ userId }),
        keys.findOne({ userId: targetUserId })
      ]);

      if (!user1Keys || !user2Keys) {
        return NextResponse.json({
          success: false,
          message: 'Keys not found'
        }, { status: 404 });
      }

      const safetyNumber = generateSafetyNumber(user1Keys.publicKey, user2Keys.publicKey);

      return NextResponse.json({
        success: true,
        safetyNumber,
        fingerprint1: user1Keys.fingerprint,
        fingerprint2: user2Keys.fingerprint
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid parameters' },
      { status: 400 }
    );

  } catch (error) {
    console.error('❌ Error in encryption API GET:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request', message: error.message },
      { status: 500 }
    );
  }
}

// POST - Generate keys or establish secrets
export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, action, targetUserId, roomId, isGroupRoom } = body;

    console.log('🔍 POST /api/chat/encryption:', { userId, action, targetUserId, roomId });

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('positivity');
    const keys = db.collection('encryptionKeys');
    const sharedSecrets = db.collection('sharedSecrets');

    // Generate new key pair
    if (action === 'generate-keys') {
      console.log('🔑 Generating keys for:', userId);
      
      const existingKeys = await keys.findOne({ userId });
      
      if (existingKeys) {
        console.log('✅ Keys already exist');
        return NextResponse.json({
          success: true,
          message: 'Keys already exist',
          publicKey: existingKeys.publicKey,
          privateKey: existingKeys.privateKey,
          fingerprint: existingKeys.fingerprint
        });
      }

      const { publicKey, privateKey } = generateKeyPair();
      const fingerprint = generateFingerprint(publicKey);

      await keys.insertOne({
        userId,
        publicKey,
        privateKey,
        fingerprint,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      console.log('✅ Generated new keys');

      return NextResponse.json({
        success: true,
        publicKey,
        privateKey,
        fingerprint
      });
    }

    // Establish shared secret for direct chat
    if (action === 'establish-secret' && targetUserId) {
      const chatRoomId = [userId, targetUserId].sort().join('-');
      console.log('🔐 Establishing shared secret for:', chatRoomId);
      
      let existingSecret = await sharedSecrets.findOne({ roomId: chatRoomId });
      
      if (existingSecret) {
        console.log('✅ Secret already exists');
        return NextResponse.json({
          success: true,
          message: 'Secret already established'
        });
      }

      const [user1Keys, user2Keys] = await Promise.all([
        keys.findOne({ userId }),
        keys.findOne({ userId: targetUserId })
      ]);

      if (!user1Keys || !user2Keys) {
        console.log('❌ User keys not found');
        return NextResponse.json({
          success: false,
          message: 'User keys not found. Both users must have generated keys first.'
        }, { status: 404 });
      }

      const sharedSecret = generateSharedSecret();
      const encryptedForUser1 = encryptSharedSecret(sharedSecret, user1Keys.publicKey);
      const encryptedForUser2 = encryptSharedSecret(sharedSecret, user2Keys.publicKey);

      await sharedSecrets.insertOne({
        roomId: chatRoomId,
        secrets: [
          { userId: userId, encryptedSecret: encryptedForUser1 },
          { userId: targetUserId, encryptedSecret: encryptedForUser2 }
        ],
        isVerified: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      console.log('✅ Established shared secret');

      return NextResponse.json({
        success: true,
        message: 'Shared secret established'
      });
    }

    // Establish group shared key
    if (action === 'establish-group-key' && roomId && isGroupRoom) {
      console.log('🔐 Establishing group key for:', roomId);
      
      const groupKeys = db.collection('groupEncryptionKeys');
      
      let existingKey = await groupKeys.findOne({ groupId: roomId });
      
      if (existingKey) {
        console.log('✅ Group key already exists');
        return NextResponse.json({
          success: true,
          message: 'Group key already established'
        });
      }

      const groupSharedKey = generateSharedSecret();
      const groups = db.collection('groups');
      const group = await groups.findOne({ groupId: roomId });

      if (!group) {
        console.log('❌ Group not found');
        return NextResponse.json({
          success: false,
          message: 'Group not found'
        }, { status: 404 });
      }

      const memberKeys = [];
      for (const member of group.members) {
        const memberKeyData = await keys.findOne({ userId: member.userId });
        if (memberKeyData) {
          const encryptedKey = encryptSharedSecret(groupSharedKey, memberKeyData.publicKey);
          memberKeys.push({
            userId: member.userId,
            encryptedKey
          });
        }
      }

      await groupKeys.insertOne({
        groupId: roomId,
        memberKeys,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      console.log('✅ Established group key');

      return NextResponse.json({
        success: true,
        message: 'Group encryption key established'
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('❌ Error in encryption API POST:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request', message: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Verify encryption
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { userId, targetUserId, verify } = body;

    console.log('🔍 PATCH /api/chat/encryption:', { userId, targetUserId, verify });

    if (!userId || !targetUserId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('positivity');
    const sharedSecrets = db.collection('sharedSecrets');

    const roomId = [userId, targetUserId].sort().join('-');

    await sharedSecrets.updateOne(
      { roomId },
      {
        $set: {
          isVerified: verify,
          verifiedAt: verify ? new Date() : null,
          updatedAt: new Date()
        }
      }
    );

    console.log(`${verify ? '✅' : '❌'} Encryption ${verify ? 'verified' : 'unverified'}`);

    return NextResponse.json({
      success: true,
      isVerified: verify
    });

  } catch (error) {
    console.error('❌ Error verifying encryption:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to verify encryption', message: error.message },
      { status: 500 }
    );
  }
}
