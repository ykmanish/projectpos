import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL' },
        { status: 400 }
      );
    }

    // Fetch the URL with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; KindnessApp/1.0; +http://localhost)'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error('Failed to fetch URL');
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract metadata
    const title = 
      $('meta[property="og:title"]').attr('content') ||
      $('title').text() ||
      new URL(url).hostname;

    const description = 
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="description"]').attr('content') ||
      '';

    const image = 
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content') ||
      '';

    const siteName = 
      $('meta[property="og:site_name"]').attr('content') ||
      new URL(url).hostname;

    // Make relative URLs absolute
    const baseUrl = new URL(url);
    const absoluteImage = image ? new URL(image, baseUrl).toString() : '';

    return NextResponse.json({
      success: true,
      title,
      description,
      image: absoluteImage,
      url,
      siteName,
    });

  } catch (error) {
    console.error('Link preview error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to generate preview',
        fallback: {
          title: new URL(error.url || '').hostname || 'Link',
          url: error.url,
        }
      },
      { status: 200 } // Return 200 with fallback instead of error
    );
  }
}