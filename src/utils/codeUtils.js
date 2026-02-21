// utils/codeUtils.js

/**
 * Detects if text contains code based on various patterns
 */
export const detectCode = (text) => {
  if (!text) return false;
  
  // Don't detect as code if it's just a single line of text
  const lines = text.split('\n');
  const isMultiLine = lines.length > 1;
  
  // If it's just one line and doesn't have code patterns, it's probably not code
  if (!isMultiLine) {
    // Check for obvious code patterns even in single line
    const singleLineCodePatterns = [
      /=>/, // Arrow functions
      /function\s*\(/, // Function calls
      /{.*}/, // Objects
      /\[.*\]/, // Arrays
      /if\s*\(/, // If statements
      /for\s*\(/, // For loops
      /while\s*\(/, // While loops
      /import\s+/, // Import statements
      /export\s+/, // Export statements
      /class\s+\w+/, // Class definitions
      /const\s+\w+\s*=/, // Const assignments
      /let\s+\w+\s*=/, // Let assignments
      /var\s+\w+\s*=/, // Var assignments
      /:\s*(string|number|boolean|any)\s*[;,]/, // TypeScript types
      /<\/?[a-z][^>]*>/, // HTML/JSX tags
    ];
    
    const hasCodePattern = singleLineCodePatterns.some(pattern => pattern.test(text));
    return hasCodePattern;
  }
  
  // Multi-line code patterns
  const codePatterns = [
    /function\s+\w+\s*\([^)]*\)\s*{/, // JavaScript functions
    /const\s+\w+\s*=\s*\([^)]*\)\s*=>/, // Arrow functions
    /class\s+\w+\s*{/, // Classes
    /if\s*\([^)]*\)\s*{/, // If statements
    /for\s*\([^;]*;[^;]*;[^)]*\)\s*{/, // For loops
    /while\s*\([^)]*\)\s*{/, // While loops
    /import\s+.*\s+from\s+['"]/, // Import statements
    /export\s+(default\s+)?(function|const|let|var|class)/, // Export statements
    /<\w+[^>]*>.*<\/\w+>/, // HTML tags (multi-line)
    /{[\s\S]*}/, // Contains braces with content
    /\[[\s\S]*\]/, // Contains brackets with content
    /\/\/.*/, // Comments
    /\/\*[\s\S]*\*\//, // Multi-line comments
    /\b(try|catch|finally|throw)\b/, // Try-catch
    /\b(public|private|protected|static)\b/, // Access modifiers
    /\b(int|string|boolean|float|double|char|void)\b/, // Common types
    /\b(console\.log|print|println|printf|System\.out)\b/, // Print statements
    /:\s*(string|number|boolean|any|void)\s*[;,]/, // TypeScript types
    /className=/, // React/JSX specific
    /onClick=\{/, // React event handlers
    /useState\(/, // React hooks
    /useEffect\(/, // React hooks
    /return\s*\(/, // React components
  ];
  
  // Check for code patterns
  const hasCodePatterns = codePatterns.some(pattern => pattern.test(text));
  
  // Special case for JSON-like structures
  const looksLikeJSON = (text.trim().startsWith('{') && text.trim().endsWith('}')) ||
                        (text.trim().startsWith('[') && text.trim().endsWith(']'));
  
  // Check for indentation (code usually has consistent indentation)
  const hasIndentation = lines.slice(1).some(line => /^\s+/.test(line));
  
  return (hasCodePatterns && hasIndentation) || looksLikeJSON;
};

/**
 * Detects programming language from code
 */
export const detectLanguage = (code) => {
  if (!code) return 'text';
  
  // Check for JSX/React first
  if (/className=|onClick=\{|<[A-Z][a-zA-Z]*\s*\/>|useState\(|useEffect\(|return\s*\(/.test(code)) {
    return 'jsx';
  }
  
  const patterns = {
    jsx: /className=|onClick=\{|<[A-Z][a-zA-Z]*\s*\/>|useState\(|useEffect\(/,
    javascript: /\b(const|let|var|function|=>|console\.log|document\.|window\.)\b/,
    typescript: /\b(interface|type|enum|namespace|as\s+const|:\s*(string|number|boolean|any|void|never|unknown))\b/,
    python: /\b(def\s+\w+\s*\(|print\s*\(|import\s+\w+|from\s+\w+\s+import|if\s+__name__\s*==\s*['"]__main__['"])\b/,
    java: /\b(public\s+class|private\s+|protected\s+|static\s+void\s+main|System\.out\.println)\b/,
    html: /<\/?[a-z][\s\S]*>/i,
    css: /[{;]\s*[a-z-]+:\s*[^;]+;|\.[a-z-]+\s*{|#[a-z-]+\s*{/,
    json: /^[\s]*[{\[][\s\S]*[}\]][\s]*$/,
    sql: /\b(SELECT|INSERT|UPDATE|DELETE|FROM|WHERE|JOIN|GROUP BY|ORDER BY)\b/i,
  };
  
  for (const [lang, pattern] of Object.entries(patterns)) {
    if (pattern.test(code)) {
      return lang;
    }
  }
  
  // Default to text if it doesn't look like code
  return 'text';
};

/**
 * Parses message content to extract code blocks and text
 */
export const parseMessageContent = (content) => {
  if (!content) return [];
  
  const parts = [];
  
  // First, check for explicit code blocks with ```
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  let match;
  let lastIndex = 0;
  
  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Add text before code block
    if (match.index > lastIndex) {
      const textBefore = content.substring(lastIndex, match.index);
      if (textBefore.trim()) {
        parts.push({ type: 'text', content: textBefore });
      }
    }
    
    // Add code block
    parts.push({
      type: 'code-block',
      language: match[1] || detectLanguage(match[2]),
      code: match[2].trim(),
    });
    
    lastIndex = match.index + match[0].length;
  }
  
  // If no explicit code blocks, check for inline code and potential code blocks
  if (lastIndex === 0) {
    // Parse inline code (code between single backticks)
    const inlineCodeRegex = /`([^`]+)`/g;
    let inlineMatch;
    
    while ((inlineMatch = inlineCodeRegex.exec(content)) !== null) {
      if (inlineMatch.index > lastIndex) {
        const textBefore = content.substring(lastIndex, inlineMatch.index);
        if (textBefore.trim()) {
          // Check if this text might contain code
          if (detectCode(textBefore) && textBefore.split('\n').length > 1) {
            // If it looks like multi-line code, treat as code block
            parts.push({
              type: 'code-block',
              language: detectLanguage(textBefore),
              code: textBefore.trim(),
            });
          } else {
            parts.push({ type: 'text', content: textBefore });
          }
        }
      }
      
      parts.push({
        type: 'inline-code',
        code: inlineMatch[1].trim(),
      });
      
      lastIndex = inlineMatch.index + inlineMatch[0].length;
    }
    
    // Handle remaining text
    if (lastIndex < content.length) {
      const remainingText = content.substring(lastIndex);
      if (remainingText.trim()) {
        // Check if remaining text looks like multi-line code
        if (detectCode(remainingText) && remainingText.split('\n').length > 1) {
          parts.push({
            type: 'code-block',
            language: detectLanguage(remainingText),
            code: remainingText.trim(),
          });
        } else {
          parts.push({ type: 'text', content: remainingText });
        }
      }
    }
  } else {
    // Add remaining text after last code block
    if (lastIndex < content.length) {
      const remainingText = content.substring(lastIndex);
      if (remainingText.trim()) {
        parts.push({ type: 'text', content: remainingText });
      }
    }
  }
  
  return parts;
};