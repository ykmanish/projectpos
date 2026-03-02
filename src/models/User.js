// models/User.js (add referral fields to existing schema)

import mongoose from 'mongoose';

const PointHistorySchema = new mongoose.Schema({
  date: { type: String, required: true },
  time: { type: String },
  timestamp: { type: Date, default: Date.now },
  reflection: { type: String },
  points: { type: Number, default: 1 },
  mood: { type: String, enum: ['amazing', 'good', 'okay', 'sad', 'stressed'] },
  type: { type: String, enum: ['daily', 'referral'], default: 'daily' } // NEW: Add type
});

const UserSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  preferredName: { type: String },
  username: { type: String, unique: true, sparse: true },
  avatar: { type: String },
  
  // NEW: Referral fields
  referredBy: { type: String }, // userId of the person who referred this user
  referredAt: { type: Date }, // when they were referred

  // Onboarding data
  onboardingCompleted: { type: Boolean, default: false },
  primaryGoal: { type: String, enum: ['motivation', 'kindness', 'self-growth', 'productivity', 'mindfulness', 'happiness'] },
  interests: [{ type: String, enum: ['kindness', 'productivity', 'health', 'creativity', 'relationships', 'self-care'] }],
  reminderTime: { type: String },
  currentMood: { type: String, enum: ['amazing', 'good', 'okay', 'sad', 'stressed'] },

  // Points and history
  points: { type: Number, default: 0 },
  history: [PointHistorySchema],

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.User || mongoose.model('User', UserSchema);