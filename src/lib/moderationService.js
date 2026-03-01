// lib/moderationService.js

const { GoogleGenerativeAI } = require('@google/generative-ai');

class ModerationService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.genAI = this.apiKey ? new GoogleGenerativeAI(this.apiKey) : null;
    this.model = this.genAI ? this.genAI.getGenerativeModel({ model: 'gemini-2.5-pro' }) : null;
    
    // Expanded bad words list with variations
    this.badWords = [
      // English profanity
      'fuck', 'fucking', 'fucker', 'fuckin', 'fck', 'fuk',
      'shit', 'shitting', 'shitter', 'sh*t', 'sht',
      'asshole', 'ass', 'a55', 'a$$',
      'bitch', 'bitching', 'b*tch', 'b!tch', 'btch',
      'cunt', 'c*nt',
      'dick', 'd1ck', 'dik',
      'pussy', 'pussi', 'p*ssy',
      'whore', 'hoe', 'ho',
      'slut', 'slvt',
      'bastard',
      'damn', 'damm',
      'hell',
      'piss',
      'cock',
      'penis',
      'vagina',
      
      // Common variations with numbers/symbols
      'fuk', 'fck', 'fukin', 'fuking',
      'b1tch', 'b!tch', 'b*tch',
      'sh1t', 'sh!t',
      'a55', 'a$$',
      'd1ck',
      'p*ssy', 'pussi',
      
      // Hindi/Urdu profanity (common in some regions)
      'behenchod', 'bc',
      'bhenchod',
      'machod', 'mc',
      'madarchod',
      'randi',
      'chutiya',
      'gandu',
      'bhosdi',
      'bhosdike',
      'lauda',
      'loda',
      'lund'
    ];
    
    // Create regex with word boundaries and case insensitive
    this.badWordsRegex = new RegExp(`\\b(${this.badWords.join('|')})\\b`, 'gi');
    
    // Also create a more aggressive regex for detecting even without word boundaries
    this.badWordsAggressiveRegex = new RegExp(`(${this.badWords.join('|')})`, 'gi');
    
    console.log('🛡️ Krixa Moderation Service initialized with', this.badWords.length, 'bad words');
  }

  fastModerate(message) {
    if (!message) return false;
    
    // Convert to lowercase for checking
    const lowerMessage = message.toLowerCase();
    
    // Check each bad word individually for better matching
    for (const word of this.badWords) {
      if (lowerMessage.includes(word.toLowerCase())) {
        console.log(`⚠️ Fast moderation triggered by word: ${word}`);
        return true;
      }
    }
    
    return false;
  }

  async aiModerate(message, userId, userName) {
    if (!this.model) {
      console.warn('⚠️ Gemini API not configured, falling back to regex only');
      return null;
    }

    const prompt = `You are Krixa, a friendly but strict chat moderator for a positivity-focused app. Your job is to detect toxic, harmful, or inappropriate content.

Analyze this message for toxicity:
User: ${userName || userId}
Message: "${message}"

Return a JSON object with these exact fields:
{
  "is_toxic": boolean,
  "toxicity_score": number (0-1),
  "severity": "low" | "medium" | "high",
  "action": "allow" | "warn" | "mute" | "ban",
  "reason": string (brief explanation)
}

Rules:
- Low severity (score 0.3-0.5): Minor profanity, mild rudeness → action: "warn"
- Medium severity (score 0.5-0.8): Strong profanity, harassment, bullying → action: "mute"
- High severity (score 0.8-1.0): Hate speech, threats, explicit content → action: "ban"
- Multiple violations or repeated toxicity should increase severity

Examples of bad words that should trigger warnings: fuck, shit, bitch, asshole, cunt, dick, pussy, whore, slut, bastard, damn, hell, piss, cock, and their variations.

Return ONLY the JSON object, no other text.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : text;
      
      const moderationResult = JSON.parse(jsonStr);
      
      if (!moderationResult.action || !moderationResult.severity) {
        throw new Error('Invalid moderation result structure');
      }
      
      console.log('🤖 Krixa AI moderation result:', moderationResult);
      return moderationResult;
      
    } catch (error) {
      console.error('❌ Krixa AI moderation error:', error);
      return null;
    }
  }

  async moderate(message, userId, userName) {
    if (!message || message.trim() === '') {
      return { action: 'allow', severity: 'low', is_toxic: false, toxicity_score: 0 };
    }
    
    // First check with fast moderation
    const hasBadWords = this.fastModerate(message);
    
    if (hasBadWords) {
      console.log(`⚠️ Fast moderation triggered for user ${userId}`);
      // If it's a clear violation, return a warning immediately
      return {
        is_toxic: true,
        toxicity_score: 0.7,
        severity: 'medium',
        action: 'warn',
        reason: 'Message contains inappropriate language'
      };
    }
    
    // If no bad words found, still check with AI (if available)
    const aiResult = await this.aiModerate(message, userId, userName);
    
    if (aiResult) {
      return aiResult;
    }
    
    // If AI fails and no bad words, allow the message
    return {
      is_toxic: false,
      toxicity_score: 0,
      severity: 'low',
      action: 'allow',
      reason: 'Message appears clean'
    };
  }

  getWarningMessage(severity, warningCount) {
    const warningsLeft = 3 - warningCount;
    
    const messages = {
      low: `⚠️ Krixa says: Please keep your language friendly! Warning ${warningCount}/3. ${warningsLeft} warnings left before temporary mute.`,
      medium: `⚠️⚠️ Krixa says: This is your warning ${warningCount}/3 for inappropriate content. ${warningsLeft} more warnings and you'll be temporarily muted.`,
      high: `🚫 Krixa says: Final warning! Your message violates our community guidelines. Next violation will result in a ban.`
    };
    
    return messages[severity] || messages.medium;
  }

  getMuteMessage(duration = 3600000) {
    const minutes = Math.floor(duration / 60000);
    return `🔇 Krixa has temporarily muted you for ${minutes} minutes due to repeated violations.`;
  }

  getBanMessage() {
    return `🚫 Krixa has banned you from the platform for severe violation of community guidelines.`;
  }
}

const moderationService = new ModerationService();
module.exports = { default: moderationService };