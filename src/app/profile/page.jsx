// app/profile/page.js

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { Calendar, Check, X, RefreshCw, Eye, EyeOff, Save, Sun, Moon, Monitor, Palette } from 'lucide-react';
import { BeanHead } from 'beanheads'; // Correct named import

export default function ProfilePage() {
  const router = useRouter();
  const { userName, username: currentUsername, avatar: currentAvatar, updateProfile, checkUsername, changePassword } = useUser();

  // Theme state
  const [theme, setTheme] = useState('system');
  const [mounted, setMounted] = useState(false);

  // Gender options
  const genders = [
    { value: 'male', label: 'Male', icon: '👨' },
    { value: 'female', label: 'Female', icon: '👩' },
    { value: 'other', label: 'Other', icon: '🧑' }
  ];

  // Theme options
  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor }
  ];

  // Form states
  const [displayName, setDisplayName] = useState(userName || '');
  const [username, setUsername] = useState(currentUsername || '');
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [selectedGender, setSelectedGender] = useState('male');

  // Bean Head configuration state with all available props
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

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // UI states
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  // Initialize theme from localStorage
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme') || 'system';
    setTheme(savedTheme);
    
    // Apply theme
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (savedTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // System preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  // Initialize from current avatar if exists
  useEffect(() => {
    if (currentAvatar) {
      try {
        const parsed = typeof currentAvatar === 'string' ? JSON.parse(currentAvatar) : currentAvatar;
        if (parsed.beanConfig) {
          setBeanConfig(parsed.beanConfig);
        }
        if (parsed.gender) {
          setSelectedGender(parsed.gender);
        }
      } catch (e) {
        console.error('Failed to parse avatar', e);
      }
    }
  }, [currentAvatar]);

  // Check username availability with debounce
  useEffect(() => {
    if (!username || username === currentUsername) {
      setUsernameAvailable(null);
      return;
    }
    const timer = setTimeout(async () => {
      setCheckingUsername(true);
      const available = await checkUsername(username);
      setUsernameAvailable(available);
      setCheckingUsername(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [username, currentUsername, checkUsername]);

  // Handle theme change
  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (newTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // System preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  // Function to generate a random bean head configuration
  const generateRandomBeanConfig = (gender) => {
    // Available options based on the Bean Heads documentation
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

    // Gender-specific logic
    let bodyType = bodies[Math.floor(Math.random() * bodies.length)];
    if (gender === 'male') {
      bodyType = 'chest'; // Male typically uses chest
    } else if (gender === 'female') {
      bodyType = Math.random() > 0.5 ? 'chest' : 'breasts'; // Mix for female
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
        : 'none', // Less facial hair for female/other
      graphic: graphics[Math.floor(Math.random() * graphics.length)],
      hair: hairs[Math.floor(Math.random() * hairs.length)],
      hairColor: hairColors[Math.floor(Math.random() * hairColors.length)],
      hat: hats[Math.floor(Math.random() * hats.length)],
      hatColor: hatColors[Math.floor(Math.random() * hatColors.length)],
      lashes: Math.random() > 0.7 ? 'true' : 'false',
      lipColor: lipColors[Math.floor(Math.random() * lipColors.length)],
      mask: true, // Always true to get circular avatar
      faceMask: Math.random() > 0.8, // 20% chance of face mask
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

  const handleSaveProfile = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    if (username && username !== currentUsername) {
      const available = await checkUsername(username);
      if (!available) {
        setMessage({ type: 'error', text: 'Username is already taken' });
        setSaving(false);
        return;
      }
    }

    const avatarConfig = JSON.stringify({
      gender: selectedGender,
      beanConfig: beanConfig
    });

    const result = await updateProfile({
      preferredName: displayName,
      username: username || null,
      avatar: avatarConfig
    });

    if (result.success) {
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to update profile' });
    }
    setSaving(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    const result = await changePassword({ currentPassword, newPassword });
    if (result.success) {
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPasswordError(result.error || 'Failed to change password');
    }
  };

  // Don't render theme-dependent UI until mounted to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <main className="flex-1 p-4 md:p-8 bg-[#EEF1F0] dark:bg-[#000000] overflow-y-auto min-h-screen transition-colors duration-300">
      <header className="space-y-3 flex flex-col lg:flex-row lg:justify-between lg:items-center lg:ml-4 mb-10">
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-[#0c0c0c] text-sm font-medium text-[#5f6368] dark:text-gray-400 mb-4">
            <Calendar className="w-4 h-4 text-[#1a73e8]" />
            <span>{today}</span>
          </div>
          <h1 className="text-4xl small md:text-4xl font-semibold text-[#000000] dark:text-white tracking-tight">
            Your Profile
          </h1>
          <p className="text-base text-[#5f6368] dark:text-gray-400 font-normal">
            Manage your personal information and settings
          </p>
        </div>
       
        {/* Desktop Save Button - Hidden on mobile */}
        <div className="hidden lg:block">
          <button
            onClick={handleSaveProfile}
            disabled={saving || (username && username !== currentUsername && usernameAvailable === false)}
            className="flex items-center gap-2 px-8 py-4 bg-[#23A269] hover:bg-[#1e8a5a] text-white rounded-2xl disabled:bg-gray-300 dark:disabled:bg-[#232529] disabled:cursor-not-allowed font-medium text-lg transition-all"
          >
            {saving ? <RefreshCw size={20} className="animate-spin" /> : <Save size={20} />}
            Save Profile Changes
          </button>
        </div>
      </header>

      {message.text && (
        <div className={`mb-6 p-4 rounded-2xl ${
          message.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
            : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      <div className="space-y-8 max-w-7xl">
        {/* Profile Picture and Theme Selection - Side by Side */}
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Avatar Section with Gender Selection */}
          <div className="bg-white dark:bg-[#0c0c0c] rounded-3xl p-8  border-[#dadce0] dark:border-[#181A1E] transition-colors duration-300">
            <h2 className="text-2xl font-semibold small text-[#000000] dark:text-white mb-6">Profile Picture</h2>
            
            {/* Gender Selection */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-[#5f6368] dark:text-gray-400 mb-3">
                Select Gender
              </label>
              <div className="flex gap-4 flex-wrap">
                {genders.map((gender) => (
                  <button
                    key={gender.value}
                    onClick={() => handleGenderChange(gender.value)}
                    className={`
                      flex items-center gap-3 px-6 py-3 rounded-2xl transition-all duration-200
                      ${selectedGender === gender.value 
                        ? 'bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800' 
                        : 'border border-zinc-200 dark:border-[#232529] hover:bg-gray-50 dark:hover:bg-[#101010]'
                      }
                    `}
                  >
                    <span className="text-2xl">{gender.icon}</span>
                    <span className="font-medium text-[#202124] dark:text-white">{gender.label}</span>
                    {selectedGender === gender.value && (
                      <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-8 flex-wrap">
              <div className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/30 overflow-hidden flex items-center justify-center">
                {/* Bean Head Avatar */}
                <BeanHead {...beanConfig} />
              </div>
              <button
                onClick={randomizeAvatar}
                className="flex items-center gap-2 px-6 py-3 bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 rounded-xl text-green-600 dark:text-green-400 font-medium transition-all"
              >
                <RefreshCw size={20} />
                Randomize Avatar
              </button>
            </div>
          </div>

          {/* Theme Selection Card */}
          <div className="bg-white dark:bg-[#0c0c0c] rounded-3xl p-8  border-[#dadce0] dark:border-[#181A1E] transition-colors duration-300">
  <div className="flex items-center gap-3 mb-6">
    <Palette className="w-6 h-6 text-[#23A269]" />
    <h2 className="text-2xl font-semibold small text-[#000000] dark:text-white">Theme Preference</h2>
  </div>
  
  <p className="text-sm text-[#5f6368] dark:text-gray-400 mb-6">
    Choose how the application looks. You can switch between light, dark, or system theme.
  </p>

  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
    {themeOptions.map((option) => {
      const Icon = option.icon;
      return (
        <button
          key={option.value}
          onClick={() => handleThemeChange(option.value)}
          className={`
            flex items-center justify-between p-4 rounded-2xl transition-all duration-200 h-full
            ${theme === option.value 
              ? 'bg-green-100 dark:bg-green-900/30 border-2 border-green-500 dark:border-green-600' 
              : 'border border-zinc-200 dark:border-[#232529] hover:bg-gray-50 dark:hover:bg-[#101010]'
            }
          `}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              theme === option.value
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 dark:bg-[#232529] text-[#5f6368] dark:text-gray-400'
            }`}>
              <Icon size={20} />
            </div>
            <span className="font-medium text-[#202124] dark:text-white">{option.label}</span>
          </div>
          {theme === option.value && (
            <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
          )}
        </button>
      );
    })}
  </div>

  <div className="mt-6 p-4 bg-gray-50 dark:bg-[#101010] rounded-2xl">
    <p className="text-xs text-[#5f6368] dark:text-gray-400">
      <span className="font-medium text-[#202124] dark:text-white">Preview: </span>
      {theme === 'light' && 'Light mode is active with white backgrounds.'}
      {theme === 'dark' && 'Dark mode is active with dark backgrounds.'}
      {theme === 'system' && 'Following your system preference.'}
    </p>
  </div>
</div>
        </div>

        <div className='grid lg:grid-cols-2 gap-4'>
          {/* Basic Information */}
          <div className="bg-white dark:bg-[#0c0c0c] rounded-3xl p-8  border-[#dadce0] dark:border-[#181A1E] transition-colors duration-300">
            <h2 className="text-2xl font-semibold small text-[#000000] dark:text-white mb-6">Basic Information</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-[#5f6368] dark:text-gray-400 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-4 border border-[#dadce0] dark:border-[#232529] bg-white dark:bg-[#101010] text-[#202124] dark:text-white rounded-2xl focus:ring-2 focus:ring-[#1a73e8] focus:border-[#1a73e8] focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#5f6368] dark:text-gray-400 mb-2">
                  Username (optional, unique)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="username"
                    className="w-full px-4 py-4 border border-[#dadce0] dark:border-[#232529] bg-white dark:bg-[#101010] text-[#202124] dark:text-white rounded-2xl focus:ring-2 focus:ring-[#1a73e8] focus:border-[#1a73e8] focus:outline-none transition-all pr-12"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    {checkingUsername ? (
                      <RefreshCw size={20} className="animate-spin text-[#5f6368] dark:text-gray-400" />
                    ) : usernameAvailable === true ? (
                      <Check size={20} className="text-green-500" />
                    ) : usernameAvailable === false ? (
                      <X size={20} className="text-red-500" />
                    ) : null}
                  </div>
                </div>
                {username && username !== currentUsername && usernameAvailable === false && (
                  <p className="text-sm text-red-500 dark:text-red-400 mt-1">Username is already taken</p>
                )}
                {username && username !== currentUsername && usernameAvailable === true && (
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">Username is available</p>
                )}
                <p className="text-xs text-[#5f6368] dark:text-gray-400 mt-2">Only lowercase letters, numbers, and underscores.</p>
              </div>
            </div>
          </div>

          {/* Change Password */}
          <div className="bg-white dark:bg-[#0c0c0c] rounded-3xl p-8  border-[#dadce0] dark:border-[#181A1E] transition-colors duration-300">
            <h2 className="text-2xl font-semibold small text-[#000000] dark:text-white mb-6">Change Password</h2>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#5f6368] dark:text-gray-400 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-4 border border-[#dadce0] dark:border-[#232529] bg-white dark:bg-[#101010] text-[#202124] dark:text-white rounded-2xl focus:ring-2 focus:ring-[#1a73e8] focus:border-[#1a73e8] focus:outline-none transition-all pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5f6368] dark:text-gray-400"
                  >
                    {showCurrent ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#5f6368] dark:text-gray-400 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-4 border border-[#dadce0] dark:border-[#232529] bg-white dark:bg-[#101010] text-[#202124] dark:text-white rounded-2xl focus:ring-2 focus:ring-[#1a73e8] focus:border-[#1a73e8] focus:outline-none transition-all pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5f6368] dark:text-gray-400"
                  >
                    {showNew ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#5f6368] dark:text-gray-400 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-4 border border-[#dadce0] dark:border-[#232529] bg-white dark:bg-[#101010] text-[#202124] dark:text-white rounded-2xl focus:ring-2 focus:ring-[#1a73e8] focus:border-[#1a73e8] focus:outline-none transition-all pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5f6368] dark:text-gray-400"
                  >
                    {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              {passwordError && <p className="text-sm text-red-500 dark:text-red-400">{passwordError}</p>}
              <button
                type="submit"
                className="px-6 py-3 bg-[#23A269] hover:bg-[#1e8a5a] text-white rounded-xl font-medium transition-all"
              >
                Update Password
              </button>
            </form>
          </div>
        </div>
        
        {/* Mobile Save Button - Only visible on mobile */}
        <div className="lg:hidden">
          <button
            onClick={handleSaveProfile}
            disabled={saving || (username && username !== currentUsername && usernameAvailable === false)}
            className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-[#23A269] hover:bg-[#1e8a5a] text-white rounded-2xl disabled:bg-gray-300 dark:disabled:bg-[#232529] disabled:cursor-not-allowed font-medium text-lg transition-all"
          >
            {saving ? <RefreshCw size={20} className="animate-spin" /> : <Save size={20} />}
            Save Profile Changes
          </button>
        </div>
      </div>
    </main>
  );
}