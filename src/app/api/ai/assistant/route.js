// app/api/ai/assistant/route.js
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import clientPromise from '@/lib/mongodb';

export async function POST(request) {
  try {
    const { message, senderId, groupId, members, groupContext } = await request.json();

    if (!message || !groupId) {
      return NextResponse.json(
        { success: false, error: 'Message and groupId required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not set');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db('positivity');
    const groups = db.collection('groups');
    const permissions = db.collection('ai_permissions');

    // Fetch actual group data from database
    const group = await groups.findOne({ groupId });
    
    // Fetch AI permissions
    const aiPermissions = await permissions.findOne({ groupId });

    // Parse the command
    const { command, action, target, time, task } = parseCommand(message);

    let response = '';
    let actionTaken = null;

    // Handle different types of queries
    if (message.toLowerCase().includes('group description') || 
        message.toLowerCase().includes('about this group') ||
        message.toLowerCase().includes('group info')) {
      
      // Provide group information
      response = formatGroupInfo(group, groupContext, aiPermissions);
      
    } else {
      // Handle other commands based on action
      switch (action) {
        case 'remind':
          const reminders = db.collection('reminders');
          const reminderResult = await handleReminder(command, target, time, senderId, groupId, members, reminders);
          response = reminderResult.message;
          actionTaken = reminderResult;
          break;

        case 'task':
          const tasks = db.collection('tasks');
          const taskResult = await handleTask(command, target, task, senderId, groupId, members, tasks);
          response = taskResult.message;
          actionTaken = taskResult;
          break;

        case 'summarize':
          const messages = db.collection('messages');
          const summaryResult = await handleSummarize(command, groupId, messages);
          response = summaryResult.message;
          actionTaken = summaryResult;
          break;

        default:
          // General AI response with group context
          response = await generateAIResponse(message, members, group, aiPermissions);
          break;
      }
    }

    return NextResponse.json({
      success: true,
      response,
      actionTaken,
    });

  } catch (error) {
    console.error('❌ AI Assistant error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process AI command',
        response: "Sorry, I couldn't process that command. Please try again."
      },
      { status: 500 }
    );
  }
}

function parseCommand(message) {
  const command = message.toLowerCase();
  
  const remindPatterns = [
    /remind\s+(@\[.*?\]\(.*?\)|\w+)\s+to\s+(.+?)\s+in\s+(\d+)\s+(minutes?|hours?|days?)/i,
    /remind\s+(@\[.*?\]\(.*?\)|\w+)\s+to\s+(.+?)\s+at\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i,
    /remind\s+(@\[.*?\]\(.*?\)|\w+)\s+to\s+(.+?)\s+tomorrow/i,
  ];

  const taskPatterns = [
    /(?:create|add)\s+task\s+for\s+(@\[.*?\]\(.*?\)|\w+)\s*:\s*(.+)/i,
    /assign\s+(@\[.*?\]\(.*?\)|\w+)\s+to\s+(.+)/i,
  ];

  const summarizePatterns = [
    /summarize\s+(?:the\s+)?(?:chat|conversation|messages)/i,
    /what\s+(?:was|were)\s+(?:the\s+)?(?:main\s+)?points/i,
  ];

  for (const pattern of remindPatterns) {
    const match = command.match(pattern);
    if (match) {
      return {
        action: 'remind',
        target: match[1],
        task: match[2],
        time: match[3] ? `${match[3]} ${match[4]}` : null,
        command: message,
      };
    }
  }

  for (const pattern of taskPatterns) {
    const match = command.match(pattern);
    if (match) {
      return {
        action: 'task',
        target: match[1],
        task: match[2],
        command: message,
      };
    }
  }

  for (const pattern of summarizePatterns) {
    const match = command.match(pattern);
    if (match) {
      return {
        action: 'summarize',
        command: message,
      };
    }
  }

  return {
    action: 'general',
    command: message,
  };
}

function formatGroupInfo(group, groupContext, permissions) {
  if (!group) {
    return "I don't have access to the group information at the moment. Please make sure I'm properly configured in this group.";
  }

  const memberCount = group.members?.length || 0;
  const adminCount = group.members?.filter(m => m.role === 'admin').length || 0;
  const createdAt = group.createdAt ? new Date(group.createdAt).toLocaleDateString() : 'Unknown';
  
  let info = `📋 **Group Information**\n\n`;
  info += `**Name:** ${group.groupName || group.name || 'Unnamed Group'}\n`;
  
  if (group.description) {
    info += `**Description:** ${group.description}\n`;
  }
  
  info += `**Members:** ${memberCount} (${adminCount} admins)\n`;
  info += `**Created:** ${createdAt}\n`;
  
  if (group.createdBy) {
    const creator = group.members?.find(m => m.userId === group.createdBy);
    info += `**Created by:** ${creator?.userName || 'Unknown'}\n`;
  }
  
  if (group.settings) {
    info += `\n**Settings:**\n`;
    if (group.settings.onlyAdminsCanMessage) {
      info += `• 🔒 Only admins can message\n`;
    }
    if (group.settings.slowMode?.enabled) {
      info += `• ❄️ Slow mode: ${group.settings.slowMode.cooldown}s between messages\n`;
    }
  }
  
  if (permissions) {
    const activePermissions = Object.entries(permissions)
      .filter(([key, value]) => value === true && key.startsWith('can'))
      .map(([key]) => key.replace('can', ''));
    
    if (activePermissions.length > 0) {
      info += `\n**My Permissions:**\n`;
      info += `• ${activePermissions.join(', ')}\n`;
    }
  }
  
  return info;
}

async function handleReminder(command, target, time, senderId, groupId, members, remindersCollection) {
  let targetUserId = target;
  let targetUserName = target;

  const mentionMatch = target.match(/@\[(.*?)\]\((.*?)\)/);
  if (mentionMatch) {
    targetUserName = mentionMatch[1];
    targetUserId = mentionMatch[2];
  } else {
    const member = members.find(m => 
      m.userName?.toLowerCase().includes(target.toLowerCase()) ||
      m.username?.toLowerCase().includes(target.toLowerCase())
    );
    if (member) {
      targetUserId = member.userId;
      targetUserName = member.userName;
    }
  }

  let reminderTime = new Date();
  if (time) {
    if (time.includes('minute')) {
      const minutes = parseInt(time.split(' ')[0]);
      reminderTime.setMinutes(reminderTime.getMinutes() + minutes);
    } else if (time.includes('hour')) {
      const hours = parseInt(time.split(' ')[0]);
      reminderTime.setHours(reminderTime.getHours() + hours);
    } else if (time.includes('day')) {
      const days = parseInt(time.split(' ')[0]);
      reminderTime.setDate(reminderTime.getDate() + days);
    }
  } else {
    reminderTime.setMinutes(reminderTime.getMinutes() + 10);
  }

  const reminder = {
    id: `reminder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    groupId,
    targetUserId,
    targetUserName,
    createdBy: senderId,
    task: command,
    reminderTime: reminderTime.toISOString(),
    createdAt: new Date().toISOString(),
    status: 'pending',
  };

  await remindersCollection.insertOne(reminder);

  const timeStr = time ? `in ${time}` : 'in 10 minutes';
  return {
    message: `✅ I'll remind ${targetUserName} to "${command}" ${timeStr}`,
    reminder,
  };
}

async function handleTask(command, target, task, senderId, groupId, members, tasksCollection) {
  let targetUserId = target;
  let targetUserName = target;

  const mentionMatch = target.match(/@\[(.*?)\]\((.*?)\)/);
  if (mentionMatch) {
    targetUserName = mentionMatch[1];
    targetUserId = mentionMatch[2];
  }

  const newTask = {
    id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    groupId,
    assignedTo: targetUserId,
    assignedToName: targetUserName,
    assignedBy: senderId,
    task: task || command,
    createdAt: new Date().toISOString(),
    status: 'pending',
    completedAt: null,
  };

  await tasksCollection.insertOne(newTask);

  return {
    message: `✅ Task created for ${targetUserName}: "${task || command}"`,
    task: newTask,
  };
}

async function handleSummarize(command, groupId, messagesCollection) {
  const recentMessages = await messagesCollection
    .find({ 
      roomId: groupId,
      isGroupMessage: true 
    })
    .sort({ timestamp: -1 })
    .limit(50)
    .toArray();

  if (recentMessages.length === 0) {
    return {
      message: "No messages to summarize yet.",
    };
  }

  const messageText = recentMessages
    .reverse()
    .map(m => `${m.senderName || 'Someone'}: ${m.content || '[media]'}`)
    .join('\n');

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

  const prompt = `Summarize this group chat conversation in a friendly way, highlighting the main topics discussed and any decisions made:\n\n${messageText}`;

  const result = await model.generateContent(prompt);
  const summary = result.response.text();

  return {
    message: `📊 **Chat Summary**\n\n${summary}`,
    summary,
  };
}

async function generateAIResponse(message, members, group, permissions) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

  const memberNames = members.map(m => m.userName).join(', ');
  const groupName = group?.groupName || group?.name || 'this group';
  const groupDesc = group?.description || 'No description available';
  
  // Build context about what the AI can do
  let capabilities = [];
  if (permissions) {
    if (permissions.canWarn) capabilities.push('warn users');
    if (permissions.canMute) capabilities.push('mute users');
    if (permissions.canKick) capabilities.push('remove users');
    if (permissions.canBan) capabilities.push('ban users');
    if (permissions.canDeleteMessages) capabilities.push('delete messages');
    if (permissions.canCreateContent) capabilities.push('create polls and tasks');
  }
  
  const capabilitiesText = capabilities.length > 0 
    ? `I have permissions to: ${capabilities.join(', ')}. ` 
    : 'I have basic permissions to answer questions and provide information. ';

  const prompt = `You are Krixa, a helpful AI assistant in a group chat called "${groupName}".

Group Information:
- Name: ${groupName}
- Description: ${groupDesc}
- Members: ${memberNames}

${capabilitiesText}

The user said: "${message}"

Provide a helpful, friendly response. If they ask about group information, use the details provided above. Keep it concise and natural.`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}