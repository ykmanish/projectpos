// components/EncryptionVerificationModal.jsx
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  X, Shield, BadgeCheck, AlertCircle, QrCode, Hash, Copy, Check,
  Lock, UserCheck, Smartphone, Eye, EyeOff, ChevronLeft, Users,
  Fingerprint, Camera, Phone
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { BeanHead } from 'beanheads';
import encryptionService from '@/utils/encryptionService';

// ─── Card Color Palette (matches reference design) ─────────────────
const CARD_PALETTES = [
  { bg: '#FF8C78', track: '#c96b58', bar: '#1a0a08', text: '#1a0a08', sub: '#7a3028' },
  { bg: '#FFB8C6', track: '#d98898', bar: '#1a0810', text: '#1a0810', sub: '#7a3050' },
  { bg: '#7DCFCC', track: '#4eaaa7', bar: '#082020', text: '#082020', sub: '#1a5a58' },
  { bg: '#F5E09A', track: '#c8b860', bar: '#1a1408', text: '#1a1408', sub: '#6a5020' },
  { bg: '#A8D8FF', track: '#70b0e0', bar: '#081220', text: '#081220', sub: '#204870' },
  { bg: '#B8E8B0', track: '#80c078', bar: '#081408', text: '#081408', sub: '#205820' },
  { bg: '#E0C8F8', track: '#b090d0', bar: '#120820', text: '#120820', sub: '#503878' },
  { bg: '#FFD4A0', track: '#d8a060', bar: '#1a0e04', text: '#1a0e04', sub: '#7a4818' },
];

const getCardPalette = (title = '') => {
  const idx = (title.charCodeAt(0) || 0) % CARD_PALETTES.length;
  return CARD_PALETTES[idx];
};

// Helper function to parse avatar (BeanHead config)
const parseAvatar = (avatarData) => {
  if (!avatarData) return null;
  
  try {
    if (typeof avatarData === 'object') return avatarData;
    const parsed = JSON.parse(avatarData);
    return parsed;
  } catch (e) {
    console.error('Failed to parse avatar:', e);
    return null;
  }
};

// Helper function to get beanConfig from avatar
const getBeanConfig = (avatar) => {
  const parsed = parseAvatar(avatar);
  
  if (!parsed) return null;
  
  if (typeof parsed === 'object' && parsed.beanConfig) {
    return parsed.beanConfig;
  }
  
  if (typeof parsed === 'object' && (parsed.mask || parsed.eyes || parsed.mouth)) {
    return parsed;
  }
  
  return null;
};

// ─── Rounded Square Avatar ─────────────────────────────────────────
const SquareAvatar = ({ user, size = 10 }) => {
  const GRADIENTS = [
    'from-purple-400 to-purple-600', 'from-blue-400 to-blue-600',
    'from-pink-400 to-pink-600',     'from-orange-400 to-orange-600',
    'from-green-400 to-green-600',   'from-red-400 to-red-600',
    'from-yellow-400 to-yellow-500', 'from-teal-400 to-teal-600',
  ];
  const idx = (user?.userName?.charCodeAt(0) || 0) % GRADIENTS.length;
  const beanConfig = getBeanConfig(user?.avatar);
  
  return (
    <div className={`w-${size} h-${size} rounded-full overflow-hidden flex-shrink-0 bg-[#e8f0fe]`}>
      {beanConfig ? (
        <BeanHead {...beanConfig} />
      ) : (
        <div className={`w-full h-full bg-gradient-to-br ${GRADIENTS[idx]} flex items-center justify-center`}>
          <span className="text-white font-bold text-sm">{user?.userName?.charAt(0)}</span>
        </div>
      )}
    </div>
  );
};

// ─── Feature Card Component ────────────────────────────────────────
const FeatureCard = ({ icon: Icon, title, description, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    yellow: 'bg-yellow-50 text-yellow-600',
  };

  const bgColor = colorClasses[color] || colorClasses.blue;

  return (
    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
      <div className={`w-10 h-10 rounded-full ${bgColor} flex items-center justify-center flex-shrink-0`}>
        <Icon size={18} className={bgColor.split(' ')[1]} />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="text-xs text-gray-400 mt-1">{description}</p>
      </div>
    </div>
  );
};

// ─── Step Item Component ──────────────────────────────────────────
const StepItem = ({ number, text, color = 'green' }) => {
  const colorClasses = {
    green: 'bg-green-100 text-green-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    blue: 'bg-blue-100 text-blue-700',
  };

  return (
    <li className="flex items-start gap-2">
      <span className={`w-5 h-5 ${colorClasses[color]} rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0`}>
        {number}
      </span>
      <span className="text-sm text-gray-600">{text}</span>
    </li>
  );
};

