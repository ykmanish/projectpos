// app/api/chat/decrypt-preview/route.js

import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const { encryptedContent, senderId, receiverId, isGroupMessage, groupId } = await request.json();

    console.log('🔓 Decrypt preview request:', { 
      senderId, 
      receiverId, 
      isGroupMessage, 
      groupId,
      hasContent: !!encryptedContent 
    });

    if (!encryptedContent) {
      return NextResponse.json({ 
        success: false, 
        error: 'No encrypted content',
        decrypted: 'Message' 
      });
    }

    const client = await clientPromise;
    const db = client.db('positivity');
    const keys = db.collection('encryptionKeys');
    const groupKeys = db.collection('groupEncryptionKeys');
    const sharedSecrets = db.collection('sharedSecrets');
    
    let decrypted = '';
    let encryptionKey = null;

    // Handle different encryption formats
    let encryptedData = encryptedContent;
    if (typeof encryptedData === 'string') {
      try {
        encryptedData = JSON.parse(encryptedData);
      } catch {
        // If it's not JSON, it might be the old format
        encryptedData = { encrypted: encryptedData, iv: '' };
      }
    }

    if (isGroupMessage && groupId) {
      // For group messages, get the group key for the receiver
      console.log('🔑 Getting group key for preview...');
      
      // Get the group key document
      const groupKeyDoc = await groupKeys.findOne({ groupId });
      
      if (!groupKeyDoc) {
        console.log('❌ No group key found');
        return NextResponse.json({ 
          success: false, 
          error: 'No group key found',
          decrypted: 'Message' 
        });
      }

      // Find the encrypted key for the receiver
      const memberKey = groupKeyDoc.memberKeys?.find(mk => mk.userId === receiverId);
      
      if (!memberKey) {
        console.log('❌ No key for user in group');
        return NextResponse.json({ 
          success: false, 
          error: 'No key for user',
          decrypted: 'Message' 
        });
      }

      // Get user's private key
      const userKeys = await keys.findOne({ userId: receiverId });
      
      if (!userKeys || !userKeys.privateKey) {
        console.log('❌ User private key not found');
        return NextResponse.json({ 
          success: false, 
          error: 'User private key not found',
          decrypted: 'Message' 
        });
      }

      // Decrypt the group key with user's private key
      try {
        const groupKey = await decryptWithPrivateKey(memberKey.encryptedKey, userKeys.privateKey);
        encryptionKey = groupKey;
        console.log('✅ Group key decrypted');
      } catch (keyError) {
        console.error('❌ Failed to decrypt group key:', keyError);
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to decrypt group key',
          decrypted: 'Message' 
        });
      }
    } else {
      // For direct messages, get the shared secret
      console.log('🔑 Getting shared secret for direct message preview...');
      const roomId = [senderId, receiverId].sort().join('-');
      
      const secretDoc = await sharedSecrets.findOne({ roomId });
      
      if (!secretDoc) {
        console.log('❌ No shared secret found for room:', roomId);
        return NextResponse.json({ 
          success: false, 
          error: 'No shared secret found',
          decrypted: 'Message' 
        });
      }

      // Find the encrypted secret for the receiver
      const userSecret = secretDoc.secrets?.find(s => s.userId === receiverId);
      
      if (!userSecret) {
        console.log('❌ No secret for user:', receiverId);
        return NextResponse.json({ 
          success: false, 
          error: 'No secret for user',
          decrypted: 'Message' 
        });
      }

      // Get user's private key
      const userKeys = await keys.findOne({ userId: receiverId });
      
      if (!userKeys || !userKeys.privateKey) {
        console.log('❌ User private key not found for:', receiverId);
        return NextResponse.json({ 
          success: false, 
          error: 'User private key not found',
          decrypted: 'Message' 
        });
      }

      // Decrypt the shared secret with user's private key
      try {
        const sharedSecret = await decryptWithPrivateKey(userSecret.encryptedSecret, userKeys.privateKey);
        encryptionKey = sharedSecret;
        console.log('✅ Shared secret decrypted');
      } catch (secretError) {
        console.error('❌ Failed to decrypt shared secret:', secretError);
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to decrypt shared secret',
          decrypted: 'Message' 
        });
      }
    }

    if (!encryptionKey) {
      console.log('❌ No encryption key available');
      return NextResponse.json({ 
        success: false, 
        error: 'No encryption key',
        decrypted: 'Message' 
      });
    }

    // Now decrypt the actual message
    try {
      decrypted = await decryptMessageContent(encryptedData, encryptionKey);
      
      // Remove mention formatting for preview
      const cleanText = removeMentionFormatting(decrypted);
      
      console.log('✅ Message decrypted successfully:', cleanText.substring(0, 30) + '...');
      
      return NextResponse.json({ 
        success: true, 
        decrypted: cleanText 
      });
    } catch (decryptError) {
      console.error('❌ Failed to decrypt message content:', decryptError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to decrypt message',
        decrypted: 'Message' 
      });
    }
  } catch (error) {
    console.error('❌ Error in decrypt-preview:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to decrypt message',
      decrypted: 'Message' 
    });
  }
}

// Helper function to decrypt with private key
async function decryptWithPrivateKey(encryptedData, privateKeyPem) {
  try {
    const privateKey = crypto.createPrivateKey({
      key: privateKeyPem,
      format: 'pem',
      type: 'pkcs8'
    });

    const encryptedBuffer = Buffer.from(encryptedData, 'base64');
    const decrypted = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256'
      },
      encryptedBuffer
    );

    return decrypted.toString('base64');
  } catch (error) {
    console.error('Error decrypting with private key:', error);
    throw error;
  }
}

// Helper function to decrypt message content
async function decryptMessageContent(encryptedData, keyBase64) {
  try {
    // Handle case where there's no IV
    if (!encryptedData.iv || encryptedData.iv === '') {
      // Try to interpret as just encrypted text
      try {
        const key = crypto.createSecretKey(Buffer.from(keyBase64, 'base64'));
        const encryptedBuffer = Buffer.from(encryptedData.encrypted, 'base64');
        
        // For AES-256-GCM, we need the auth tag (last 16 bytes)
        if (encryptedBuffer.length > 16) {
          const tag = encryptedBuffer.subarray(encryptedBuffer.length - 16);
          const ciphertext = encryptedBuffer.subarray(0, encryptedBuffer.length - 16);
          
          const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.alloc(12, 0));
          decipher.setAuthTag(tag);
          
          let decrypted = decipher.update(ciphertext, undefined, 'utf8');
          decrypted += decipher.final('utf8');
          return decrypted;
        }
      } catch (e) {
        console.log('Fallback decryption failed:', e);
      }
      return '[Encrypted message]';
    }

    const key = crypto.createSecretKey(Buffer.from(keyBase64, 'base64'));
    const iv = Buffer.from(encryptedData.iv, 'base64');
    const encrypted = Buffer.from(encryptedData.encrypted, 'base64');

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    
    // GCM mode uses auth tag at the end
    const tag = encrypted.subarray(encrypted.length - 16);
    const ciphertext = encrypted.subarray(0, encrypted.length - 16);
    
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(ciphertext, undefined, 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Error decrypting message content:', error);
    throw error;
  }
}

// Helper function to remove mention formatting
function removeMentionFormatting(text) {
  if (!text) return '';
  
  // Ensure it's a string
  const textStr = String(text);
  
  // Replace @[Name](userId) with @Name
  return textStr.replace(/@\[([^\]]+)\]\([^)]+\)/g, '@$1');
}