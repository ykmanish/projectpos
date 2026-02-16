// context/UserContext.js

'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [points, setPoints] = useState(0);
  const [pointsHistory, setPointsHistory] = useState([]);
  const [completedToday, setCompletedToday] = useState(false);
  const [content, setContent] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  
  // Feed related states
  const [feedPosts, setFeedPosts] = useState([]);
  const [loadingFeed, setLoadingFeed] = useState(false);
  
  // Referral related states
  const [referralCode, setReferralCode] = useState('');
  const [referrals, setReferrals] = useState([]);
  const [totalReferrals, setTotalReferrals] = useState(0);
  const [referralPoints, setReferralPoints] = useState(0);

  const levelThresholds = [
    { level: 1, min: 0, max: 4 },
    { level: 2, min: 5, max: 9 },
    { level: 3, min: 10, max: 14 },
    { level: 4, min: 15, max: 19 },
    { level: 5, min: 20, max: 24 },
    { level: 6, min: 25, max: 29 },
    { level: 7, min: 30, max: 34 },
    { level: 8, min: 35, max: 39 },
    { level: 9, min: 40, max: 44 },
    { level: 10, min: 45, max: 49 },
    { level: 11, min: 50, max: 54 },
    { level: 12, min: 55, max: 59 },
    { level: 13, min: 60, max: 64 },
    { level: 14, min: 65, max: 69 },
    { level: 15, min: 70, max: Infinity },
  ];

  const getCurrentLevel = (pts) => {
    for (let i = 0; i < levelThresholds.length; i++) {
      if (pts >= levelThresholds[i].min && pts <= levelThresholds[i].max) {
        return levelThresholds[i].level;
      }
    }
    return 15;
  };

  const getNextLevelPoints = (pts) => {
    const current = getCurrentLevel(pts);
    if (current === 15) return null;
    const nextThreshold = levelThresholds.find((l) => l.level === current + 1);
    return nextThreshold ? nextThreshold.min : null;
  };

  const getProgressPercent = (pts) => {
    const current = getCurrentLevel(pts);
    if (current === 15) return 100;
    const currentLevel = levelThresholds.find((l) => l.level === current);
    const nextLevel = levelThresholds.find((l) => l.level === current + 1);
    const range = nextLevel.min - currentLevel.min;
    const progress = pts - currentLevel.min;
    return Math.min(100, Math.round((progress / range) * 100));
  };

  // Generate referral code from userId
  const generateReferralCode = (id) => {
    if (!id) return '';
    const code = id.replace('user_', '').slice(0, 8).toUpperCase();
    return code;
  };

  // Initialize user data from localStorage (only on mount)
  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    const storedUserName = localStorage.getItem('userName');
    const storedUserEmail = localStorage.getItem('userEmail');
    const storedUsername = localStorage.getItem('username');
    const storedAvatar = localStorage.getItem('avatar');

    if (storedUserId && storedUserName) {
      setUserId(storedUserId);
      setUserName(storedUserName);
      setUserEmail(storedUserEmail || '');
      setUsername(storedUsername || '');
      if (storedAvatar) {
        try {
          setAvatar(JSON.parse(storedAvatar));
        } catch (e) {
          console.error('Failed to parse stored avatar', e);
        }
      }
      setIsInitialized(true);
    }
  }, []);

  // Fetch user data and daily content when userId is available
  useEffect(() => {
    if (userId && isInitialized) {
      fetchUserData();
      fetchDailyContent();
      fetchReferralData();
      fetchFeedPosts(); // Fetch feed posts when user logs in
    }
  }, [userId, isInitialized]);

  // Fetch referral data
  const fetchReferralData = async () => {
    try {
      const res = await fetch(`/api/referrals?userId=${encodeURIComponent(userId)}`);
      const data = await res.json();
      if (data.success) {
        setReferralCode(data.referralCode || generateReferralCode(userId));
        setReferrals(data.referrals || []);
        setTotalReferrals(data.totalReferrals || 0);
        setReferralPoints(data.referralPoints || 0);
      }
    } catch (error) {
      console.error('Failed to fetch referral data:', error);
    }
  };

  // NEW: Fetch feed posts
  const fetchFeedPosts = async () => {
    if (!userId) return;
    
    setLoadingFeed(true);
    try {
      const response = await fetch(`/api/feed?userId=${encodeURIComponent(userId)}`);
      const data = await response.json();
      
      if (data.success) {
        setFeedPosts(data.posts || []);
      }
    } catch (error) {
      console.error('Error fetching feed:', error);
    } finally {
      setLoadingFeed(false);
    }
  };

  // NEW: Like a post
  const likePost = async (postId) => {
    if (!userId) return;

    try {
      const response = await fetch('/api/feed/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          userId
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Update local state
        setFeedPosts(prevPosts =>
          prevPosts.map(post => {
            if (post._id === postId) {
              const hasLiked = post.likes?.includes(userId);
              return {
                ...post,
                likes: hasLiked
                  ? post.likes.filter(id => id !== userId)
                  : [...(post.likes || []), userId],
                likeCount: hasLiked ? (post.likeCount || 1) - 1 : (post.likeCount || 0) + 1
              };
            }
            return post;
          })
        );
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  // NEW: Add comment to post
  const addComment = async (postId, comment) => {
    if (!userId || !comment.trim()) return false;

    try {
      const response = await fetch('/api/feed/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          userId,
          userName,
          avatar,
          comment: comment.trim()
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Update local state
        setFeedPosts(prevPosts =>
          prevPosts.map(post => {
            if (post._id === postId) {
              return {
                ...post,
                comments: [data.comment, ...(post.comments || [])],
                commentCount: (post.commentCount || 0) + 1
              };
            }
            return post;
          })
        );
        return true;
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
    return false;
  };

  const fetchUserData = async () => {
    try {
      const res = await fetch(`/api/user?userId=${encodeURIComponent(userId)}`);
      const data = await res.json();
      if (data.user) {
        setPoints(data.user.points || 0);
        setPointsHistory(data.user.history || []);
        setOnboardingCompleted(data.user.onboardingCompleted || false);
        setUsername(data.user.username || '');
        if (data.user.avatar) {
          try {
            const parsedAvatar = JSON.parse(data.user.avatar);
            setAvatar(parsedAvatar);
            localStorage.setItem('avatar', data.user.avatar);
          } catch (e) {
            console.error('Failed to parse avatar from DB', e);
          }
        }
        if (data.user.username) localStorage.setItem('username', data.user.username);
        if (data.user.preferredName) {
          setUserName(data.user.preferredName);
          localStorage.setItem('userName', data.user.preferredName);
        }

        // FIXED: Only check for daily completion entries, not referral entries
        const todayStr = new Date().toLocaleDateString('en-CA');
        const hasCompletedToday = data.user.history?.some(
          (entry) => entry.date === todayStr && entry.type !== 'referral' && entry.type !== 'referral_bonus'
        ) || false;
        
        setCompletedToday(hasCompletedToday);
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    }
  };

  const fetchDailyContent = async () => {
    setIsLoading(true);
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const today = new Date().toLocaleDateString('en-CA', { timeZone: timezone });
      
      // Check localStorage cache first
      const cachedContent = localStorage.getItem(`dailyContent_${userId}`);
      const cachedDate = localStorage.getItem(`dailyContentDate_${userId}`);

      if (cachedContent && cachedDate === today) {
        setContent(JSON.parse(cachedContent));
        setIsLoading(false);
        return;
      }

      const response = await fetch(
        `/api/daily-content?timezone=${encodeURIComponent(timezone)}&userId=${encodeURIComponent(userId)}`
      );
      const data = await response.json();

      setContent(data);
      localStorage.setItem(`dailyContent_${userId}`, JSON.stringify(data));
      localStorage.setItem(`dailyContentDate_${userId}`, today);

      setIsLoading(false);
    } catch (error) {
      console.error('❌ Error fetching daily content:', error);
      setContent({
        quote: 'Keep your face always toward the sunshine—and shadows will fall behind you.',
        author: 'Walt Whitman',
        goodDeed: 'Send a message of appreciation to someone who helped you recently.',
      });
      setIsLoading(false);
    }
  };

  const saveUserName = async (name) => {
    localStorage.setItem('userName', name.trim());
    setUserName(name.trim());
    setIsInitialized(true);
  };

  // In context/UserContext.js - replace the submitReflection function

// In context/UserContext.js - Replace the submitReflection function

const submitReflection = async (reflectionText, attachments = []) => {
  const now = new Date();
  const todayStr = now.toLocaleDateString('en-CA');
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const newEntry = {
    date: todayStr,
    time: timeStr,
    reflection: reflectionText.trim() || 'No reflection provided',
    points: 1,
    type: 'daily',
  };

  try {
    const res = await fetch('/api/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        action: 'addPoint',
        entry: newEntry,
      }),
    });
    const data = await res.json();
    
    if (data.user) {
      setPoints(data.user.points);
      setPointsHistory(data.user.history);
      setCompletedToday(true);
      
      // Create feed post after successful reflection
      if (content) {
        try {
          // Make sure avatar is properly stringified if it exists
          const avatarToSend = avatar ? (typeof avatar === 'object' ? JSON.stringify(avatar) : avatar) : null;
          
          // Process attachments to ensure they're in the correct format
          const processedAttachments = attachments.map(att => {
            if (att.type === 'link') {
              return {
                id: att.id,
                type: 'link',
                url: att.url,
                preview: att.preview || {
                  title: att.url,
                  url: att.url
                }
              };
            } else {
              return {
                id: att.id,
                type: att.type,
                url: att.url,
                name: att.name,
                mimeType: att.mimeType
              };
            }
          });
          
          const feedResponse = await fetch('/api/feed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              reflection: reflectionText.trim(),
              goodDeed: content.goodDeed,
              userName,
              userUsername: username,
              userAvatar: avatarToSend,
              attachments: processedAttachments // Send the attachments
            }),
          });
          
          const feedData = await feedResponse.json();
          if (feedData.success) {
            // Refresh feed after new post
            fetchFeedPosts();
            return true;
          } else {
            console.error('Feed post creation failed:', feedData.error);
            return false;
          }
        } catch (feedError) {
          console.error('Error creating feed post:', feedError);
          return false;
        }
      }
    }
    return true;
  } catch (error) {
    console.error('Error saving point:', error);
    // Fallback for offline/error
    setPoints((prev) => prev + 1);
    setPointsHistory((prev) => [newEntry, ...prev]);
    setCompletedToday(true);
    return false;
  }
};

  const login = (userData) => {
    setUserId(userData.userId);
    setUserName(userData.preferredName || userData.name);
    setUserEmail(userData.email);
    setUsername(userData.username || '');
    if (userData.avatar) {
      try {
        const parsed = JSON.parse(userData.avatar);
        setAvatar(parsed);
        localStorage.setItem('avatar', userData.avatar);
      } catch (e) {
        console.error('Failed to parse avatar during login', e);
      }
    }
    setIsInitialized(true);

    localStorage.setItem('userId', userData.userId);
    localStorage.setItem('userName', userData.preferredName || userData.name);
    localStorage.setItem('userEmail', userData.email);
    if (userData.username) localStorage.setItem('username', userData.username);
  };

  const updateProfile = async ({ preferredName, username, avatar }) => {
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, preferredName, username, avatar }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.user.preferredName) {
          setUserName(data.user.preferredName);
          localStorage.setItem('userName', data.user.preferredName);
        }
        if (data.user.username) {
          setUsername(data.user.username);
          localStorage.setItem('username', data.user.username);
        }
        if (data.user.avatar) {
          try {
            const parsedAvatar = JSON.parse(data.user.avatar);
            setAvatar(parsedAvatar);
            localStorage.setItem('avatar', data.user.avatar);
          } catch (e) {
            console.error('Failed to parse avatar from update response', e);
          }
        }
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const checkUsername = async (username) => {
    try {
      const res = await fetch(`/api/user/check-username?username=${encodeURIComponent(username)}&userId=${encodeURIComponent(userId)}`);
      const data = await res.json();
      return data.available;
    } catch {
      return false;
    }
  };

  const changePassword = async ({ currentPassword, newPassword }) => {
    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) return { success: true };
      else return { success: false, error: data.error };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('username');
    localStorage.removeItem('avatar');
    
    setUserId('');
    setUserName('');
    setUserEmail('');
    setUsername('');
    setAvatar(null);
    setPoints(0);
    setPointsHistory([]);
    setIsInitialized(false);
    setReferralCode('');
    setReferrals([]);
    setTotalReferrals(0);
    setReferralPoints(0);
    setFeedPosts([]); // Clear feed on logout
    
    window.location.href = '/signin';
  };

  const copyReferralLink = () => {
    const link = `${window.location.origin}/signup?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    return link;
  };

  const value = {
    userName,
    userId,
    userEmail,
    username,
    avatar,
    points,
    pointsHistory,
    completedToday,
    content,
    isLoading,
    isInitialized,
    onboardingCompleted,
    levelThresholds,
    getCurrentLevel,
    getNextLevelPoints,
    getProgressPercent,
    saveUserName,
    submitReflection,
    fetchUserData,
    logout,
    login,
    updateProfile,
    checkUsername,
    changePassword,
    referralCode,
    referrals,
    totalReferrals,
    referralPoints,
    fetchReferralData,
    copyReferralLink,
    // Feed related exports
    feedPosts,
    loadingFeed,
    fetchFeedPosts,
    likePost,
    addComment,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
}