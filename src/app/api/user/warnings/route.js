// app/api/user/warnings/route.js

import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

// GET user warnings and ban status
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('positivity');
    const users = db.collection('users');

    const user = await users.findOne(
      { userId },
      { projection: { warnings: 1, isBanned: 1, bannedUntil: 1, muteUntil: 1 } }
    );

    return NextResponse.json({
      success: true,
      warnings: user?.warnings || 0,
      isBanned: user?.isBanned || false,
      bannedUntil: user?.bannedUntil || null,
      muteUntil: user?.muteUntil || null
    });

  } catch (error) {
    console.error('Error fetching user warnings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user warnings' },
      { status: 500 }
    );
  }
}

// POST add warning, mute, or ban
export async function POST(request) {
  try {
    const { userId, action, reason, duration, moderatorId = 'Krixa' } = await request.json();

    if (!userId || !action) {
      return NextResponse.json(
        { error: 'userId and action required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('positivity');
    const users = db.collection('users');

    let update = {};
    let response = { success: true };

    switch (action) {
      case 'add-warning':
        update = {
          $inc: { warnings: 1 },
          $push: {
            warningHistory: {
              timestamp: new Date().toISOString(),
              reason: reason || 'Inappropriate content',
              moderatedBy: moderatorId
            }
          }
        };
        response.message = `Warning added. Total warnings: (updated)`;
        break;

      case 'mute':
        const muteUntil = new Date(Date.now() + (duration || 3600000)).toISOString();
        update = {
          $set: { 
            muted: true,
            muteUntil: muteUntil,
            lastModeration: {
              action: 'mute',
              reason: reason,
              timestamp: new Date().toISOString(),
              moderatedBy: moderatorId
            }
          }
        };
        response.message = `User muted until ${new Date(muteUntil).toLocaleString()}`;
        break;

      case 'ban':
        update = {
          $set: { 
            isBanned: true,
            bannedUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
            lastModeration: {
              action: 'ban',
              reason: reason,
              timestamp: new Date().toISOString(),
              moderatedBy: moderatorId
            }
          }
        };
        response.message = 'User banned for 30 days';
        break;

      case 'reset-warnings':
        update = {
          $set: { warnings: 0 }
        };
        response.message = 'Warnings reset';
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    const result = await users.updateOne(
      { userId },
      update,
      { upsert: true }
    );

    if (action === 'add-warning') {
      // Get updated warning count
      const updated = await users.findOne({ userId });
      response.warnings = updated?.warnings || 1;
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error updating user warnings:', error);
    return NextResponse.json(
      { error: 'Failed to update user warnings' },
      { status: 500 }
    );
  }
}