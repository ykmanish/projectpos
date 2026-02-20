'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  X, Users, Copy, Check, Shield, ShieldCheck, UserPlus,
  UserMinus, Crown, Lock, MessageSquare, Settings, CircleMinus,
  RefreshCw, Edit2, Save, LogOut, Trash2, AlertTriangle,
  ChevronLeft, MoreVertical, User, Mail, Calendar
} from 'lucide-react';
import { BeanHead } from 'beanheads';
import Avatar from './Avatar';

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

// ─── Member Card Dropdown Menu Component ─────────────────────────
const MemberCardDropdown = ({ member, currentUserId, isAdmin, isLastAdmin, onAction, onClose }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Don't show dropdown for current user or if not admin
  if (member.userId === currentUserId || !isAdmin) return null;

  const isMemberAdmin = member.role === 'admin';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ml-2 hover:bg-black/10 transition-colors"
      >
        <MoreVertical size={16} className="text-gray-600" />
      </button>

      {isOpen && (
        <div 
          className="absolute top-full right-0 mt-1 w-48 bg-white rounded-2xl border border-gray-200 z-50 overflow-hidden animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          {isMemberAdmin ? (
            <button
              onClick={() => {
                setIsOpen(false);
                onAction(member.userId, 'demote');
              }}
              className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
              disabled={isLastAdmin}
            >
              <Shield size={14} className="text-gray-500" />
              Demote to Member
            </button>
          ) : (
            <button
              onClick={() => {
                setIsOpen(false);
                onAction(member.userId, 'promote');
              }}
              className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
            >
              <ShieldCheck size={14} className="text-gray-500" />
              Promote to Admin
            </button>
          )}
          <button
            onClick={() => {
              setIsOpen(false);
              onAction(member.userId, 'remove');
            }}
            className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-red-50 transition-colors text-sm font-medium text-red-600 border-t border-gray-100"
          >
            <CircleMinus size={14} className="text-red-500" />
            Remove from Group
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Stacked Circular Avatars ───────────────────────────────────────
const StackedAvatars = ({ members = [], max = 4 }) => {
  const visible = members.slice(0, max);
  const extra = members.length - max;
  
  return (
    <div className="flex items-center">
      {visible.map((member, index) => {
        const beanConfig = getBeanConfig(member?.avatar);
        
        return (
          <div
            key={member.userId}
            className="w-8 h-8 rounded-full border-2 border-white -ml-2 first:ml-0 overflow-hidden bg-gray-300 flex-shrink-0"
            style={{ zIndex: index }}
          >
            {beanConfig ? (
              <div className="w-full h-full bg-[#e8f0fe]">
                <BeanHead {...beanConfig} />
              </div>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-400 to-gray-700 flex items-center justify-center">
                <span className="text-[10px] font-bold text-white">{member.userName?.charAt(0)}</span>
              </div>
            )}
          </div>
        );
      })}
      {extra > 0 && (
        <div className="w-8 h-8 rounded-full border-2 border-white -ml-2 bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-700">
          +{extra}
        </div>
      )}
    </div>
  );
};

// ─── Rounded Square Avatar ─────────────────────────────────────────
const SquareAvatar = ({ member, size = 10, selected = true }) => {
  const GRADIENTS = [
    'from-purple-400 to-purple-600', 'from-blue-400 to-blue-600',
    'from-pink-400 to-pink-600',     'from-orange-400 to-orange-600',
    'from-green-400 to-green-600',   'from-red-400 to-red-600',
    'from-yellow-400 to-yellow-500', 'from-teal-400 to-teal-600',
  ];
  const idx = (member?.userName?.charCodeAt(0) || 0) % GRADIENTS.length;
  const beanConfig = getBeanConfig(member?.avatar);
  
  return (
    <div className={`w-${size} h-${size} rounded-2xl overflow-hidden flex-shrink-0 transition-opacity ${!selected ? 'opacity-35' : ''}`}>
      {beanConfig ? (
        <div className="w-full h-full bg-[#e8f0fe]">
          <BeanHead {...beanConfig} />
        </div>
      ) : (
        <div className={`w-full h-full bg-gradient-to-br ${GRADIENTS[idx]} flex items-center justify-center`}>
          <span className="text-white font-bold text-sm">{member?.userName?.charAt(0)}</span>
        </div>
      )}
    </div>
  );
};

export default function GroupInfoModal({ 
  isOpen, 
  onClose, 
  group, 
  currentUserId,
  onUpdateSettings,
  onManageMember,
  onRegenerateInvite,
  onLeaveGroup,
  onDeleteGroup
}) {
  const [activeTab, setActiveTab] = useState('members');
  const [copied, setCopied] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Edit mode states
  const [isEditMode, setIsEditMode] = useState(false);
  const [editGroupName, setEditGroupName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [selectedGender, setSelectedGender] = useState('male');
  const [beanConfig, setBeanConfig] = useState({
    accessory: 'none',
    body: 'chest',
    circleColor: 'blue',
    clothing: 'shirt',
    clothingColor: 'blue',
    eyebrows: 'raised',
    eyes: 'normal',
    facialHair: 'none',
    graphic: 'none',
    hair: 'short',
    hairColor: 'black',
    hat: 'none',
    hatColor: 'black',
    lashes: 'false',
    mask: true,
    faceMask: false,
    mouth: 'grin',
    skinTone: 'light'
  });

  const genders = [
    { value: 'male', label: 'Male', icon: '👨' },
    { value: 'female', label: 'Female', icon: '👩' },
    { value: 'other', label: 'Other', icon: '🧑' }
  ];

  if (!isOpen || !group) return null;

  const isAdmin = group.members?.some(m => m.userId === currentUserId && m.role === 'admin');
  const currentMember = group.members?.find(m => m.userId === currentUserId);
  
  const admins = group.members?.filter(m => m.role === 'admin') || [];
  const members = group.members?.filter(m => m.role === 'member') || [];
  const isLastAdmin = isAdmin && admins.length === 1;

  // Parse current group avatar
  let currentGroupAvatar = null;
  if (group.avatar) {
    try {
      currentGroupAvatar = typeof group.avatar === 'string' 
        ? JSON.parse(group.avatar) 
        : group.avatar;
    } catch (e) {
      console.error('Failed to parse group avatar', e);
    }
  }

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(group.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleSetting = async (setting, value) => {
    if (!isAdmin) return;
    setUpdating(true);
    await onUpdateSettings({ [setting]: value });
    setUpdating(false);
  };

  const handleMemberAction = async (targetUserId, action) => {
    if (!isAdmin) return;
    setUpdating(true);
    await onManageMember(targetUserId, action);
    setUpdating(false);
  };

  const handleLeaveGroup = async () => {
    setUpdating(true);
    await onLeaveGroup();
    setUpdating(false);
    onClose();
  };

  const handleDeleteGroup = async () => {
    setUpdating(true);
    await onDeleteGroup();
    setUpdating(false);
    onClose();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatRelativeDate = (dateStr) => {
    const d = new Date(dateStr);
    const diffDays = Math.floor((new Date() - d) / 86400000);
    if (diffDays === 0) return `Today, ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7)  return `${diffDays} days ago`;
    return `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}, ${d.getFullYear()}`;
  };

  // Start edit mode
  const handleStartEdit = () => {
    setEditGroupName(group.groupName || group.name || '');
    setEditDescription(group.description || '');
    
    // Load current avatar config
    if (currentGroupAvatar?.beanConfig) {
      setBeanConfig(currentGroupAvatar.beanConfig);
      setSelectedGender(currentGroupAvatar.gender || 'male');
    }
    
    setIsEditMode(true);
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditGroupName('');
    setEditDescription('');
  };

  // Save changes
  const handleSaveEdit = async () => {
    if (!editGroupName.trim()) {
      alert('Group name is required');
      return;
    }

    setUpdating(true);
    
    const avatarConfig = JSON.stringify({
      gender: selectedGender,
      beanConfig: beanConfig
    });

    await onUpdateSettings({
      name: editGroupName.trim(),
      description: editDescription.trim(),
      avatar: avatarConfig
    });
    
    setUpdating(false);
    setIsEditMode(false);
  };

  // Generate random bean config
  const generateRandomBeanConfig = (gender) => {
    const accessories = ['none', 'roundGlasses', 'tinyGlasses', 'shades'];
    const bodies = ['chest', 'breasts'];
    const clothings = ['naked', 'shirt', 'dressShirt', 'vneck', 'tankTop', 'dress'];
    const clothingColors = ['white', 'blue', 'black', 'green', 'red'];
    const eyebrows = ['raised', 'leftLowered', 'serious', 'angry', 'concerned'];
    const eyes = ['normal', 'leftTwitch', 'happy', 'content', 'squint', 'simple', 'dizzy', 'wink', 'heart'];
    const facialHairs = ['none', 'stubble', 'mediumBeard'];
    const graphics = ['none', 'redwood', 'gatsby', 'vue', 'react', 'graphQL'];
    const hairs = ['none', 'long', 'bun', 'short', 'pixie', 'balding', 'buzz', 'afro', 'bob'];
    const hairColors = ['blonde', 'orange', 'black', 'white', 'brown', 'blue', 'pink'];
    const hats = ['none', 'beanie', 'turban'];
    const hatColors = ['white', 'blue', 'black', 'green', 'red'];
    const lipColors = ['red', 'purple', 'pink', 'turqoise', 'green'];
    const mouths = ['grin', 'sad', 'openSmile', 'lips', 'open', 'serious', 'tongue'];
    const skinTones = ['light', 'yellow', 'brown', 'dark', 'red', 'black'];

    let bodyType = bodies[Math.floor(Math.random() * bodies.length)];
    if (gender === 'male') {
      bodyType = 'chest';
    } else if (gender === 'female') {
      bodyType = Math.random() > 0.5 ? 'chest' : 'breasts';
    }

    return {
      accessory: accessories[Math.floor(Math.random() * accessories.length)],
      body: bodyType,
      circleColor: 'blue',
      clothing: clothings[Math.floor(Math.random() * clothings.length)],
      clothingColor: clothingColors[Math.floor(Math.random() * clothingColors.length)],
      eyebrows: eyebrows[Math.floor(Math.random() * eyebrows.length)],
      eyes: eyes[Math.floor(Math.random() * eyes.length)],
      facialHair: gender === 'male' 
        ? facialHairs[Math.floor(Math.random() * facialHairs.length)]
        : 'none',
      graphic: graphics[Math.floor(Math.random() * graphics.length)],
      hair: hairs[Math.floor(Math.random() * hairs.length)],
      hairColor: hairColors[Math.floor(Math.random() * hairColors.length)],
      hat: hats[Math.floor(Math.random() * hats.length)],
      hatColor: hatColors[Math.floor(Math.random() * hatColors.length)],
      lashes: Math.random() > 0.7 ? 'true' : 'false',
      lipColor: lipColors[Math.floor(Math.random() * lipColors.length)],
      mask: true,
      faceMask: Math.random() > 0.8,
      mouth: mouths[Math.floor(Math.random() * mouths.length)],
      skinTone: skinTones[Math.floor(Math.random() * skinTones.length)]
    };
  };

  const handleGenderChange = (gender) => {
    setSelectedGender(gender);
    const newConfig = generateRandomBeanConfig(gender);
    setBeanConfig(newConfig);
  };

  const randomizeAvatar = () => {
    const newConfig = generateRandomBeanConfig(selectedGender);
    setBeanConfig(newConfig);
  };

  const getGroupInitials = (name) => {
    if (!name) return 'GR';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  // Tab configuration
  const tabs = [
    { id: 'members', label: 'Members', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'invite', label: 'Invite', icon: UserPlus }
  ];

  const palette = getCardPalette(group.groupName || group.name);

  // Toast component for notifications
  const Toast = ({ show, message, type = 'success' }) => {
    if (!show) return null;
    return (
      <div className="px-5 flex-shrink-0 mb-2">
        <div className={`px-4 py-3 bg-black rounded-2xl text-white text-sm flex items-center gap-2 animate-fade-in`}>
          {type === 'success' ? <Check size={15} strokeWidth={2.5} /> : <AlertTriangle size={15} strokeWidth={2.5} />}
          <span className="font-semibold">{message}</span>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
        <motion.div 
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="bg-white rounded-t-[2rem] sm:rounded-[2rem] w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden -2xl"
        >
          {/* Edit Mode */}
          {isEditMode ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-6 pb-4 flex-shrink-0">
                <button
                  onClick={handleCancelEdit}
                  className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200 transition-colors"
                >
                  <ChevronLeft size={17} className="text-gray-700" />
                </button>
                <h2 className="text-lg font-bold text-gray-900">Edit Group</h2>
                <button
                  onClick={handleCancelEdit}
                  className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200 transition-colors"
                >
                  <X size={16} className="text-gray-700" />
                </button>
              </div>

              <Toast show={updating} message="Saving..." type="success" />

              {/* Edit Form */}
              <div className="flex-1 overflow-y-auto px-5 space-y-6 pb-6">
                {/* Avatar Preview Card */}
                <div className="rounded-3xl p-5" style={{ backgroundColor: '#F5E09A' }}>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-green-50 flex items-center justify-center border-2 border-white">
                      <BeanHead {...beanConfig} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Group Avatar</p>
                      <button
                        onClick={randomizeAvatar}
                        className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl hover:bg-white transition-all text-sm font-medium text-gray-700"
                      >
                        <RefreshCw size={16} />
                        Randomize
                      </button>
                    </div>
                  </div>
                </div>

                {/* Group Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Group Name
                  </label>
                  <input
                    type="text"
                    value={editGroupName}
                    onChange={(e) => setEditGroupName(e.target.value)}
                    placeholder="Enter group name..."
                    className="w-full px-4 py-4 bg-gray-50  border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/20 transition-all"
                    maxLength={50}
                  />
                  <p className="text-xs text-gray-400 mt-1 text-right">{editGroupName.length}/50</p>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="What's this group about?"
                    className="w-full px-4 py-4 bg-gray-50  border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/20 resize-none transition-all"
                    rows={3}
                    maxLength={200}
                  />
                  <p className="text-xs text-gray-400 mt-1 text-right">{editDescription.length}/200</p>
                </div>
              </div>

              {/* Save Button */}
              <div className="px-5 pb-7 pt-4 flex-shrink-0">
                <button
                  onClick={handleSaveEdit}
                  disabled={!editGroupName.trim() || updating}
                  className="w-full py-4 bg-black hover:bg-gray-900 active:scale-[0.98] text-white rounded-2xl font-bold text-[15px] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {updating ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save size={18} strokeWidth={2.5} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            /* Normal Mode */
            <>
              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-6 pb-4 flex-shrink-0">
                {/* <button
                  onClick={onClose}
                  className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200 transition-colors"
                >
                  <ChevronLeft size={17} className="text-gray-700" />
                </button> */}
                <h2 className="text-lg font-bold text-gray-900">Group Info</h2>
                <button
                  onClick={onClose}
                  className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200 transition-colors"
                >
                  <X size={16} className="text-gray-700" />
                </button>
              </div>

              {/* Group Info Card */}
              <div className="px-5 mb-4">
                <div className="rounded-3xl p-5" style={{ backgroundColor: palette.bg }}>
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-white/30 flex-shrink-0">
                      {currentGroupAvatar?.beanConfig ? (
                        <BeanHead {...currentGroupAvatar.beanConfig} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl font-bold" style={{ color: palette.text }}>
                          {getGroupInitials(group.groupName || group.name)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-extrabold" style={{ color: palette.text }}>
                        {group.groupName || group.name}
                      </h3>
                      <p className="text-sm mt-1 font-medium" style={{ color: palette.sub }}>
                        Created {formatDate(group.createdAt)}
                      </p>
                      {group.description && (
                        <p className="text-sm mt-2" style={{ color: palette.text }}>
                          {group.description}
                        </p>
                      )}
                    </div>
                    {isAdmin && (
                      <button
                        onClick={handleStartEdit}
                        className="w-9 h-9 rounded-full bg-white/30 flex items-center justify-center hover:bg-white/40 transition-colors"
                      >
                        <Edit2 size={16} style={{ color: palette.text }} />
                      </button>
                    )}
                  </div>

                  {/* Member Stats */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/30">
                    <div className="flex items-center gap-2">
                      <Users size={16} style={{ color: palette.sub }} />
                      <span className="text-sm font-medium" style={{ color: palette.text }}>
                        {group.members?.length || 0} members
                      </span>
                    </div>
                    <StackedAvatars members={group.members || []} max={5} />
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
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        isActive
                          ? 'bg-white text-gray-900 -sm'
                          : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      <span className="flex items-center justify-center gap-2">
                        <Icon size={16} />
                        {tab.label} {tab.id === 'members' && `(${group.members?.length || 0})`}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-4 min-h-0">
                {/* Members Tab */}
                {activeTab === 'members' && (
                  <div className="space-y-6">
                    {/* Admins Section */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                        <Crown size={16} className="text-yellow-500" />
                        Admins · {admins.length}
                      </h3>
                      <div className="space-y-2">
                        {admins.map(member => (
                          <div
                            key={member.userId}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <SquareAvatar member={member} size={10} />
                              <div>
                                <p className="font-medium text-gray-900">
                                  {member.userName}
                                  {member.userId === currentUserId && (
                                    <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">You</span>
                                  )}
                                </p>
                                <p className="text-xs text-gray-400">{formatRelativeDate(member.joinedAt)}</p>
                              </div>
                            </div>
                            
                            <MemberCardDropdown
                              member={member}
                              currentUserId={currentUserId}
                              isAdmin={isAdmin}
                              isLastAdmin={isLastAdmin}
                              onAction={handleMemberAction}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Members Section */}
                    {members.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                          <Users size={16} className="text-gray-400" />
                          Members · {members.length}
                        </h3>
                        <div className="space-y-2">
                          {members.map(member => (
                            <div
                              key={member.userId}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <SquareAvatar member={member} size={10} />
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {member.userName}
                                    {member.userId === currentUserId && (
                                      <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">You</span>
                                    )}
                                  </p>
                                  <p className="text-xs text-gray-400">{formatRelativeDate(member.joinedAt)}</p>
                                </div>
                              </div>
                              
                              <MemberCardDropdown
                                member={member}
                                currentUserId={currentUserId}
                                isAdmin={isAdmin}
                                isLastAdmin={isLastAdmin}
                                onAction={handleMemberAction}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Leave/Delete Section */}
                    <div className="pt-4 space-y-3">
                      {/* Leave Group */}
                      {!showLeaveConfirm ? (
                        <button
                          onClick={() => setShowLeaveConfirm(true)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-50 text-orange-700 rounded-2xl hover:bg-orange-100 transition-colors font-medium text-sm"
                        >
                          <LogOut size={16} />
                          Leave Group
                        </button>
                      ) : (
                        <div className="p-4 bg-orange-50 rounded-3xl space-y-3">
                          <div className="flex items-start gap-3">
                            <AlertTriangle size={20} className="text-orange-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-orange-800">Are you sure you want to leave?</p>
                              <p className="text-xs text-orange-700 mt-1">
                                You will no longer have access to this group's messages.
                                {isLastAdmin && " As the last admin, another member will be promoted."}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setShowLeaveConfirm(false)}
                              className="flex-1 px-3 py-2 bg-white text-orange-700 rounded-xl hover:bg-orange-100 transition-colors text-sm font-medium"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleLeaveGroup}
                              disabled={updating}
                              className="flex-1 px-3 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                            >
                              {updating ? (
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                'Leave'
                              )}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Delete Group - Admin only */}
                      {isAdmin && (
                        <>
                          {!showDeleteConfirm ? (
                            <button
                              onClick={() => setShowDeleteConfirm(true)}
                              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-700 rounded-2xl hover:bg-red-100 transition-colors font-medium text-sm"
                            >
                              <Trash2 size={16} />
                              Delete Group
                            </button>
                          ) : (
                            <div className="p-4 bg-red-50 rounded-3xl space-y-3">
                              <div className="flex items-start gap-3">
                                <AlertTriangle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium text-red-800">Delete this group?</p>
                                  <p className="text-xs text-red-700 mt-1">
                                    This action cannot be undone. All messages will be permanently deleted.
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setShowDeleteConfirm(false)}
                                  className="flex-1 px-3 py-2 bg-white text-red-700 rounded-xl hover:bg-red-100 transition-colors text-sm font-medium"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={handleDeleteGroup}
                                  disabled={updating}
                                  className="flex-1 px-3 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                                >
                                  {updating ? (
                                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    'Delete'
                                  )}
                                </button>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Settings Tab */}
                {activeTab === 'settings' && (
                  <div className="space-y-4">
                    {!isAdmin && (
                      <div className="p-4 bg-yellow-50 rounded-2xl text-yellow-700 text-sm">
                        Only admins can change group settings
                      </div>
                    )}

                    <div className="space-y-3">
                      {/* Admin Only Messaging */}
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center">
                            <Lock size={18} className="text-gray-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">Admin Only Messaging</p>
                            <p className="text-xs text-gray-400">Only admins can send messages</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={group.settings?.onlyAdminsCanMessage || false}
                            onChange={(e) => handleToggleSetting('onlyAdminsCanMessage', e.target.checked)}
                            disabled={!isAdmin || updating}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                        </label>
                      </div>

                      {/* Allow Member Invites */}
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center">
                            <UserPlus size={18} className="text-gray-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">Allow Member Invites</p>
                            <p className="text-xs text-gray-400">Members can invite others with invite code</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={group.settings?.allowMemberInvite || false}
                            onChange={(e) => handleToggleSetting('allowMemberInvite', e.target.checked)}
                            disabled={!isAdmin || updating}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Invite Tab */}
                {activeTab === 'invite' && (
                  <div className="space-y-4">
                    <div className="text-center p-6 bg-gray-50 rounded-3xl">
                      <div className="w-16 h-16 rounded-2xl bg-black/5 flex items-center justify-center mx-auto mb-4">
                        <UserPlus size={32} className="text-gray-600" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">Invite People</h3>
                      <p className="text-sm text-gray-400 mb-6">
                        Share this code with friends to join the group
                      </p>
                      
                      <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="bg-black text-white px-6 py-4 rounded-2xl font-mono text-2xl tracking-widest">
                          {group.inviteCode}
                        </div>
                        <button
                          onClick={handleCopyInvite}
                          className="w-14 h-14 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 transition-colors flex items-center justify-center"
                        >
                          {copied ? <Check size={20} className="text-green-600" /> : <Copy size={20} className="text-gray-700" />}
                        </button>
                      </div>

                      {isAdmin && (
                        <button
                          onClick={onRegenerateInvite}
                          disabled={updating}
                          className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 text-sm font-medium transition-colors"
                        >
                          <RefreshCw size={16} />
                          Generate New Code
                        </button>
                      )}
                    </div>

                    <div className="p-4 bg-gray-50 rounded-2xl">
                      <p className="text-xs text-gray-400">
                        Anyone with this code can join the group. 
                        {group.settings?.allowMemberInvite 
                          ? ' Share it with friends you want to add.' 
                          : ' Only admins can add members directly.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </motion.div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
      `}</style>
    </>
  );
}