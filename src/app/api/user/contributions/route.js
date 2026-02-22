// app/api/user/contributions/route.js

import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const year = parseInt(searchParams.get('year')) || new Date().getFullYear();

    if (!userId) {
      return NextResponse.json(
        { error: 'userId required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('positivity');
    
    // Get user's feed posts
    const feedPosts = db.collection('feedPosts');
    const vents = db.collection('vents');
    
    // Calculate date range for the selected year
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    // Fetch all feed posts by this user in the selected year
    const userFeedPosts = await feedPosts.find({
      userId: userId,
      timestamp: {
        $gte: startDate,
        $lte: endDate
      }
    }).toArray();

    // Fetch all vents by this user in the selected year
    const userVents = await vents.find({
      userId: userId,
      timestamp: {
        $gte: startDate.toISOString(),
        $lte: endDate.toISOString()
      }
    }).toArray();

    // Create a map of contributions by date
    const contributionsMap = new Map();

    // Process feed posts (each post counts as 1 contribution)
    userFeedPosts.forEach(post => {
      const postDate = new Date(post.timestamp);
      const dateKey = postDate.toISOString().split('T')[0];
      
      const currentCount = contributionsMap.get(dateKey) || 0;
      contributionsMap.set(dateKey, currentCount + 1);
    });

    // Process vents (each vent counts as 1 contribution)
    userVents.forEach(vent => {
      const ventDate = new Date(vent.timestamp);
      const dateKey = ventDate.toISOString().split('T')[0];
      
      const currentCount = contributionsMap.get(dateKey) || 0;
      contributionsMap.set(dateKey, currentCount + 1);
    });

    // Convert map to array for response
    const contributions = Array.from(contributionsMap, ([date, count]) => ({
      date,
      count
    }));

    // Calculate total contributions for the year
    const totalContributions = contributions.reduce((sum, item) => sum + item.count, 0);

    // Get monthly breakdown
    const monthlyData = {};
    contributions.forEach(item => {
      const month = new Date(item.date).getMonth();
      monthlyData[month] = (monthlyData[month] || 0) + item.count;
    });

    // Get streak data
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    // Sort contributions by date
    const sortedDates = contributions
      .map(c => c.date)
      .sort((a, b) => new Date(a) - new Date(b));

    // Calculate streaks
    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0) {
        tempStreak = 1;
        continue;
      }

      const prevDate = new Date(sortedDates[i - 1]);
      const currDate = new Date(sortedDates[i]);
      const diffDays = Math.floor((currDate - prevDate) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    
    longestStreak = Math.max(longestStreak, tempStreak);

    // Check current streak (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateKey = checkDate.toISOString().split('T')[0];
      
      if (contributionsMap.has(dateKey)) {
        currentStreak++;
      } else {
        break;
      }
    }

    return NextResponse.json({
      success: true,
      contributions,
      totalContributions,
      monthlyData,
      streaks: {
        current: currentStreak,
        longest: longestStreak
      },
      yearlyData: {
        year,
        totalPosts: userFeedPosts.length,
        totalVents: userVents.length
      }
    });

  } catch (error) {
    console.error('Error fetching contributions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contributions' },
      { status: 500 }
    );
  }
}