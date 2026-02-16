import { NextResponse } from 'next/server';
import encryptionService from '@/utils/encryptionService';

export async function POST(request) {
  try {
    const { encryptedContent, senderId, receiverId, isGroupMessage, groupId } = await request.json();

    if (!encryptedContent) {
      return NextResponse.json({ success: false, error: 'No encrypted content' });
    }

    let decrypted = '';

    if (isGroupMessage && groupId) {
      // For group messages, get the group key
      const groupKey = await encryptionService.getGroupKey(receiverId, groupId);
      decrypted = await encryptionService.decryptMessage(encryptedContent, groupKey);
    } else {
      // For direct messages, get the shared secret
      const secret = await encryptionService.getSharedSecret(receiverId, senderId);
      decrypted = await encryptionService.decryptMessage(encryptedContent, secret.secret);
    }

    return NextResponse.json({ 
      success: true, 
      decrypted: decrypted 
    });
  } catch (error) {
    console.error('Error decrypting preview:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to decrypt message',
      decrypted: 'Message' 
    });
  }
}