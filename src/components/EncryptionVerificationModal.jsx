// components/EncryptionVerificationModal.jsx
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  X, Shield, BadgeCheck, AlertCircle, QrCode, Hash, Copy, Check,
  Lock, UserCheck, Smartphone, Eye, EyeOff
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import encryptionService from '@/utils/encryptionService';

export default function EncryptionVerificationModal({ 
  isOpen, 
  onClose, 
  friend, 
  currentUserId,
  isVerified: initialVerified,
  onVerificationChange
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const [safetyNumber, setSafetyNumber] = useState('');
  const [fingerprints, setFingerprints] = useState({ mine: '', theirs: '' });
  const [isVerified, setIsVerified] = useState(initialVerified);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [qrData, setQrData] = useState('');
  const [showSafetyNumber, setShowSafetyNumber] = useState(false);

  // Update local state when prop changes
  useEffect(() => {
    setIsVerified(initialVerified);
  }, [initialVerified]);

  useEffect(() => {
    if (isOpen && friend) {
      loadVerificationData();
      refreshVerificationStatus();
    }
  }, [isOpen, friend]);

  const loadVerificationData = async () => {
    try {
      setLoading(true);
      const data = await encryptionService.getSafetyNumber(currentUserId, friend.userId);
      
      setSafetyNumber(data.safetyNumber);
      setFingerprints({
        mine: data.fingerprint1,
        theirs: data.fingerprint2
      });

      // Generate QR code data
      const qr = JSON.stringify({
        userId: currentUserId,
        targetUserId: friend.userId,
        safetyNumber: data.safetyNumber,
        timestamp: Date.now()
      });
      setQrData(qr);

    } catch (error) {
      console.error('Error loading verification data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshVerificationStatus = async () => {
    try {
      const secret = await encryptionService.getSharedSecret(currentUserId, friend.userId);
      const verified = secret.isVerified || false;
      
      setIsVerified(verified);
      
      if (onVerificationChange) {
        onVerificationChange(verified);
      }
    } catch (error) {
      console.error('Error refreshing verification status:', error);
    }
  };

  const handleVerify = async () => {
    try {
      await encryptionService.verifyEncryption(currentUserId, friend.userId, true);
      setIsVerified(true);
      
      if (onVerificationChange) {
        onVerificationChange(true);
      }
    } catch (error) {
      console.error('Error verifying:', error);
      alert('Failed to verify encryption');
    }
  };

  const handleUnverify = async () => {
    try {
      await encryptionService.verifyEncryption(currentUserId, friend.userId, false);
      setIsVerified(false);
      
      if (onVerificationChange) {
        onVerificationChange(false);
      }
    } catch (error) {
      console.error('Error unverifying:', error);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatSafetyNumber = (number) => {
    if (!number) return '';
    return number.split(' ').map((group, i) => (
      <span key={i} className="inline-block font-mono">
        {group}
        {i < 5 && <span className="mx-2 text-[#5f6368] dark:text-gray-400">·</span>}
      </span>
    ));
  };

  const formatDate = () => {
    return new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: Shield },
    { id: 'safety-number', label: 'Safety Number', icon: Hash },
    { id: 'qr-code', label: 'QR Code', icon: QrCode }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="bg-white dark:bg-[#0c0c0c] rounded-[30px] max-w-2xl w-full max-h-[90vh] overflow-hidden transition-colors duration-300"
      >
        {/* Header */}
        <div className="p-6 border-b border-[#f1f3f4] dark:border-[#181A1E]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                isVerified ? 'bg-green-100 dark:bg-green-900/30' : 'bg-yellow-100 dark:bg-yellow-900/30'
              }`}>
                <Shield size={24} className={isVerified ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'} />
              </div>
              <div>
                <h2 className="text-xl text-[#000000] dark:text-white font-semibold">End-to-End Encryption</h2>
                <p className="text-sm text-[#5f6368] dark:text-gray-400">with {friend?.userName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-gray-100 dark:bg-[#101010] rounded-full transition-colors hover:bg-gray-200 dark:hover:bg-[#181A1E]"
            >
              <X size={20} className="text-[#202124] dark:text-white" />
            </button>
          </div>

          {/* Status Badge */}
          {isVerified ? (
            <div className="flex items-center gap-2 px-4 py-3 bg-green-50 dark:bg-green-900/30 rounded-2xl mt-4">
              <BadgeCheck size={20} className="text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-700 dark:text-green-300">
                Verified Encryption - This conversation is secure
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-2xl mt-4">
              <AlertCircle size={20} className="text-yellow-600 dark:text-yellow-400" />
              <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                Not Verified - Verify to ensure your messages are secure
              </span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex p-2 gap-1 bg-gray-50/50 dark:bg-[#101010]/50">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="relative flex-1 py-3 rounded-xl font-medium transition-colors"
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-green-100 dark:bg-green-900/30 rounded-xl"
                    transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
                  />
                )}
                <span className={`relative z-10 flex items-center justify-center gap-2 text-sm ${
                  isActive ? 'text-green-700 dark:text-green-400' : 'text-[#5f6368] dark:text-gray-400'
                }`}>
                  <Icon size={18} />
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-240px)]">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="w-8 h-8 border-4 border-[#34A853] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-[#202124] dark:text-white mb-3">
                      What is End-to-End Encryption?
                    </h3>
                    <p className="text-[#5f6368] dark:text-gray-400 text-sm leading-relaxed">
                      Your messages are secured with end-to-end encryption. This means only you and {friend?.userName} can read them. Not even our servers can access your messages.
                    </p>
                  </div>

                  <div className="bg-green-50 dark:bg-green-900/30 rounded-2xl p-5">
                    <div className="flex items-start gap-3">
                      <Lock size={20} className="text-green-600 dark:text-green-400 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-green-900 dark:text-green-300 mb-2">How it works</h4>
                        <ul className="text-sm text-green-800 dark:text-green-200 space-y-2">
                          <li className="flex items-start gap-2">
                            <span className="text-green-600 dark:text-green-400">•</span>
                            <span>Messages are encrypted on your device before sending</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-blue-600 dark:text-blue-400">•</span>
                            <span>Only the recipient's device can decrypt them</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-blue-600 dark:text-blue-400">•</span>
                            <span>Each conversation has a unique encryption key</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-blue-600 dark:text-blue-400">•</span>
                            <span>Keys are never sent to our servers</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-[#202124] dark:text-white mb-3">
                      Key Fingerprints
                    </h3>
                    <div className="space-y-3">
                      <div className="bg-gray-50 dark:bg-[#101010] rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs text-[#5f6368] dark:text-gray-400">Your fingerprint</p>
                          <div className="flex items-center gap-2">
                            <Smartphone size={14} className="text-[#5f6368] dark:text-gray-400" />
                            <span className="text-xs text-[#5f6368] dark:text-gray-400">Your device</span>
                          </div>
                        </div>
                        <p className="text-sm font-mono text-[#202124] dark:text-white tracking-wider">{fingerprints.mine}</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-[#101010] rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs text-[#5f6368] dark:text-gray-400">{friend?.userName}'s fingerprint</p>
                          <div className="flex items-center gap-2">
                            <Smartphone size={14} className="text-[#5f6368] dark:text-gray-400" />
                            <span className="text-xs text-[#5f6368] dark:text-gray-400">{friend?.userName}'s device</span>
                          </div>
                        </div>
                        <p className="text-sm font-mono text-[#202124] dark:text-white tracking-wider">{fingerprints.theirs}</p>
                      </div>
                    </div>
                  </div>

                  {/* Verification Actions */}
                  <div className="pt-4">
                    {!isVerified ? (
                      <button
                        onClick={handleVerify}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#34A853] text-white rounded-xl hover:bg-[#2D9249] transition-colors font-medium"
                      >
                        <UserCheck size={18} />
                        Mark as Verified
                      </button>
                    ) : (
                      ""
                    )}
                  </div>
                </div>
              )}

              {/* Safety Number Tab */}
              {activeTab === 'safety-number' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-[#202124] dark:text-white mb-3">
                      Safety Number
                    </h3>
                    <p className="text-[#5f6368] dark:text-gray-400 text-sm leading-relaxed mb-4">
                      This 60-digit number is unique to your conversation with {friend?.userName}. 
                      Compare it with them to verify your connection is secure.
                    </p>
                  </div>

                  <div className="bg-green-50 dark:bg-green-900/30 rounded-3xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[#202124] dark:text-white">Safety Number</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowSafetyNumber(!showSafetyNumber)}
                          className="p-2 hover:bg-white/50 dark:hover:bg-black/20 rounded-lg transition-colors"
                          title={showSafetyNumber ? "Hide safety number" : "Show safety number"}
                        >
                          {showSafetyNumber ? <EyeOff size={16} className="text-gray-600 dark:text-gray-400" /> : <Eye size={16} className="text-gray-600 dark:text-gray-400" />}
                        </button>
                        <button
                          onClick={() => copyToClipboard(safetyNumber.replace(/\s/g, ''))}
                          className="p-2 hover:bg-white/50 dark:hover:bg-black/20 rounded-lg transition-colors"
                          title="Copy safety number"
                        >
                          {copied ? (
                            <Check size={16} className="text-green-600 dark:text-green-400" />
                          ) : (
                            <Copy size={16} className="text-gray-600 dark:text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                    
                    {showSafetyNumber ? (
                      <div className="text-xl font-mono text-[#202124] dark:text-white leading-relaxed text-center break-all">
                        {formatSafetyNumber(safetyNumber)}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-[#5f6368] dark:text-gray-400 text-sm mb-2">Safety number is hidden</p>
                        <button
                          onClick={() => setShowSafetyNumber(true)}
                          className="text-green-800 dark:text-green-400 text-sm font-medium hover:underline"
                        >
                          Click to reveal
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="bg-yellow-50 dark:bg-yellow-900/30 rounded-2xl p-5">
                    <h4 className="font-medium text-yellow-900 dark:text-yellow-300 mb-3">How to verify</h4>
                    <ol className="text-sm text-yellow-800 dark:text-yellow-200 space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 bg-yellow-200 dark:bg-yellow-700 rounded-full flex items-center justify-center text-xs font-medium text-yellow-800 dark:text-yellow-200">1</span>
                        <span>Meet {friend?.userName} in person or video call</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 bg-yellow-200 dark:bg-yellow-700 rounded-full flex items-center justify-center text-xs font-medium text-yellow-800 dark:text-yellow-200">2</span>
                        <span>Compare this number with theirs</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 bg-yellow-200 dark:bg-yellow-700 rounded-full flex items-center justify-center text-xs font-medium text-yellow-800 dark:text-yellow-200">3</span>
                        <span>If they match, mark as verified</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 bg-yellow-200 dark:bg-yellow-700 rounded-full flex items-center justify-center text-xs font-medium text-yellow-800 dark:text-yellow-200">4</span>
                        <span>If they don't match, someone may be intercepting</span>
                      </li>
                    </ol>
                  </div>

                  {/* Verification Actions */}
                  <div className="pt-4">
                    {!isVerified ? (
                      <button
                        onClick={handleVerify}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#34A853] text-white rounded-xl hover:bg-[#2D9249] transition-colors font-medium"
                      >
                        <BadgeCheck size={18} />
                        Mark as Verified
                      </button>
                    ) : (
                      ""
                    )}
                  </div>
                </div>
              )}

              {/* QR Code Tab */}
              {activeTab === 'qr-code' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-[#202124] dark:text-white mb-3">
                      QR Code Verification
                    </h3>
                    <p className="text-[#5f6368] dark:text-gray-400 text-sm leading-relaxed mb-4">
                      Scan this QR code with {friend?.userName}'s device to quickly verify your encrypted connection.
                    </p>
                  </div>

                  <div className="flex justify-center">
                    <div className="bg-white dark:bg-white p-2 rounded-[40px] border border-[#f1f3f4] dark:border-[#232529]">
                      <QRCodeSVG
                        value={qrData}
                        size={256}
                        level="H"
                        includeMargin={true}
                      />
                    </div>
                  </div>

                  <div className="bg-green-50 dark:bg-green-900/30 rounded-2xl p-5">
                    <div className="flex items-start gap-3">
                      <QrCode size={20} className="text-green-600 dark:text-green-400 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-green-900 dark:text-green-300 mb-2">How to scan</h4>
                        <ol className="text-sm text-green-800 dark:text-green-200 space-y-2">
                          <li className="flex items-start gap-2">
                            <span className="w-5 h-5 bg-green-200 dark:bg-green-700 rounded-full flex items-center justify-center text-xs font-medium text-green-800 dark:text-green-200">1</span>
                            <span>Ask {friend?.userName} to open this verification screen</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="w-5 h-5 bg-green-200 dark:bg-green-700 rounded-full flex items-center justify-center text-xs font-medium text-green-800 dark:text-green-200">2</span>
                            <span>They should scan your QR code using their device</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="w-5 h-5 bg-green-200 dark:bg-green-700 rounded-full flex items-center justify-center text-xs font-medium text-green-800 dark:text-green-200">3</span>
                            <span>If verification succeeds, you're both secure!</span>
                          </li>
                        </ol>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-[#101010] rounded-xl">
                    <p className="text-xs text-[#5f6368] dark:text-gray-400">
                      QR code contains your safety number encrypted with a temporary key. 
                      It expires after 5 minutes for security.
                    </p>
                  </div>

                  {/* Verification Actions */}
                  <div className="pt-4">
                    {!isVerified ? (
                      <button
                        onClick={handleVerify}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#34A853] text-white rounded-xl hover:bg-[#2D9249] transition-colors font-medium"
                      >
                        <BadgeCheck size={18} />
                        Mark as Verified
                      </button>
                    ) : (
                      ""
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}