// models/Referral.js (new file)

import mongoose from 'mongoose';

const ReferralSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true }, // referrer's userId
  referralCode: { type: String, required: true, unique: true },
  
  referrals: [{
    userId: { type: String, required: true }, // referred user's userId
    email: { type: String },
    name: { type: String },
    joinedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['pending', 'active'], default: 'pending' }
  }],
  
  totalReferrals: { type: Number, default: 0 },
  referralPoints: { type: Number, default: 0 },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.models.Referral || mongoose.model('Referral', ReferralSchema);