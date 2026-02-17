'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  X, Users, Copy, Check, Shield, ShieldCheck, UserPlus,
  UserMinus, Crown, Lock, MessageSquare, Settings, CircleMinus,
  RefreshCw, Edit2, Save, LogOut, Trash2, AlertTriangle
} from 'lucide-react';
import { BeanHead } from 'beanheads';
import Avatar from './Avatar';

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
    lipColor: 'red',
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
          {!isEditMode ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-100 dark:bg-[#232529] flex items-center justify-center text-[#202124] dark:text-white font-semibold text-lg">
                  {currentGroupAvatar?.beanConfig ? (
                    <BeanHead {...currentGroupAvatar.beanConfig} />
                  ) : (
                    getGroupInitials(group.groupName || group.name)
                  )}
                </div>
                <div>
                  <h2 className="text-xl text-[#000000] dark:text-white small font-semibold">{group.groupName || group.name}</h2>
                  <p className="text-sm text-[#5f6368] dark:text-gray-400">Created {formatDate(group.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <button
                    onClick={handleStartEdit}
                    className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full text-green-600 dark:text-green-400 transition-colors hover:bg-green-200 dark:hover:bg-green-900/50"
                    title="Edit group"
                  >
                    <Edit2 size={20} />
                  </button>
                )}
                <button
                  onClick={onClose} 
                  className="p-2 bg-gray-100 dark:bg-[#101010] rounded-full transition-colors hover:bg-gray-200 dark:hover:bg-[#181A1E]"
                >
                  <X size={20} className="text-[#202124] dark:text-white" />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-[#000000] dark:text-white">Edit Group</h2>
                <button
                  onClick={handleCancelEdit} 
                  className="p-2 hover:bg-gray-100 dark:hover:bg-[#101010] rounded-full transition-colors"
                >
                  <X size={20} className="text-[#202124] dark:text-white" />
                </button>
              </div>

              {/* Avatar Editor */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#5f6368] dark:text-gray-400 mb-3">
                    Group Avatar
                  </label>
                  
                  {/* Avatar Preview */}
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-green-50 dark:bg-green-900/30 flex items-center justify-center border-2 border-green-200 dark:border-green-800">
                      <BeanHead {...beanConfig} />
                    </div>
                    <button
                      onClick={randomizeAvatar}
                      className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-xl text-green-700 dark:text-green-400 font-medium transition-all"
                    >
                      <RefreshCw size={18} />
                      Randomize
                    </button>
                  </div>
                </div>

                {/* Group Name */}
                <div>
                  <label className="block text-sm font-medium text-[#5f6368] dark:text-gray-400 mb-2">
                    Group Name
                  </label>
                  <input
                    type="text"
                    value={editGroupName}
                    onChange={(e) => setEditGroupName(e.target.value)}
                    placeholder="Enter group name..."
                    className="w-full px-4 py-3 border border-[#dadce0] dark:border-[#232529] bg-white dark:bg-[#101010] text-[#202124] dark:text-white rounded-xl focus:ring-2 focus:ring-[#34A853] focus:border-[#34A853] focus:outline-none transition-all"
                    maxLength={50}
                  />
                  <p className="text-xs text-[#5f6368] dark:text-gray-400 mt-1">{editGroupName.length}/50 characters</p>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-[#5f6368] dark:text-gray-400 mb-2">
                    Description
                  </label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="What's this group about?"
                    className="w-full px-4 py-3 border border-[#dadce0] dark:border-[#232529] bg-white dark:bg-[#101010] text-[#202124] dark:text-white rounded-xl focus:ring-2 focus:ring-[#34A853] focus:border-[#34A853] focus:outline-none resize-none transition-all"
                    rows={3}
                    maxLength={200}
                  />
                  <p className="text-xs text-[#5f6368] dark:text-gray-400 mt-1">{editDescription.length}/200 characters</p>
                </div>

                {/* Save/Cancel Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleCancelEdit}
                    className="flex-1 px-4 py-3 border border-[#dadce0] dark:border-[#232529] text-[#202124] dark:text-white rounded-xl hover:bg-gray-50 dark:hover:bg-[#101010] transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={!editGroupName.trim() || updating}
                    className="flex-1 px-4 py-3 bg-[#34A853] text-white rounded-xl hover:bg-[#2D9249] disabled:bg-gray-200 dark:disabled:bg-[#232529] disabled:text-gray-400 dark:disabled:text-gray-600 transition-colors flex items-center justify-center gap-2 font-medium"
                  >
                    {updating ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Only show tabs and content when NOT in edit mode */}
        {!isEditMode && (
          <>
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
                      {tab.label} {tab.id === 'members' && `(${group.members?.length || 0})`}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Members Tab */}
              {activeTab === 'members' && (
                <div className="space-y-6">
                  {/* Admins */}
                  <div>
                    <h3 className="text-sm font-medium text-[#202124] dark:text-white mb-3 flex items-center gap-2">
                      <Crown size={16} className="text-yellow-600" />
                      Admins
                    </h3>
                    <div className="space-y-3">
                      {admins.map(member => (
                        <div 
                          key={member.userId}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#101010] rounded-xl hover:bg-gray-100 dark:hover:bg-[#181A1E] transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar userAvatar={member.avatar} name={member.userName} size="w-10 h-10" />
                            <div>
                              <p className="font-medium text-[#202124] dark:text-white">
                                {member.userName}
                                {member.userId === currentUserId && (
                                  <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">You</span>
                                )}
                              </p>
                              <p className="text-xs text-[#5f6368] dark:text-gray-400">Joined {formatDate(member.joinedAt)}</p>
                            </div>
                          </div>
                          
                          {isAdmin && member.userId !== currentUserId && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleMemberAction(member.userId, 'demote')}
                                className="p-2 px-4 bg-yellow-100 dark:bg-yellow-900/30 flex items-center text-sm gap-2 rounded-full text-yellow-800 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-colors"
                                title="Demote to member"
                              >
                                <Shield size={18} />
                                Demote
                              </button>
                              <button
                                onClick={() => handleMemberAction(member.userId, 'remove')}
                                className="p-2 px-4 bg-red-100 dark:bg-red-900/30 flex items-center gap-2 text-sm rounded-full text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                                title="Remove from group"
                              >
                                <CircleMinus size={18} />
                                Remove
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Members */}
                  {members.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-[#202124] dark:text-white mb-3 flex items-center gap-2">
                        <Users size={16} className="text-[#5f6368] dark:text-gray-400" />
                        Members
                      </h3>
                      <div className="space-y-3">
                        {members.map(member => (
                          <div 
                            key={member.userId}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#101010] rounded-xl hover:bg-gray-100 dark:hover:bg-[#181A1E] transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <Avatar userAvatar={member.avatar} name={member.userName} size="w-10 h-10" />
                              <div>
                                <p className="font-medium text-[#202124] dark:text-white">
                                  {member.userName}
                                  {member.userId === currentUserId && (
                                    <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">You</span>
                                  )}
                                </p>
                                <p className="text-xs text-[#5f6368] dark:text-gray-400">Joined {formatDate(member.joinedAt)}</p>
                              </div>
                            </div>
                            
                            {isAdmin && member.userId !== currentUserId && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleMemberAction(member.userId, 'promote')}
                                  className="p-2 bg-green-100 dark:bg-green-900/30 px-4 text-sm flex items-center gap-2 rounded-full text-green-800 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                                  title="Promote to admin"
                                >
                                  <ShieldCheck size={18} />
                                  Promote
                                </button>
                                <button
                                  onClick={() => handleMemberAction(member.userId, 'remove')}
                                  className="p-2 bg-red-100 dark:bg-red-900/30 px-4 text-sm flex items-center gap-2 rounded-full text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                                  title="Remove from group"
                                >
                                  <CircleMinus size={18} />
                                  Remove 
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Leave/Delete Group Section */}
                  <div className="pt-6 border-t border-[#f1f3f4] dark:border-[#181A1E]">
                    <div className="space-y-3">
                      {/* Leave Group Button */}
                      {!showLeaveConfirm ? (
                        <button
                          onClick={() => setShowLeaveConfirm(true)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-xl hover:bg-orange-100 dark:hover:bg-orange-900/50 transition-colors font-medium"
                        >
                          <LogOut size={18} />
                          Leave Group
                        </button>
                      ) : (
                        <div className="p-4 bg-orange-50 dark:bg-orange-900/30 rounded-3xl space-y-3">
                          <div className="flex items-start gap-3">
                            <AlertTriangle size={20} className="text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-orange-800 dark:text-orange-300">Are you sure you want to leave?</p>
                              <p className="text-xs text-orange-700 dark:text-orange-400 mt-1">
                                You will no longer have access to this group's messages and content.
                                {isLastAdmin && " As the last admin, if you leave, another member will be promoted to admin."}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setShowLeaveConfirm(false)}
                              className="flex-1 px-3 py-2 bg-white dark:bg-[#0c0c0c] text-orange-700 dark:text-orange-400 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/50 transition-colors text-sm"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleLeaveGroup}
                              disabled={updating}
                              className="flex-1 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm flex items-center justify-center gap-2"
                            >
                              {updating ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  <span>Leaving...</span>
                                </>
                              ) : (
                                <>
                                  <LogOut size={16} />
                                  <span>Leave</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Delete Group Button - Only for admins */}
                      {isAdmin && (
                        <>
                          {!showDeleteConfirm ? (
                            <button
                              onClick={() => setShowDeleteConfirm(true)}
                              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors font-medium"
                            >
                              <Trash2 size={18} />
                              Delete Group
                            </button>
                          ) : (
                            <div className="p-4 bg-red-50 dark:bg-red-900/30 rounded-3xl space-y-3">
                              <div className="flex items-start gap-3">
                                <AlertTriangle size={20} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium text-red-800 dark:text-red-300">Delete this group?</p>
                                  <p className="text-xs text-red-700 dark:text-red-400 mt-1">
                                    This action cannot be undone. All messages and group data will be permanently deleted for everyone.
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setShowDeleteConfirm(false)}
                                  className="flex-1 px-3 py-2 bg-white dark:bg-[#0c0c0c] text-red-700 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors text-sm"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={handleDeleteGroup}
                                  disabled={updating}
                                  className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm flex items-center justify-center gap-2"
                                >
                                  {updating ? (
                                    <>
                                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                      <span>Deleting...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Trash2 size={16} />
                                      <span>Delete</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <div className="space-y-6">
                  {!isAdmin && (
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-xl text-sm">
                      Only admins can change group settings
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#101010] rounded-xl hover:bg-gray-100 dark:hover:bg-[#181A1E] transition-colors">
                      <div className="flex items-center gap-3">
                        <Lock size={20} className="text-[#5f6368] dark:text-gray-400" />
                        <div>
                          <p className="font-medium text-[#202124] dark:text-white">Admin Only Messaging</p>
                          <p className="text-xs text-[#5f6368] dark:text-gray-400">Only admins can send messages</p>
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
                        <div className="w-11 h-6 bg-gray-200 dark:bg-[#232529] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#34A853]"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#101010] rounded-xl hover:bg-gray-100 dark:hover:bg-[#181A1E] transition-colors">
                      <div className="flex items-center gap-3">
                        <UserPlus size={20} className="text-[#5f6368] dark:text-gray-400" />
                        <div>
                          <p className="font-medium text-[#202124] dark:text-white">Allow Member Invites</p>
                          <p className="text-xs text-[#5f6368] dark:text-gray-400">Members can invite others with invite code</p>
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
                        <div className="w-11 h-6 bg-gray-200 dark:bg-[#232529] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#34A853]"></div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Invite Tab */}
              {activeTab === 'invite' && (
                <div className="space-y-6">
                  <div className="text-center p-6 bg-green-50 dark:bg-green-900/30 rounded-3xl">
                    <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center mx-auto mb-4">
                      <Users size={32} className="text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-[#202124] dark:text-white mb-2">Invite People</h3>
                    <p className="text-sm text-[#5f6368] dark:text-gray-400 mb-4">
                      Share this code with friends to join the group
                    </p>
                    
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <div className="bg-green-500 text-white px-6 py-3 rounded-xl font-mono text-2xl tracking-widest">
                        {group.inviteCode}
                      </div>
                      <button
                        onClick={handleCopyInvite}
                        className="p-3 bg-white dark:bg-[#0c0c0c] border border-[#dadce0] dark:border-[#232529] rounded-xl hover:bg-gray-50 dark:hover:bg-[#101010] transition-colors"
                      >
                        {copied ? <Check size={20} className="text-green-600" /> : <Copy size={20} className="text-[#202124] dark:text-white" />}
                      </button>
                    </div>

                    {isAdmin && (
                      <button
                        onClick={onRegenerateInvite}
                        disabled={updating}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#0c0c0c] border border-[#dadce0] dark:border-[#232529] text-[#202124] dark:text-white rounded-xl hover:bg-gray-50 dark:hover:bg-[#101010] text-sm transition-colors"
                      >
                        <RefreshCw size={16} />
                        Generate New Code
                      </button>
                    )}
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-[#101010] rounded-xl">
                    <p className="text-xs text-[#5f6368] dark:text-gray-400">
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
  );
}