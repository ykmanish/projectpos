'use client';

import { useState, useEffect } from 'react';
import { X, Users, CirclePlus, Search, RefreshCw, Edit2, Check } from 'lucide-react';
import Avatar from './Avatar';
import { BeanHead } from 'beanheads';

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

  // Initialize with existing group data if in edit mode
  useEffect(() => {
    if (editMode && existingGroup) {
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
    }
  }, [editMode, existingGroup]);

  if (!isOpen) return null;

  const filteredFriends = friends.filter(friend => 
    friend.userName.toLowerCase().includes(searchQuery.toLowerCase()) &&
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
    if (!groupName.trim() || (!editMode && selectedFriends.length === 0)) return;

    setCreating(true);
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
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#0c0c0c] rounded-[30px] max-w-2xl w-full max-h-[90vh] overflow-hidden transition-colors duration-300">
        <div className="p-6 border-b border-[#f1f3f4] dark:border-[#181A1E] flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2 text-[#000000] dark:text-white">
            {editMode ? 'Edit Group' : 'Create New Group'}
          </h2>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 dark:hover:bg-[#101010] rounded-full transition-colors"
          >
            <X size={20} className="text-[#202124] dark:text-white" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Avatar Selection Section */}
          <div className="mb-6 pb-6 border-b border-[#f1f3f4] dark:border-[#181A1E]">
            <h3 className="text-lg font-semibold text-[#202124] dark:text-white mb-4">Group Avatar</h3>
            
            {/* Avatar Preview and Randomize */}
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-green-50 dark:bg-green-900/30 overflow-hidden flex items-center justify-center border-2 border-green-200 dark:border-green-800">
                <BeanHead {...beanConfig} />
              </div>
              <button
                onClick={randomizeAvatar}
                className="flex items-center gap-2 px-5 py-2.5 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-xl text-green-700 dark:text-green-400 font-medium transition-all"
              >
                <RefreshCw size={18} />
                Randomize
              </button>
            </div>
          </div>

          {/* Group Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-[#202124] dark:text-white mb-2">
              Group Name *
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g., Study Group, Family, Friends"
              className="w-full px-4 py-4 bg-zinc-100/70 dark:bg-[#101010] border border-[#dadce0] dark:border-[#232529] text-[#202124] dark:text-white rounded-2xl focus:ring focus:ring-zinc-300 dark:focus:ring-zinc-700 focus:outline-none"
              maxLength={50}
            />
            <p className="text-xs text-[#5f6368] dark:text-gray-400 mt-1">{groupName.length}/50 characters</p>
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-[#202124] dark:text-white mb-2">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this group about?"
              className="w-full px-4 py-4 bg-zinc-100/70 dark:bg-[#101010] border border-[#dadce0] dark:border-[#232529] text-[#202124] dark:text-white rounded-2xl focus:ring focus:ring-zinc-300 dark:focus:ring-zinc-700 focus:outline-none resize-none"
              rows={3}
              maxLength={200}
            />
            <p className="text-xs text-[#5f6368] dark:text-gray-400 mt-1">{description.length}/200 characters</p>
          </div>

          {/* Add Members Section (only in create mode) */}
          {!editMode && (
            <>
              {/* Selected Members */}
              {selectedFriends.length > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-[#202124] dark:text-white mb-3">
                    Selected Members ({selectedFriends.length})
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {selectedFriends.map(friend => (
                      <div
                        key={friend.userId}
                        className="flex items-center gap-2 bg-green-50 dark:bg-green-900/30 rounded-full pl-2 pr-1 py-1 border border-green-200 dark:border-green-800"
                      >
                        <Avatar userAvatar={friend.avatar} name={friend.userName} size="w-6 h-6" />
                        <span className="text-sm text-[#202124] dark:text-white font-medium">{friend.userName}</span>
                        <button
                          onClick={() => handleRemoveFriend(friend.userId)}
                          className="p-1 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-full transition-colors"
                        >
                          <X size={14} className="text-green-600 dark:text-green-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Members */}
              <div>
                <label className="block text-sm font-medium text-[#202124] dark:text-white mb-2">
                  Add Members *
                </label>
                <div className="relative mb-3">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search friends..."
                    className="w-full px-4 py-4 pl-10 bg-zinc-100/70 dark:bg-[#101010] border border-[#dadce0] dark:border-[#232529] text-[#202124] dark:text-white rounded-2xl focus:ring focus:ring-[#34A853] focus:border-[#34A853] focus:outline-none"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5f6368] dark:text-gray-400" size={18} />
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {filteredFriends.length > 0 ? (
                    filteredFriends.map(friend => (
                      <button
                        key={friend.userId}
                        onClick={() => handleSelectFriend(friend)}
                        className="w-full flex items-center justify-between p-3 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-2xl transition-all border border-transparent hover:border-green-200 dark:hover:border-green-800"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar userAvatar={friend.avatar} name={friend.userName} size="w-10 h-10" />
                          <div className="text-left">
                            <p className="font-medium text-[#202124] dark:text-white text-sm">{friend.userName}</p>
                            <p className="text-xs text-[#5f6368] dark:text-gray-400">@{friend.username || 'user'}</p>
                          </div>
                        </div>
                        <CirclePlus size={18} className="text-[#34A853]" />
                      </button>
                    ))
                  ) : searchQuery ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-[#5f6368] dark:text-gray-400">No friends found</p>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users size={32} className="mx-auto text-[#dadce0] dark:text-[#232529] mb-2" />
                      <p className="text-sm text-[#5f6368] dark:text-gray-400">Start typing to search friends</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="p-6 border-t border-[#f1f3f4] dark:border-[#181A1E] flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-[#dadce0] dark:border-[#232529] text-[#202124] dark:text-white rounded-xl hover:bg-gray-50 dark:hover:bg-[#101010] transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!groupName.trim() || (!editMode && selectedFriends.length === 0) || creating}
            className="flex-1 px-4 py-3 bg-[#34A853] text-white rounded-xl hover:bg-[#2D9249] disabled:bg-gray-200 dark:disabled:bg-[#232529] disabled:text-gray-400 dark:disabled:text-gray-600 transition-colors flex items-center justify-center gap-2 font-medium"
          >
            {creating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>{editMode ? 'Updating...' : 'Creating...'}</span>
              </>
            ) : (
              <>
                {editMode ? (
                  <>
                    <Check size={18} />
                    <span>Update Group</span>
                  </>
                ) : (
                  <>
                    <Users size={18} />
                    <span>Create Group</span>
                  </>
                )}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}