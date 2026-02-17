// app/api/ai/enhance-message/route.js
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { message, prompt } = await request.json();

    if (!message && !prompt) {
      return NextResponse.json(
        { success: false, error: 'Message or prompt required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not set');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

    let systemPrompt = `You are an AI assistant that helps users enhance their chat messages. 
Your task is to take the user's original message and transform it according to their instructions.
Keep the core meaning and intent of the message, but improve it based on the user's request.
The response should be ONLY the enhanced message, no explanations, no quotes, no markdown formatting.
Make sure the message is appropriate for a positive, friendly chat environment.`;

    let userPrompt = '';
    
    if (message && prompt) {
      userPrompt = `Original message: "${message}"\nUser request: ${prompt}\n\nEnhanced message:`;
    } else if (message) {
      userPrompt = `Original message: "${message}"\nPlease enhance this message to make it more engaging and well-written while keeping the same meaning.\n\nEnhanced message:`;
    } else if (prompt) {
      userPrompt = `Please generate a friendly chat message based on this prompt: "${prompt}"\n\nGenerated message:`;
    }

    const result = await model.generateContent([
      { text: systemPrompt },
      { text: userPrompt }
    ]);
    
    const response = await result.response;
    let enhancedMessage = response.text().trim();

    // Clean up the response - remove quotes if present
    enhancedMessage = enhancedMessage.replace(/^["']|["']$/g, '');
    
    // Remove any markdown or extra formatting
    enhancedMessage = enhancedMessage.replace(/```/g, '').trim();

    return NextResponse.json({
      success: true,
      enhancedMessage,
    });

  } catch (error) {
    console.error('❌ AI enhancement error:', error);
    
    // Fallback to a simple enhancement if AI fails
    const { message, prompt } = await request.json().catch(() => ({}));
    
    if (message && prompt) {
      return NextResponse.json({
        success: true,
        enhancedMessage: `✨ ${message} (Enhanced with ${prompt})`,
      });
    } else if (message) {
      return NextResponse.json({
        success: true,
        enhancedMessage: `✨ ${message}`,
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to enhance message' },
        { status: 500 }
      );
    }
  }
}