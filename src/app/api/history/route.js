import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// File-based persistent cache storage
const CACHE_DIR = path.join(process.cwd(), '.history-cache');

// Ensure cache directory exists
async function ensureCacheDir() {
  try {
    await fs.access(CACHE_DIR);
  } catch {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  }
}

// Get cache file path for a specific date
function getCacheFilePath(date) {
  return path.join(CACHE_DIR, `history-${date.replace(/[^a-zA-Z0-9]/g, '-')}.json`);
}

// Read from persistent cache
async function getFromCache(cacheKey) {
  try {
    await ensureCacheDir();
    const cacheFile = getCacheFilePath(cacheKey);
    const data = await fs.readFile(cacheFile, 'utf-8');
    const cached = JSON.parse(data);
    
    // Check if cache is still valid (24 hours)
    const cacheAge = Date.now() - cached.timestamp;
    if (cacheAge < 24 * 60 * 60 * 1000) {
      console.log('✅ Returning cached history for', cacheKey);
      return cached.events;
    }
    return null;
  } catch (error) {
    // Cache miss or error
    return null;
  }
}

// Write to persistent cache
async function writeToCache(cacheKey, events) {
  try {
    await ensureCacheDir();
    const cacheFile = getCacheFilePath(cacheKey);
    await fs.writeFile(cacheFile, JSON.stringify({
      timestamp: Date.now(),
      events: events
    }));
    
    // Clean up old cache files (keep only last 10)
    const files = await fs.readdir(CACHE_DIR);
    if (files.length > 10) {
      const sortedFiles = files
        .map(f => ({ name: f, time: fs.stat(path.join(CACHE_DIR, f)).mtimeMs }))
        .sort((a, b) => b.time - a.time);
      
      for (let i = 10; i < sortedFiles.length; i++) {
        await fs.unlink(path.join(CACHE_DIR, sortedFiles[i].name));
      }
    }
  } catch (error) {
    console.error('Failed to write to cache:', error);
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const timezone = searchParams.get('timezone') || 'UTC';
    const forceRefresh = searchParams.get('refresh') === 'true';

    const today = new Date().toLocaleDateString('en-US', {
      timeZone: timezone,
      month: 'long',
      day: 'numeric',
    });

    const cacheKey = `history-${today}`;

    // Check persistent cache first (unless force refresh)
    if (!forceRefresh) {
      const cachedEvents = await getFromCache(cacheKey);
      if (cachedEvents) {
        return NextResponse.json(cachedEvents);
      }
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not set');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

    const prompt = `You are a history expert with a focus on positive events. Generate a list of 15 significant positive historical events that happened on ${today} (month and day). For each event, provide:
- year (number)
- title (short, max 8 words)
- summary (one sentence, max 20 words)
- details (2-3 sentences, max 50 words)

Return ONLY a JSON array in this format:
[
  {
    "id": 1,
    "year": 1945,
    "title": "End of World War II",
    "summary": "Allied forces celebrate victory in Europe.",
    "details": "On May 8, 1945, the formal acceptance of Nazi Germany's unconditional surrender was signed, marking the end of World War II in Europe."
  },
  ...
]

Ensure the events are historically accurate and uplifting. Use today's date: ${today}.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean possible markdown
    let jsonText = text.trim();
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }

    const events = JSON.parse(jsonText);

    // Ensure we have exactly 15 items, pad with fallbacks if needed
    const fallbackEvents = [
      {
        id: 1,
        year: 1945,
        title: 'End of World War II',
        summary: 'Allied forces celebrate victory in Europe.',
        details: 'On May 8, 1945, the formal acceptance of Nazi Germany’s unconditional surrender was signed, marking the end of World War II in Europe.',
      },
      {
        id: 2,
        year: 1969,
        title: 'First Moon Landing',
        summary: 'Apollo 11 astronauts walk on the moon.',
        details: 'On July 20, 1969, humanity achieved its greatest technological feat – landing on the moon.',
      },
      {
        id: 3,
        year: 1991,
        title: 'World Wide Web Announced',
        summary: 'Tim Berners-Lee introduces the first web browser.',
        details: 'The World Wide Web was publicly announced on August 6, 1991, revolutionizing communication.',
      }
    ];

    const finalEvents = events.length >= 15 ? events : [...events, ...fallbackEvents].slice(0, 15);

    // Store in persistent cache
    await writeToCache(cacheKey, finalEvents);

    return NextResponse.json(finalEvents);
  } catch (error) {
    console.error('❌ History API error:', error);
    
    // Fallback static events
    const fallback = [
      {
        id: 1,
        year: 1945,
        title: 'End of World War II',
        summary: 'Allied forces celebrate victory in Europe.',
        details: 'On May 8, 1945, the formal acceptance of Nazi Germany’s unconditional surrender was signed, marking the end of World War II in Europe.',
      },
      {
        id: 2,
        year: 1969,
        title: 'First Moon Landing',
        summary: 'Apollo 11 astronauts walk on the moon.',
        details: 'On July 20, 1969, humanity achieved its greatest technological feat – landing on the moon.',
      },
      {
        id: 3,
        year: 1991,
        title: 'World Wide Web Announced',
        summary: 'Tim Berners-Lee introduces the first web browser.',
        details: 'The World Wide Web was publicly announced on August 6, 1991, revolutionizing communication.',
      },
      {
        id: 4,
        year: 1989,
        title: 'Fall of Berlin Wall',
        summary: 'East and West Germany reunite symbolically.',
        details: 'The Berlin Wall fell on November 9, 1989, marking the end of Cold War division.',
      },
      {
        id: 5,
        year: 2004,
        title: 'Mars Rover Landing',
        summary: 'Spirit rover successfully lands on Mars.',
        details: 'NASA\'s Spirit rover landed on Mars on January 3, 2004, beginning a new era of exploration.',
      },
      {
        id: 6,
        year: 1953,
        title: 'DNA Structure Discovered',
        summary: 'Watson and Crick discover DNA double helix.',
        details: 'On February 28, 1953, the structure of DNA was revealed, revolutionizing biology.',
      },
      {
        id: 7,
        year: 1928,
        title: 'Penicillin Discovered',
        summary: 'Alexander Fleming discovers the first antibiotic.',
        details: 'The discovery of penicillin on September 28, 1928, saved millions of lives.',
      },
      {
        id: 8,
        year: 1948,
        title: 'NHS Founded',
        summary: 'UK establishes National Health Service.',
        details: 'On July 5, 1948, the NHS was launched, providing free healthcare for all.',
      },
      {
        id: 9,
        year: 1963,
        title: 'Civil Rights March',
        summary: 'Martin Luther King Jr. leads March on Washington.',
        details: 'The historic march on August 28, 1963, advanced civil rights in America.',
      },
      {
        id: 10,
        year: 1977,
        title: 'Apple Computer Founded',
        summary: 'Apple Inc. is established by Steve Jobs.',
        details: 'On April 1, 1977, Apple revolutionized personal computing forever.',
      },
      {
        id: 11,
        year: 1997,
        title: 'Good Friday Agreement',
        summary: 'Northern Ireland peace accord signed.',
        details: 'The agreement on April 10, 1997, brought peace to Northern Ireland.',
      },
      {
        id: 12,
        year: 2001,
        title: 'Wikipedia Launched',
        summary: 'Free online encyclopedia goes live.',
        details: 'Wikipedia launched on January 15, 2001, democratizing knowledge.',
      },
      {
        id: 13,
        year: 2012,
        title: 'Higgs Boson Found',
        summary: 'Scientists discover the "God particle".',
        details: 'The discovery on July 4, 2012, confirmed a fundamental physics theory.',
      },
      {
        id: 14,
        year: 2015,
        title: 'Paris Climate Accord',
        summary: 'Global agreement to combat climate change.',
        details: 'On December 12, 2015, nations united to fight climate change.',
      },
      {
        id: 15,
        year: 2020,
        title: 'COVID Vaccine Success',
        summary: 'First effective COVID-19 vaccine announced.',
        details: 'The vaccine breakthrough in November 2020 marked a turning point in the pandemic.',
      }
    ];
    
    return NextResponse.json(fallback);
  }
}