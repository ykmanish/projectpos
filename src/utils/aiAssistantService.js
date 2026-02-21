// utils/aiAssistantService.js

class AIAssistantService {
  constructor() {
    this.baseUrl = '/api/ai/assistant';
    this.permissionsUrl = '/api/ai/permissions';
  }

  async processCommand(message, senderId, groupId, members, groupContext = {}) {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          senderId,
          groupId,
          members,
          groupContext // Include group context
        }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error processing AI command:', error);
      return {
        success: false,
        error: 'Failed to process AI command',
      };
    }
  }

  async checkPermissions(groupId) {
    try {
      const response = await fetch(`${this.permissionsUrl}?groupId=${groupId}`);
      const data = await response.json();
      return data.permissions;
    } catch (error) {
      console.error('Error checking AI permissions:', error);
      return null;
    }
  }

  extractMentionedUsers(message, members) {
    const mentionPattern = /@\[(.*?)\]\((.*?)\)/g;
    const mentions = [];
    let match;

    while ((match = mentionPattern.exec(message)) !== null) {
      const userName = match[1];
      const userId = match[2];
      
      const member = members.find(m => m.userId === userId);
      if (member) {
        mentions.push({
          userId,
          userName: member.userName,
          username: member.username,
        });
      }
    }

    return mentions;
  }

  parseAICommand(message) {
    const aiMentionPattern = /^@(?:krixa|Krixa)\s+(.+)$/;
    const match = message.match(aiMentionPattern);
    
    if (match) {
      return {
        isAICommand: true,
        command: match[1].trim(),
      };
    }
    
    return {
      isAICommand: false,
      command: null,
    };
  }

  parseModerationCommand(command) {
    // Warn command
    const warnPattern = /warn\s+(@\[.*?\]\(.*?\)|\w+)\s+(?:for\s+)?(.+)/i;
    
    // Mute command
    const mutePattern = /mute\s+(@\[.*?\]\(.*?\)|\w+)(?:\s+for\s+(\d+)\s+minutes?)?(?:\s+(?:because|for)\s+(.+))?/i;
    
    // Kick command
    const kickPattern = /kick\s+(@\[.*?\]\(.*?\)|\w+)(?:\s+(?:because|for)\s+(.+))?/i;
    
    // Ban command
    const banPattern = /ban\s+(@\[.*?\]\(.*?\)|\w+)(?:\s+(?:because|for)\s+(.+))?/i;
    
    // Delete command
    const deletePattern = /delete\s+(.+?)(?:\s+because\s+(.+))?/i;

    let match;

    match = command.match(warnPattern);
    if (match) {
      return {
        action: 'warn',
        target: match[1],
        reason: match[2] || 'No reason provided'
      };
    }

    match = command.match(mutePattern);
    if (match) {
      return {
        action: 'mute',
        target: match[1],
        duration: match[2] ? parseInt(match[2]) * 60 * 1000 : 30 * 60 * 1000,
        reason: match[3] || 'No reason provided'
      };
    }

    match = command.match(kickPattern);
    if (match) {
      return {
        action: 'kick',
        target: match[1],
        reason: match[2] || 'No reason provided'
      };
    }

    match = command.match(banPattern);
    if (match) {
      return {
        action: 'ban',
        target: match[1],
        reason: match[2] || 'No reason provided'
      };
    }

    match = command.match(deletePattern);
    if (match) {
      return {
        action: 'delete',
        target: match[1],
        reason: match[2] || 'No reason provided'
      };
    }

    return null;
  }
}

export default new AIAssistantService();