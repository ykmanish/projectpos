// app/api/chat/link-preview/route.js

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

    // Fetch the URL with a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LinkPreviewBot/1.0)',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract metadata
    const title = 
      $('meta[property="og:title"]').attr('content') ||
      $('title').text() ||
      $('meta[name="title"]').attr('content') ||
      url;

    const description = 
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="description"]').attr('content') ||
      $('meta[name="twitter:description"]').attr('content') ||
      '';

    const image = 
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content') ||
      $('meta[property="og:image:url"]').attr('content') ||
      $('link[rel="image_src"]').attr('href') ||
      null;

    const siteName = 
      $('meta[property="og:site_name"]').attr('content') ||
      new URL(url).hostname.replace('www.', '');

    // Make relative image URLs absolute
    let absoluteImage = image;
    if (image && !image.startsWith('http')) {
      try {
        absoluteImage = new URL(image, url).href;
      } catch {
        absoluteImage = null;
      }
    }

    return NextResponse.json({
      success: true,
      preview: {
        url,
        title: title.substring(0, 200), // Limit title length
        description: description.substring(0, 300), // Limit description length
        image: absoluteImage,
        siteName,
      },
    });

  } catch (error) {
    console.error('Error fetching link preview:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch link preview',
        preview: {
          url,
          title: new URL(url).hostname,
          description: '',
          image: null,
          siteName: new URL(url).hostname.replace('www.', ''),
        }
      },
      { status: 200 } // Return 200 with basic info even on error
    );
  }
}