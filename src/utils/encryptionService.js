// src/utils/encryptionService.js

class EncryptionService {
  constructor() {
    this.keys = null;
    this.sharedSecrets = new Map();
    this.groupKeys = new Map();
  }

  async initializeKeys(userId) {
    try {
      const response = await fetch(`/api/chat/encryption?userId=${userId}&action=my-keys`);
      
      if (!response.ok) {
        console.log('⚠️ No existing keys found for user:', userId);
        
        if (response.status === 404) {
          console.log('🔑 Generating keys for existing user...');
          await this.generateKeys(userId);
          return this.keys;
        }
        
        throw new Error(`Failed to fetch keys: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        this.keys = {
          publicKey: data.publicKey,
          privateKey: data.privateKey,
          fingerprint: data.fingerprint
        };
        console.log('🔐 Keys loaded from server for user:', userId);
      } else {
        console.log('⚠️ Keys not found in response, generating...');
        await this.generateKeys(userId);
      }

      return this.keys;
    } catch (error) {
      console.error('Error initializing keys:', error);
      
      try {
        await this.generateKeys(userId);
        return this.keys;
      } catch (genError) {
        console.error('Failed to generate keys:', genError);
        throw genError;
      }
    }
  }

  async generateKeys(userId) {
    try {
      const response = await fetch('/api/chat/encryption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'generate-keys'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Generate keys failed:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        this.keys = {
          publicKey: data.publicKey,
          privateKey: data.privateKey,
          fingerprint: data.fingerprint
        };
        console.log('🔐 New keys generated for user:', userId);
        return this.keys;
      }

      throw new Error(data.message || 'Failed to generate keys');
    } catch (error) {
      console.error('Error generating keys:', error);
      throw error;
    }
  }

  async hasKeys(userId) {
    try {
      const response = await fetch(`/api/chat/encryption?userId=${userId}&action=my-keys`);
      return response.ok;
    } catch {
      return false;
    }
  }

  async getSharedSecret(userId, targetUserId) {
    const roomId = [userId, targetUserId].sort().join('-');

    if (this.sharedSecrets.has(roomId)) {
      console.log('✅ Using cached shared secret');
      return this.sharedSecrets.get(roomId);
    }

    try {
      let response = await fetch(
        `/api/chat/encryption?userId=${userId}&targetUserId=${targetUserId}&action=shared-secret`
      );

      if (!response.ok) {
        console.log('⚠️ No shared secret found, establishing new one...');
        
        const establishResponse = await fetch('/api/chat/encryption', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            targetUserId,
            action: 'establish-secret'
          })
        });

        if (!establishResponse.ok) {
          const errorText = await establishResponse.text();
          console.error('❌ Establish secret failed:', establishResponse.status, errorText);
          
          try {
            const errorData = JSON.parse(errorText);
            throw new Error(errorData.message || 'Failed to establish shared secret');
          } catch {
            throw new Error(`Failed to establish shared secret: ${establishResponse.status}`);
          }
        }

        console.log('✅ Establish secret response:');
        await new Promise(resolve => setTimeout(resolve, 200));

        response = await fetch(
          `/api/chat/encryption?userId=${userId}&targetUserId=${targetUserId}&action=shared-secret`
        );

        if (!response.ok) {
          console.error('❌ Still cannot get secret after establishing');
          throw new Error('Failed to retrieve shared secret after establishing');
        }
      }

      const data = await response.json();

      if (data.success) {
        console.log('✅ Got encrypted secret, decrypting...');
        
        const sharedSecret = await this.decryptSharedSecret(data.encryptedSecret);
        
        this.sharedSecrets.set(roomId, {
          secret: sharedSecret,
          isVerified: data.isVerified || false
        });

        console.log('✅ Shared secret decrypted and cached');
        return this.sharedSecrets.get(roomId);
      }

      throw new Error(data.message || 'Failed to get shared secret');
    } catch (error) {
      console.error('❌ Error getting shared secret:', error);
      throw error;
    }
  }

  // In encryptionService.js - update getGroupKey method

async getGroupKey(userId, groupId, retryCount = 0) {
  const cacheKey = `${userId}-${groupId}`;
  
  if (this.groupKeys.has(cacheKey)) {
    console.log('✅ Using cached group key');
    return this.groupKeys.get(cacheKey);
  }

  try {
    let response = await fetch(
      `/api/chat/encryption?userId=${userId}&roomId=${groupId}&action=group-key`
    );

    if (!response.ok) {
      if (response.status === 404 && retryCount < 3) {
        console.log(`⚠️ Group key not found, retry ${retryCount + 1}/3...`);
        // Wait a bit and retry (maybe the key is being generated)
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.getGroupKey(userId, groupId, retryCount + 1);
      }
      
      console.log('⚠️ No group key found, establishing new one...');
      
      const establishResponse = await fetch('/api/chat/encryption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          roomId: groupId,
          isGroupRoom: true,
          action: 'establish-group-key'
        })
      });

      if (!establishResponse.ok) {
        const errorText = await establishResponse.text();
        console.error('❌ Establish group key failed:', establishResponse.status, errorText);
        console.warn('⚠️ Falling back to unencrypted mode for group');
        return null;
      }

      console.log('✅ Group key established successfully');
      await new Promise(resolve => setTimeout(resolve, 500));

      response = await fetch(
        `/api/chat/encryption?userId=${userId}&roomId=${groupId}&action=group-key`
      );
    }

    if (!response.ok) {
      console.warn('⚠️ Still cannot get group key after establishing, falling back to unencrypted');
      return null;
    }

    const data = await response.json();

    if (data.success) {
      const groupKey = await this.decryptSharedSecret(data.encryptedKey);
      this.groupKeys.set(cacheKey, groupKey);
      console.log('✅ Group key decrypted and cached');
      return groupKey;
    }

    console.warn('⚠️ Failed to get group key, falling back to unencrypted');
    return null;
  } catch (error) {
    console.error('Error getting group key:', error);
    return null;
  }
}

  async encryptMessage(plaintext, sharedKey) {
    try {
      if (!sharedKey) {
        console.warn('⚠️ No encryption key available, sending unencrypted');
        return plaintext;
      }

      const encoder = new TextEncoder();
      const data = encoder.encode(plaintext);

      const key = await this.importKey(sharedKey);
      const iv = crypto.getRandomValues(new Uint8Array(12));

      const encryptedData = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        data
      );

      return {
        encrypted: this.arrayBufferToBase64(encryptedData),
        iv: this.arrayBufferToBase64(iv)
      };
    } catch (error) {
      console.error('Encryption error:', error);
      return plaintext;
    }
  }

  async decryptMessage(encryptedData, sharedKey) {
    try {
      if (!sharedKey || typeof encryptedData === 'string') {
        return encryptedData;
      }

      const key = await this.importKey(sharedKey);
      const iv = this.base64ToArrayBuffer(encryptedData.iv);
      const data = this.base64ToArrayBuffer(encryptedData.encrypted);

      const decryptedData = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        data
      );

      const decoder = new TextDecoder();
      return decoder.decode(decryptedData);
    } catch (error) {
      console.error('Decryption error:', error);
      return '[Encrypted message]';
    }
  }

  async decryptSharedSecret(encryptedSecret) {
    try {
      if (!this.keys || !this.keys.privateKey) {
        throw new Error('Private key not available');
      }

      const privateKey = await crypto.subtle.importKey(
        'pkcs8',
        this.pemToArrayBuffer(this.keys.privateKey),
        { name: 'RSA-OAEP', hash: 'SHA-256' },
        true,
        ['decrypt']
      );

      const decrypted = await crypto.subtle.decrypt(
        { name: 'RSA-OAEP' },
        privateKey,
        this.base64ToArrayBuffer(encryptedSecret)
      );

      return this.arrayBufferToBase64(decrypted);
    } catch (error) {
      console.error('Error decrypting shared secret:', error);
      throw error;
    }
  }

  async importKey(base64Key) {
    const keyData = this.base64ToArrayBuffer(base64Key);
    return await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-GCM' },
      true,
      ['encrypt', 'decrypt']
    );
  }

  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  pemToArrayBuffer(pem) {
    const b64 = pem
      .replace(/-----BEGIN.*-----/, '')
      .replace(/-----END.*-----/, '')
      .replace(/\s/g, '');
    return this.base64ToArrayBuffer(b64);
  }

  async getSafetyNumber(userId, targetUserId) {
    try {
      const response = await fetch(
        `/api/chat/encryption?userId=${userId}&targetUserId=${targetUserId}&action=safety-number`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        return {
          safetyNumber: data.safetyNumber,
          fingerprint1: data.fingerprint1,
          fingerprint2: data.fingerprint2
        };
      }

      throw new Error(data.message || 'Failed to get safety number');
    } catch (error) {
      console.error('Error getting safety number:', error);
      throw error;
    }
  }

  async verifyEncryption(userId, targetUserId, verify = true) {
    try {
      const response = await fetch('/api/chat/encryption', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          targetUserId,
          verify
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        const roomId = [userId, targetUserId].sort().join('-');
        const cached = this.sharedSecrets.get(roomId);
        if (cached) {
          cached.isVerified = verify;
        }
      }

      return data;
    } catch (error) {
      console.error('Error verifying encryption:', error);
      throw error;
    }
  }

  clearCache() {
    this.keys = null;
    this.sharedSecrets.clear();
    this.groupKeys.clear();
  }
}

export default new EncryptionService();