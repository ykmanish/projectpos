

// lib/encryption.js
import crypto from 'crypto';

/**
 * Generate RSA key pair for a user
 */
export function generateKeyPair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });

  return { publicKey, privateKey };
}

/**
 * Encrypt data with AES-256-GCM
 */
export function encryptMessage(plaintext, sharedKey) {
  try {
    const iv = crypto.randomBytes(12);
    const key = Buffer.from(sharedKey, 'base64');
    
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64')
    };
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt message');
  }
}

/**
 * Decrypt data with AES-256-GCM
 */
export function decryptMessage(encryptedData, sharedKey) {
  try {
    const { encrypted, iv, authTag } = encryptedData;
    const key = Buffer.from(sharedKey, 'base64');
    
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      key,
      Buffer.from(iv, 'base64')
    );
    
    decipher.setAuthTag(Buffer.from(authTag, 'base64'));
    
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt message');
  }
}

/**
 * Generate shared secret using RSA
 */
export function generateSharedSecret() {
  return crypto.randomBytes(32).toString('base64');
}

/**
 * Encrypt shared secret with public key
 */
export function encryptSharedSecret(sharedSecret, publicKey) {
  try {
    const encrypted = crypto.publicEncrypt(
      {
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      Buffer.from(sharedSecret, 'base64')
    );
    
    return encrypted.toString('base64');
  } catch (error) {
    console.error('Error encrypting shared secret:', error);
    throw new Error('Failed to encrypt shared secret');
  }
}

/**
 * Decrypt shared secret with private key
 */
export function decryptSharedSecret(encryptedSecret, privateKey) {
  try {
    const decrypted = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      Buffer.from(encryptedSecret, 'base64')
    );
    
    return decrypted.toString('base64');
  } catch (error) {
    console.error('Error decrypting shared secret:', error);
    throw new Error('Failed to decrypt shared secret');
  }
}

/**
 * Generate safety number for verification
 */
export function generateSafetyNumber(publicKey1, publicKey2) {
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

/**
 * Generate QR code data for verification
 */
export function generateQRData(userId, publicKey, safetyNumber) {
  return JSON.stringify({
    userId,
    publicKey,
    safetyNumber,
    version: 1
  });
}

/**
 * Verify QR code data
 */
export function verifyQRData(qrData, expectedUserId, expectedPublicKey) {
  try {
    const data = JSON.parse(qrData);
    return (
      data.userId === expectedUserId &&
      data.publicKey === expectedPublicKey
    );
  } catch (error) {
    return false;
  }
}

/**
 * Generate group shared key
 */
export function generateGroupSharedKey() {
  return crypto.randomBytes(32).toString('base64');
}

/**
 * Hash function for fingerprint
 */
export function generateFingerprint(publicKey) {
  const hash = crypto.createHash('sha256').update(publicKey).digest('hex');
  return hash.match(/.{1,4}/g).slice(0, 8).join(' ').toUpperCase();
}
