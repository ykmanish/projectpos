// app/api/complete-deed/route.js
import { NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import User from '../../../../models/User';


const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
export async function POST(request) {
  try {
    await connectDB();
    
    const { userId, date } = await request.json();
    
    if (!userId || !date) {
      return NextResponse.json(
        { error: 'userId and date are required' },
        { status: 400 }
      );
    }
    
    const user = await User.findOne({ userId });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Check if already completed today
    const alreadyCompleted = user.pointsHistory.some(
      (entry) => entry.date === date
    );
    
    if (alreadyCompleted) {
      return NextResponse.json(
        { error: 'Already completed today', alreadyCompleted: true },
        { status: 400 }
      );
    }
    
    // Add point
    user.totalPoints += 1;
    user.pointsHistory.push({
      date,
      timestamp: new Date(),
      points: 1,
    });
    user.updatedAt = new Date();
    
    await user.save();
    
    return NextResponse.json({
      success: true,
      totalPoints: user.totalPoints,
      pointsHistory: user.pointsHistory,
    });
  } catch (error) {
    console.error('❌ Error in /api/complete-deed:', error);
    return NextResponse.json(
      { error: 'Failed to complete deed' },
      { status: 500 }
    );
  }
}
