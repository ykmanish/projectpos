'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Users, CirclePlus, Search, RefreshCw, Edit2, Check, ChevronLeft, UserPlus, Info } from 'lucide-react';
import { BeanHead } from 'beanheads';

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

// ─── Rounded Square Avatar for Friends ────────────────────────────
const FriendAvatar = ({ user, size = 10 }) => {
  const GRADIENTS = [
    'from-purple-400 to-purple-600', 'from-blue-400 to-blue-600',
    'from-pink-400 to-pink-600',     'from-orange-400 to-orange-600',
    'from-green-400 to-green-600',   'from-red-400 to-red-600',
    'from-yellow-400 to-yellow-500', 'from-teal-400 to-teal-600',
  ];
  const idx = (user?.userName?.charCodeAt(0) || 0) % GRADIENTS.length;
  const beanConfig = getBeanConfig(user?.avatar);
  
  return (
    <div className={`w-${size} h-${size} rounded-2xl overflow-hidden flex-shrink-0 bg-[#e8f0fe]`}>
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

// ─── Selected Friend Chip Component ───────────────────────────────
const SelectedFriendChip = ({ friend, onRemove }) => {
  const beanConfig = getBeanConfig(friend?.avatar);
  
  return (
    <div className="flex items-center gap-2 bg-black/5 rounded-full pl-1 pr-2 py-1 border border-gray-200">
      <div className="w-6 h-6 rounded-full overflow-hidden bg-[#e8f0fe]">
        {beanConfig ? (
          <BeanHead {...beanConfig} />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
            <span className="text-white text-[8px] font-bold">{friend.userName?.charAt(0)}</span>
          </div>
        )}
      </div>
      <span className="text-xs font-medium text-gray-700">{friend.userName}</span>
      <button
        onClick={() => onRemove(friend.userId)}
        className="w-5 h-5 rounded-full hover:bg-black/10 flex items-center justify-center transition-colors"
      >
        <X size={12} className="text-gray-500" />
      </button>
    </div>
  );
};

export default function CreateGroupModal({ 
  isOpen, 
  onClose, 
  userId, 
  friends, 
  onCreate, 
  editMode = false, 
  existingGroup = null 
}) {
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const [selectedGender, setSelectedGender] = useState('male');
  const [error, setError] = useState('');

  // Gender options
  const genders = [
    { value: 'male', label: 'Male', icon: '👨' },
    { value: 'female', label: 'Female', icon: '👩' },
    { value: 'other', label: 'Other', icon: '🧑' }
  ];

  // Bean Head configuration state
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

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (editMode && existingGroup) {
        // Edit mode - populate with existing data
        setGroupName(existingGroup.groupName || '');
        setDescription(existingGroup.description || '');
        
        if (existingGroup.avatar) {
          try {
            const parsed = typeof existingGroup.avatar === 'string' 
              ? JSON.parse(existingGroup.avatar) 
              : existingGroup.avatar;
            
            if (parsed.beanConfig) {
              setBeanConfig(parsed.beanConfig);
            }
            if (parsed.gender) {
              setSelectedGender(parsed.gender);
            }
          } catch (e) {
            console.error('Failed to parse group avatar', e);
          }
        }
      } else {
        // Create mode - reset form
        setGroupName('');
        setDescription('');
        setSelectedFriends([]);
        setSearchQuery('');
        setBeanConfig(generateRandomBeanConfig('male'));
        setSelectedGender('male');
      }
      setError('');
    }
  }, [isOpen, editMode, existingGroup]);

  if (!isOpen) return null;

  const filteredFriends = friends.filter(friend => 
    friend.userName?.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !selectedFriends.some(sf => sf.userId === friend.userId)
  );

  const handleSelectFriend = (friend) => {
    setSelectedFriends([...selectedFriends, friend]);
    setSearchQuery('');
  };

  const handleRemoveFriend = (friendId) => {
    setSelectedFriends(selectedFriends.filter(f => f.userId !== friendId));
  };

  // Function to generate a random bean head configuration
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

  const handleCreate = async () => {
    if (!groupName.trim()) {
      setError('Group name is required');
      return;
    }

    if (!editMode && selectedFriends.length === 0) {
      setError('Please select at least one member');
      return;
    }

    setCreating(true);
    setError('');

    try {
      const avatarConfig = JSON.stringify({
        gender: selectedGender,
        beanConfig: beanConfig
      });

      const groupData = {
        name: groupName.trim(),
        description: description.trim(),
        avatar: avatarConfig,
        groupId: editMode ? existingGroup?.groupId : undefined
      };

      // For create mode, add members
      if (!editMode) {
        groupData.members = selectedFriends.map(f => f.userId);
      }

      await onCreate(groupData);
      
      // Reset form
      setGroupName('');
      setDescription('');
      setSelectedFriends([]);
      setSearchQuery('');
      setBeanConfig(generateRandomBeanConfig('male'));
      setSelectedGender('male');
      
      onClose();
    } catch (error) {
      console.error('Error creating/updating group:', error);
      setError(error.message || 'Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  const palette = getCardPalette(editMode ? 'Edit Group' : 'Create Group');

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-[2rem] sm:rounded-[2rem] w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden -2xl">
        

        {/* Content */}
        <div className="flex-1 mt-6 overflow-y-auto px-5 pb-5 space-y-6 min-h-0">
          {/* Info Card */}
          <div className="rounded-3xl p-5" style={{ backgroundColor: palette.bg }}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/30 flex items-center justify-center">
                {editMode ? <Edit2 size={24} style={{ color: palette.text }} /> : <UserPlus size={24} style={{ color: palette.text }} />}
              </div>
              <div>
                <h3 className="text-xl font-extrabold" style={{ color: palette.text }}>
                  {editMode ? 'Edit Group Details' : 'Create a New Group'}
                </h3>
                <p className="text-sm mt-1" style={{ color: palette.sub }}>
                  {editMode ? 'Update your group information' : 'Add members and customize your group'}
                </p>
              </div>
            </div>
          </div>

          {/* Avatar Section */}
          <div className="rounded-3xl p-5 bg-gray-50">
            <h3 className="text-sm font-medium text-gray-400 mb-4">Group Avatar</h3>
            
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-[#e8f0fe]  border-gray-200">
                <BeanHead {...beanConfig} />
              </div>
              <button
                onClick={randomizeAvatar}
                className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-gray-50 rounded-xl text-gray-700 font-medium transition-all border border-gray-200 -sm"
              >
                <RefreshCw size={16} />
                Randomize
              </button>
            </div>
          </div>

          {/* Group Name */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 px-1">
              Group Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => {
                setGroupName(e.target.value);
                setError('');
              }}
              placeholder="e.g., Study Group, Family, Friends"
              className="w-full px-5 py-4 bg-gray-50  border-gray-200 text-gray-900 rounded-2xl focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
              maxLength={50}
            />
            <div className="flex justify-end">
              <span className="text-xs text-gray-400">{groupName.length}/50</span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 px-1">
              Description <span className="text-gray-400">(Optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this group about?"
              className="w-full px-5 py-4 bg-gray-50  border-gray-200 text-gray-900 rounded-2xl focus:border-black focus:ring-1 focus:ring-black outline-none resize-none"
              rows={3}
              maxLength={200}
            />
            <div className="flex justify-end">
              <span className="text-xs text-gray-400">{description.length}/200</span>
            </div>
          </div>

          {/* Add Members Section (only in create mode) */}
          {!editMode && (
            <>
              {/* Selected Members */}
              {selectedFriends.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 px-1">
                    Selected Members ({selectedFriends.length})
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {selectedFriends.map(friend => (
                      <SelectedFriendChip
                        key={friend.userId}
                        friend={friend}
                        onRemove={handleRemoveFriend}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Add Members */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 px-1">
                  Add Members <span className="text-red-400">*</span>
                </label>
                
                {/* Search Input */}
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search friends..."
                    className="w-full px-5 py-4 pl-12 bg-gray-50  border-gray-200 text-gray-900 rounded-2xl focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                </div>

                {/* Friends List */}
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {filteredFriends.length > 0 ? (
                    filteredFriends.map(friend => (
                      <button
                        key={friend.userId}
                        onClick={() => handleSelectFriend(friend)}
                        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-2xl transition-all border border-transparent hover:border-gray-200 group"
                      >
                        <div className="flex items-center gap-3">
                          <FriendAvatar user={friend} size={10} />
                          <div className="text-left">
                            <p className="font-medium text-gray-900 text-sm">{friend.userName}</p>
                            {friend.username && (
                              <p className="text-xs text-gray-400">@{friend.username}</p>
                            )}
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-xl bg-gray-100 group-hover:bg-black group-hover:text-white flex items-center justify-center transition-all">
                          <CirclePlus size={16} />
                        </div>
                      </button>
                    ))
                  ) : searchQuery ? (
                    <div className="text-center py-8 bg-gray-50 rounded-2xl">
                      <p className="text-sm text-gray-400">No friends found</p>
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-2xl">
                      <Users size={32} className="mx-auto text-gray-300 mb-2" />
                      <p className="text-sm text-gray-400">Start typing to search friends</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 rounded-2xl animate-fade-in">
              <p className="text-sm text-red-600 text-center font-medium">{error}</p>
            </div>
          )}

          {/* Info Note */}
          <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-2xl">
            <Info size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-400">
              {editMode 
                ? 'Changes will be visible to all group members.'
                : 'Groups are end-to-end encrypted. All members will have access to the group.'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-7 pt-4 flex-shrink-0">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 active:scale-[0.98] text-gray-700 rounded-2xl font-bold text-[15px] transition-all"
              disabled={creating}
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!groupName.trim() || (!editMode && selectedFriends.length === 0) || creating}
              className="flex-1 py-4 bg-black hover:bg-gray-900 active:scale-[0.98] text-white rounded-2xl font-bold text-[15px] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {creating ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {editMode ? <Check size={18} strokeWidth={2.5} /> : <Users size={18} strokeWidth={2.5} />}
                  <span>{editMode ? 'Update Group' : 'Create Group'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

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