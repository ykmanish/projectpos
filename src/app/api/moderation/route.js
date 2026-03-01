// app/api/moderation/route.js

import { NextResponse } from 'next/server';
import moderationService from '@/lib/moderationService';

export async function POST(request) {
  try {
    const { message, userId, userName } = await request.json();

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'Message required' },
        { status: 400 }
      );
    }

    // Run moderation
    const result = await moderationService.moderate(message, userId, userName);

    return NextResponse.json({
      success: true,
      moderation: result
    });

  } catch (error) {
    console.error('❌ Moderation API error:', error);
    return NextResponse.json(
      { success: false, error: 'Moderation failed' },
      { status: 500 }
    );
  }
}