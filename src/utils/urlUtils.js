// utils/codeUtils.js

// Regular expression to detect code blocks (supports both with and without language specifier)
const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
const inlineCodeRegex = /`([^`]+)`/g;

/**
 * Extract code blocks from text
 * @param {string} text - The text to extract code blocks from
 * @returns {Array} - Array of code blocks with language and code
 */
export const extractCodeBlocks = (text) => {
  if (!text) return [];
  
  const blocks = [];
  let match;
  
  // Reset regex lastIndex
  codeBlockRegex.lastIndex = 0;
  
  while ((match = codeBlockRegex.exec(text)) !== null) {
    blocks.push({
      type: 'block',
      language: match[1] || 'text',
      code: match[2].trim(),
      fullMatch: match[0],
      index: match.index
    });
  }
  
  return blocks;
};

/**
 * Extract inline code from text
 * @param {string} text - The text to extract inline code from
 * @returns {Array} - Array of inline code matches
 */
export const extractInlineCode = (text) => {
  if (!text) return [];
  
  const matches = [];
  let match;
  
  // Reset regex lastIndex
  inlineCodeRegex.lastIndex = 0;
  
  while ((match = inlineCodeRegex.exec(text)) !== null) {
    matches.push({
      type: 'inline',
      code: match[1],
      fullMatch: match[0],
      index: match.index
    });
  }
  
  return matches;
};

/**
 * Parse message content into parts (text, code blocks, inline code)
 * @param {string} text - The message content
 * @returns {Array} - Array of content parts
 */
export const parseMessageContent = (text) => {
  if (!text) return [{ type: 'text', content: '' }];
  
  const parts = [];
  const codeBlocks = extractCodeBlocks(text);
  const inlineCodes = extractInlineCode(text);
  
  let lastIndex = 0;
  
  // Sort all matches by index
  const allMatches = [
    ...codeBlocks.map(m => ({ ...m, priority: 0 })),
    ...inlineCodes.map(m => ({ ...m, priority: 1 }))
  ].sort((a, b) => a.index - b.index);
  
  for (const match of allMatches) {
    // Add text before the match
    if (match.index > lastIndex) {
      const textContent = text.substring(lastIndex, match.index);
      if (textContent) {
        parts.push({
          type: 'text',
          content: textContent
        });
      }
    }
    
    // Add the code match
    if (match.type === 'block') {
      parts.push({
        type: 'code-block',
        language: match.language || 'text',
        code: match.code
      });
    } else {
      parts.push({
        type: 'inline-code',
        code: match.code
      });
    }
    
    lastIndex = match.index + match.fullMatch.length;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    const remainingText = text.substring(lastIndex);
    if (remainingText) {
      parts.push({
        type: 'text',
        content: remainingText
      });
    }
  }
  
  return parts;
};

/**
 * Check if text contains code blocks
 * @param {string} text - The text to check
 * @returns {boolean} - True if text contains code blocks
 */
export const containsCodeBlocks = (text) => {
  return codeBlockRegex.test(text);
};

/**
 * Get all code blocks from text
 * @param {string} text - The text to extract code from
 * @returns {Array} - Array of code blocks
 */
export const getAllCodeBlocks = (text) => {
  return extractCodeBlocks(text);
};