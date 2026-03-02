// app/api/points/route.js
import { NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import User from '@/models/User';


const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
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
    
    return NextResponse.json({
      success: true,
      totalPoints: user.totalPoints,
      pointsHistory: user.pointsHistory.sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      ),
    });
  } catch (error) {
    console.error('❌ Error in /api/points:', error);
    return NextResponse.json(
      { error: 'Failed to fetch points' },
      { status: 500 }
    );
  }
}
