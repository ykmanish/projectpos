// app/api/daily-content/route.js
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const cache = new Map();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const timezone = searchParams.get('timezone') || 'UTC';
    const userId = searchParams.get('userId') || 'anonymous';

    const userDate = new Date().toLocaleDateString('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });

    const cacheKey = `${userId}-${userDate}`;

    console.log(`🔍 Checking cache for: ${cacheKey}`);

    if (cache.has(cacheKey)) {
      console.log('✅ Returning cached data for user:', userId);
      return NextResponse.json({
        ...cache.get(cacheKey),
        cached: true,
        date: userDate,
        userId: userId
      });
    }

    const fallbackData = {
      quote: "Keep your face always toward the sunshine—and shadows will fall behind you.",
      author: "Walt Whitman",
      goodDeed: "Send a message of appreciation to someone who helped you recently."
    };

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.warn('⚠️ GEMINI_API_KEY not found. Using fallback data.');
      cache.set(cacheKey, fallbackData);
      return NextResponse.json({
        ...fallbackData,
        cached: false,
        date: userDate,
        userId: userId
      });
    }

    console.log(`🤖 Generating NEW content for user: ${userId} on ${userDate}`);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

    const prompt = `You are a mindfulness and positivity coach. Generate daily inspirational content.

Today's date: ${userDate}
User timezone: ${timezone}
User ID: ${userId}

Please respond with ONLY a valid JSON object (no markdown, no code blocks) in this exact format:
{
  "quote": "An inspiring quote (15-25 words maximum)",
  "author": "The person who said it or 'Unknown'",
  "goodDeed": "A specific positive action someone can do today (15-25 words maximum)"
}

Guidelines:
- Quote should be uplifting, meaningful, and from a real person when possible
- Good deed should be simple, actionable, and kind
- Keep both concise and impactful
- Focus on positivity, growth, and human connection
- Make it fresh and unique for this specific user and date
- Provide variety - don't repeat common quotes`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('📝 Raw Gemini Response:', text);

    let jsonText = text.trim();
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }

    const data = JSON.parse(jsonText);

    const dailyData = {
      quote: data.quote || fallbackData.quote,
      author: data.author || fallbackData.author,
      goodDeed: data.goodDeed || fallbackData.goodDeed,
    };

    cache.set(cacheKey, dailyData);

    if (cache.size > 100) {
      const entries = Array.from(cache.entries());
      entries.slice(0, cache.size - 100).forEach(([key]) => cache.delete(key));
    }

    console.log(`✅ Successfully generated and cached content for user: ${userId}`);

    return NextResponse.json({
      ...dailyData,
      cached: false,
      date: userDate,
      userId: userId
    });

  } catch (error) {
    console.error('❌ Error in daily-content API:', error);
    return NextResponse.json({
      quote: "Keep your face always toward the sunshine—and shadows will fall behind you.",
      author: "Walt Whitman",
      goodDeed: "Send a message of appreciation to someone who helped you recently.",
      error: true,
      cached: false
    });
  }
}