export default function EncryptionVerificationModal({ 
  isOpen, 
  onClose, 
  friend, 
  currentUserId,
  currentUser,
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
    // Group into 5-digit chunks for readability
    const chunks = number.match(/.{1,5}/g) || [];
    return chunks.map((chunk, i) => (
      <span key={i} className="inline-block">
        <span className="font-mono text-lg font-bold">{chunk}</span>
        {i < chunks.length - 1 && (
          <span className="mx-2 text-gray-400 font-light">·</span>
        )}
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

  const palette = getCardPalette('Encryption');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <motion.div 
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="bg-white rounded-t-[2rem] sm:rounded-[2rem] w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden -2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-6 pb-4 flex-shrink-0">
         
          <h2 className="text-lg font-bold text-gray-900">Encryption</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200 transition-colors"
          >
            <X size={16} className="text-gray-700" />
          </button>
        </div>

        {/* User Info Card */}
        <div className="px-5 mb-4">
          <div className="rounded-3xl p-5" style={{ backgroundColor: palette.bg }}>
            <div className="flex items-center gap-4">
              <SquareAvatar user={friend} size={14} />
              <div className="flex-1">
                <h3 className="text-xl font-extrabold" style={{ color: palette.text }}>
                  {friend?.userName}
                </h3>
                <p className="text-sm mt-1" style={{ color: palette.sub }}>
                  End-to-end encrypted chat
                </p>
              </div>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                isVerified ? 'bg-green-500/20' : 'bg-yellow-500/20'
              }`}>
                <Shield size={24} className={isVerified ? 'text-green-600' : 'text-yellow-600'} />
              </div>
            </div>

            {/* Status Badge */}
            <div className={`mt-4 p-3 rounded-2xl flex items-center gap-2 ${
              isVerified ? 'bg-green-500/20' : 'bg-yellow-500/20'
            }`}>
              {isVerified ? (
                <>
                  <BadgeCheck size={18} className="text-green-600" />
                  <span className="text-sm font-medium text-green-700">
                    Verified - This conversation is secure
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle size={18} className="text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-700">
                    Not verified - Verify to ensure security
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex p-1 mx-5 mb-4 bg-gray-100 rounded-2xl">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                  isActive
                    ? 'bg-white text-gray-900 -sm'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-6 min-h-0">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <div className="rounded-3xl p-5 bg-gray-50">
                    <h3 className="text-lg font-extrabold text-gray-900 mb-2">
                      End-to-End Encryption
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      Your messages are secured with end-to-end encryption. This means only you and {friend?.userName} can read them. Not even our servers can access your messages.
                    </p>
                  </div>

                  <FeatureCard
                    icon={Lock}
                    title="How it works"
                    description="Messages are encrypted on your device before sending. Only the recipient's device can decrypt them."
                    color="blue"
                  />

                  {/* Key Fingerprints */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                      <Fingerprint size={16} />
                      Key Fingerprints
                    </h3>
                    <div className="space-y-2">
                      <div className="bg-gray-50 rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Smartphone size={14} className="text-gray-400" />
                            <p className="text-xs font-medium text-gray-500">Your fingerprint</p>
                          </div>
                          <span className="text-xs text-gray-400">Your device</span>
                        </div>
                        <p className="text-sm font-mono text-gray-900 tracking-wider break-all">{fingerprints.mine}</p>
                      </div>
                      <div className="bg-gray-50 rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Smartphone size={14} className="text-gray-400" />
                            <p className="text-xs font-medium text-gray-500">{friend?.userName}'s fingerprint</p>
                          </div>
                          <span className="text-xs text-gray-400">{friend?.userName}'s device</span>
                        </div>
                        <p className="text-sm font-mono text-gray-900 tracking-wider break-all">{fingerprints.theirs}</p>
                      </div>
                    </div>
                  </div>

                  {/* Verification Actions */}
                  {!isVerified && (
                    <button
                      onClick={handleVerify}
                      className="w-full py-4 bg-black hover:bg-gray-900 active:scale-[0.98] text-white rounded-2xl font-bold text-[15px] transition-all flex items-center justify-center gap-2"
                    >
                      <UserCheck size={18} strokeWidth={2.5} />
                      Mark as Verified
                    </button>
                  )}
                </div>
              )}

              {/* Safety Number Tab */}
              {activeTab === 'safety-number' && (
                <div className="space-y-4">
                  <div className="rounded-3xl p-5 bg-gray-50">
                    <h3 className="text-lg font-extrabold text-gray-900 mb-2">
                      Safety Number
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      This 60-digit number is unique to your conversation with {friend?.userName}. 
                      Compare it with them to verify your connection is secure.
                    </p>
                  </div>

                  <div className="rounded-3xl p-5" style={{ backgroundColor: palette.bg }}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Hash size={18} style={{ color: palette.text }} />
                        <span className="font-bold" style={{ color: palette.text }}>Safety Number</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setShowSafetyNumber(!showSafetyNumber)}
                          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/10 transition-colors"
                        >
                          {showSafetyNumber ? 
                            <EyeOff size={16} style={{ color: palette.text }} /> : 
                            <Eye size={16} style={{ color: palette.text }} />
                          }
                        </button>
                        <button
                          onClick={() => copyToClipboard(safetyNumber.replace(/\s/g, ''))}
                          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/10 transition-colors"
                        >
                          {copied ? 
                            <Check size={16} className="text-green-600" /> : 
                            <Copy size={16} style={{ color: palette.text }} />
                          }
                        </button>
                      </div>
                    </div>
                    
                    {showSafetyNumber ? (
                      <div className="text-center break-all bg-white/30 p-4 rounded-2xl">
                        {formatSafetyNumber(safetyNumber)}
                      </div>
                    ) : (
                      <div className="text-center py-6 bg-white/30 rounded-2xl">
                        <p className="text-sm mb-2" style={{ color: palette.sub }}>Safety number is hidden</p>
                        <button
                          onClick={() => setShowSafetyNumber(true)}
                          className="text-sm font-medium hover:underline" style={{ color: palette.text }}
                        >
                          Click to reveal
                        </button>
                      </div>
                    )}
                  </div>

                  {/* How to verify */}
                  <div className="bg-amber-50 rounded-2xl p-5">
                    <h4 className="font-medium text-amber-800 mb-3">How to verify</h4>
                    <ol className="space-y-2">
                      <StepItem number="1" text={`Meet ${friend?.userName} in person or video call`} color="yellow" />
                      <StepItem number="2" text="Compare this number with theirs" color="yellow" />
                      <StepItem number="3" text="If they match, mark as verified" color="yellow" />
                      <StepItem number="4" text="If they don't match, someone may be intercepting" color="yellow" />
                    </ol>
                  </div>

                  {/* Verification Actions */}
                  {!isVerified && (
                    <button
                      onClick={handleVerify}
                      className="w-full py-4 bg-black hover:bg-gray-900 active:scale-[0.98] text-white rounded-2xl font-bold text-[15px] transition-all flex items-center justify-center gap-2"
                    >
                      <BadgeCheck size={18} strokeWidth={2.5} />
                      Mark as Verified
                    </button>
                  )}
                </div>
              )}

              {/* QR Code Tab */}
              {activeTab === 'qr-code' && (
                <div className="space-y-4">
                  <div className="rounded-3xl p-5 bg-gray-50">
                    <h3 className="text-lg font-extrabold text-gray-900 mb-2">
                      QR Code Verification
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      Scan this QR code with {friend?.userName}'s device to quickly verify your encrypted connection.
                    </p>
                  </div>

                  <div className="flex justify-center">
                    <div className="bg-white   border-gray-100">
                      <QRCodeSVG
                        value={qrData}
                        size={200}
                        level="H"
                        includeMargin={false}
                        className=""
                      />
                    </div>
                  </div>

                  {/* How to scan */}
                  <div className="rounded-3xl p-5" style={{ backgroundColor: palette.bg }}>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/30 flex items-center justify-center flex-shrink-0">
                        <Camera size={18} style={{ color: palette.text }} />
                      </div>
                      <div>
                        <h4 className="font-bold mb-2" style={{ color: palette.text }}>How to scan</h4>
                        <ol className="space-y-2">
                          <li className="flex items-start gap-2 text-sm" style={{ color: palette.sub }}>
                            <span className="w-4 h-4 rounded-full bg-white/30 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5" style={{ color: palette.text }}>1</span>
                            <span>Ask {friend?.userName} to open this verification screen</span>
                          </li>
                          <li className="flex items-start gap-2 text-sm" style={{ color: palette.sub }}>
                            <span className="w-4 h-4 rounded-full bg-white/30 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5" style={{ color: palette.text }}>2</span>
                            <span>They should scan your QR code using their device</span>
                          </li>
                          <li className="flex items-start gap-2 text-sm" style={{ color: palette.sub }}>
                            <span className="w-4 h-4 rounded-full bg-white/30 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5" style={{ color: palette.text }}>3</span>
                            <span>If verification succeeds, you're both secure!</span>
                          </li>
                        </ol>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-2xl">
                    <p className="text-xs text-gray-400">
                      QR code contains your safety number encrypted with a temporary key. 
                      It expires after 5 minutes for security.
                    </p>
                  </div>

                  {/* Verification Actions */}
                  {!isVerified && (
                    <button
                      onClick={handleVerify}
                      className="w-full py-4 bg-black hover:bg-gray-900 active:scale-[0.98] text-white rounded-2xl font-bold text-[15px] transition-all flex items-center justify-center gap-2"
                    >
                      <BadgeCheck size={18} strokeWidth={2.5} />
                      Mark as Verified
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer with unverify option if verified */}
        {isVerified && (
          <div className="px-5 pb-3 pt-2 flex-shrink-0">
            <button
              onClick={handleUnverify}
              className="w-full py-4 bg-gray-100 hover:bg-gray-200 active:scale-[0.98] text-gray-700 rounded-2xl font-bold text-[15px] transition-all"
            >
              Remove Verification
            </button>
          </div>
        )}
      </motion.div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
      `}</style>
    </div>
  );
}