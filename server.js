const { createServer } = require('node:http');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);
  
  const io = new Server(httpServer, {
    cors: {
      origin: dev ? 'http://localhost:3000' : process.env.NEXT_PUBLIC_APP_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  const onlineUsers = new Map(); // userId -> { socketId, lastSeen }
  const userRooms = new Map(); // socketId -> { userId, roomId }
  const userSockets = new Map(); // userId -> socketId
  const groupMembers = new Map(); // roomId -> Set of userIds
  const undeliveredMessages = new Map(); // userId -> array of messages (for DMs)
  const undeliveredGroupMessages = new Map(); // roomId -> Map of userId -> array of messages

  io.on('connection', (socket) => {
    console.log('✅ New client connected:', socket.id);

    socket.on('user-online', ({ userId }) => {
      console.log(`👤 User ${userId} is now online`);
      
      const wasOnline = onlineUsers.has(userId);
      
      onlineUsers.set(userId, { 
        socketId: socket.id, 
        lastSeen: new Date().toISOString() 
      });
      userSockets.set(userId, socket.id);
      
      // If this user is coming online, deliver all pending messages
      if (!wasOnline) {
        console.log(`📦 Checking for undelivered messages for user ${userId}`);
        
        // Check for undelivered group messages
        if (undeliveredGroupMessages.size > 0) {
          // Find all groups this user is in with undelivered messages
          for (const [roomId, userMessages] of undeliveredGroupMessages.entries()) {
            if (userMessages.has(userId)) {
              const messages = userMessages.get(userId);
              console.log(`📦 Found ${messages.length} undelivered group messages for user ${userId} in room ${roomId}`);
              
              // Deliver each message
              messages.forEach(msg => {
                const deliveredAt = new Date().toISOString();
                const deliveredMessage = {
                  ...msg,
                  delivered: true,
                  deliveredAt: deliveredAt
                };
                
                // Send to the user
                socket.emit('receive-message', deliveredMessage);
              });
              
              // Clear delivered messages for this user in this group
              userMessages.delete(userId);
              if (userMessages.size === 0) {
                undeliveredGroupMessages.delete(roomId);
              }
            }
          }
        }
        
        // Notify all rooms that user came online (to update message statuses)
        const userRoomsList = Array.from(userRooms.values())
          .filter(room => room.userId === userId)
          .map(room => room.roomId);
        
        userRoomsList.forEach(roomId => {
          io.to(roomId).emit('user-came-online', {
            userId: userId,
            roomId: roomId,
            online: true,
            timestamp: new Date().toISOString()
          });
        });
      }
      
      // Broadcast status change
      io.emit('user-status-change', { 
        userId, 
        online: true,
        lastSeen: new Date().toISOString()
      });
    });

    socket.on('join-chat', ({ roomId, userId, groupMembers: members }) => {
      console.log(`👤 User ${userId} joining room ${roomId}`);
      
      const rooms = Array.from(socket.rooms).filter(r => r !== socket.id);
      rooms.forEach(room => socket.leave(room));
      
      socket.join(roomId);
      userRooms.set(socket.id, { userId, roomId });
      userSockets.set(userId, socket.id);
      
      if (members && members.length > 0) {
        const memberSet = new Set(members.map(m => m.userId || m));
        groupMembers.set(roomId, memberSet);
        console.log(`📋 Stored ${memberSet.size} members for group ${roomId}`);
      }
      
      onlineUsers.set(userId, { 
        socketId: socket.id, 
        lastSeen: new Date().toISOString() 
      });
      
      // Notify room that user joined
      socket.to(roomId).emit('user-online', { userId, online: true });
      
      // Check for undelivered group messages for this user in this room
      if (undeliveredGroupMessages.has(roomId)) {
        const userMessages = undeliveredGroupMessages.get(roomId);
        if (userMessages.has(userId)) {
          const messages = userMessages.get(userId);
          console.log(`📦 Delivering ${messages.length} group messages to user ${userId} in room ${roomId}`);
          
          messages.forEach(msg => {
            const deliveredAt = new Date().toISOString();
            const deliveredMessage = {
              ...msg,
              delivered: true,
              deliveredAt: deliveredAt
            };
            
            socket.emit('receive-message', deliveredMessage);
          });
          
          // Clear delivered messages
          userMessages.delete(userId);
          if (userMessages.size === 0) {
            undeliveredGroupMessages.delete(roomId);
          }
        }
      }
      
      socket.emit('joined-room', { roomId, success: true });
      
      // Trigger delivery status update for pending messages
      socket.to(roomId).emit('check-undelivered-messages', {
        roomId,
        userId,
        timestamp: new Date().toISOString()
      });
    });

    // Handle member joining group
    socket.on('member-joined', (data) => {
      console.log('👋 MEMBER JOINED GROUP');
      console.log('Room:', data.roomId);
      console.log('User ID:', data.userId);
      console.log('User Name:', data.userName);

      // Update group members in memory
      const currentMembers = groupMembers.get(data.roomId) || new Set();
      currentMembers.add(data.userId);
      groupMembers.set(data.roomId, currentMembers);

      // Broadcast to all members in the group except the new member
      socket.to(data.roomId).emit('member-joined', {
        userId: data.userId,
        userName: data.userName,
        username: data.username,
        avatar: data.avatar,
        timestamp: data.timestamp,
        roomId: data.roomId
      });

      // Also send to the new member themselves
      socket.emit('member-joined-confirmed', {
        roomId: data.roomId,
        timestamp: data.timestamp
      });

      console.log(`✅ Member join notification broadcast to room ${data.roomId}`);
    });

    // Handle group settings updates
    socket.on('group-settings-updated', (data) => {
      console.log('⚙️ Group settings updated:', data);
      console.log('Room:', data.roomId);
      console.log('Settings:', data.settings);
      console.log('Updated by:', data.updatedBy);
      
      // Broadcast to all members in the group except the sender
      socket.to(data.roomId).emit('group-settings-updated', {
        roomId: data.roomId,
        settings: data.settings,
        updatedBy: data.updatedBy,
        timestamp: data.timestamp
      });
      
      // Also send to the sender to confirm (optional)
      socket.emit('group-settings-updated-confirmed', {
        roomId: data.roomId,
        settings: data.settings,
        timestamp: data.timestamp
      });
      
      console.log(`✅ Group settings update broadcast to room ${data.roomId}`);
    });

    // ========== BILL EVENT HANDLERS ==========
    
    // Handle bill creation
    socket.on('bill-created', (data) => {
      console.log('💰 Bill created:', data.bill?.id || data.billId);
      console.log('Room:', data.roomId);
      console.log('Created by:', data.createdBy);
      
      // Broadcast to all members in the group including sender
      io.to(data.roomId).emit('bill-created', {
        bill: data.bill,
        roomId: data.roomId,
        createdBy: data.createdBy,
        timestamp: data.timestamp
      });
      
      console.log(`✅ Bill creation broadcast to room ${data.roomId}`);
    });

    // Handle bill updates
    socket.on('bill-updated', (data) => {
      console.log('💰 Bill updated:', data.bill?.id || data.billId);
      console.log('Room:', data.roomId);
      console.log('Updated by:', data.updatedBy);
      
      // Broadcast to all members in the group including sender
      io.to(data.roomId).emit('bill-updated', {
        bill: data.bill,
        roomId: data.roomId,
        updatedBy: data.updatedBy,
        timestamp: data.timestamp
      });
      
      console.log(`✅ Bill update broadcast to room ${data.roomId}`);
    });

    // Handle bill message updates (for chat UI)
    socket.on('bill-message-updated', (data) => {
      console.log('💰 Bill message updated:', data.billId);
      console.log('Room:', data.roomId);
      console.log('Updated by:', data.updatedBy);
      console.log('Bill Data:', data.billData);
      
      // Broadcast to all members in the group including sender
      io.to(data.roomId).emit('bill-message-updated', {
        billId: data.billId,
        roomId: data.roomId,
        billData: data.billData,
        updatedBy: data.updatedBy,
        timestamp: data.timestamp
      });
      
      console.log(`✅ Bill message update broadcast to room ${data.roomId}`);
    });

    // Handle bill cancellation
    socket.on('bill-cancelled', (data) => {
      console.log('🚫 Bill cancelled:', data.billId);
      console.log('Room:', data.roomId);
      console.log('Cancelled by:', data.cancelledBy);
      
      // Broadcast to all members in the group including sender
      io.to(data.roomId).emit('bill-cancelled', {
        billId: data.billId,
        roomId: data.roomId,
        cancelledBy: data.cancelledBy,
        timestamp: data.timestamp
      });
      
      console.log(`✅ Bill cancellation broadcast to room ${data.roomId}`);
    });

    // Handle direct bill updates (backup)
    socket.on('bill-direct-update', (data) => {
      console.log('💰 Direct bill update received:', data.billId);
      console.log('Room:', data.roomId);
      console.log('Updated by:', data.updatedBy);
      console.log('Bill data:', data.bill);
      
      // Broadcast to all members in the group including sender
      io.to(data.roomId).emit('bill-direct-update', {
        billId: data.billId,
        roomId: data.roomId,
        bill: data.bill,
        updatedBy: data.updatedBy,
        timestamp: data.timestamp
      });
      
      console.log(`✅ Direct bill update broadcast to room ${data.roomId}`);
    });

    socket.on('send-message', (message) => {
      console.log('📨 MESSAGE RECEIVED ON SERVER');
      console.log(`From: ${message.senderId}, Room: ${message.roomId}, Is Group: ${message.isGroupMessage}`);
      
      const deliveredAt = new Date().toISOString();
      
      if (message.isGroupMessage) {
        // Group message handling
        const members = groupMembers.get(message.roomId) || new Set();
        const onlineMembers = new Set();
        const offlineMembers = new Set();
        
        // Separate online and offline members
        members.forEach(memberId => {
          if (memberId !== message.senderId) {
            if (onlineUsers.has(memberId)) {
              onlineMembers.add(memberId);
            } else {
              offlineMembers.add(memberId);
            }
          }
        });
        
        console.log(`📊 Group members: ${onlineMembers.size} online, ${offlineMembers.size} offline`);
        
        const messageWithDelivery = {
          ...message,
          delivered: true,
          deliveredAt: deliveredAt
        };
        
        // Send to online members immediately
        onlineMembers.forEach(memberId => {
          const memberSocketId = userSockets.get(memberId);
          if (memberSocketId) {
            console.log(`  📤 Sending to online member ${memberId}`);
            io.to(memberSocketId).emit('receive-message', messageWithDelivery);
          }
        });
        
        // Store for offline members
        if (offlineMembers.size > 0) {
          console.log(`📦 Storing message for ${offlineMembers.size} offline members`);
          
          offlineMembers.forEach(memberId => {
            if (!undeliveredGroupMessages.has(message.roomId)) {
              undeliveredGroupMessages.set(message.roomId, new Map());
            }
            
            const roomMessages = undeliveredGroupMessages.get(message.roomId);
            if (!roomMessages.has(memberId)) {
              roomMessages.set(memberId, []);
            }
            
            roomMessages.get(memberId).push(messageWithDelivery);
          });
        }
        
        // Send to the room for sender's UI
        io.to(message.roomId).emit('receive-message', messageWithDelivery);
        
        // Send delivery confirmation to sender
        const senderSocketId = userSockets.get(message.senderId);
        if (senderSocketId) {
          io.to(senderSocketId).emit('message-delivered', {
            roomId: message.roomId,
            timestamp: message.timestamp,
            senderId: message.senderId,
            deliveredAt: deliveredAt,
            delivered: true,
            isGroupMessage: true,
            deliveredTo: Array.from(onlineMembers)
          });
        }
        
        console.log('✅ Group message processed');
      } else {
        // Direct message handling
        const receiverOnline = onlineUsers.has(message.receiverId);
        
        const messageWithDelivery = {
          ...message,
          delivered: receiverOnline,
          deliveredAt: receiverOnline ? deliveredAt : null,
          read: false
        };
        
        const receiverSocketId = userSockets.get(message.receiverId);
        
        if (receiverSocketId && receiverOnline) {
          console.log(`📤 Sending message to online user: ${message.receiverId}`);
          io.to(receiverSocketId).emit('receive-message', messageWithDelivery);
          
          const senderSocketId = userSockets.get(message.senderId);
          if (senderSocketId) {
            io.to(senderSocketId).emit('message-delivered', {
              roomId: message.roomId,
              timestamp: message.timestamp,
              senderId: message.senderId,
              deliveredAt: deliveredAt,
              delivered: true
            });
          }
        } else {
          console.log(`📦 Storing message for offline user: ${message.receiverId}`);
          if (!undeliveredMessages.has(message.receiverId)) {
            undeliveredMessages.set(message.receiverId, []);
          }
          undeliveredMessages.get(message.receiverId).push(messageWithDelivery);
          
          io.to(message.roomId).emit('receive-message', messageWithDelivery);
        }
      }
    });

    socket.on('mark-as-read', (data) => {
      console.log('✓✓ Marking messages as read:', data);
      const readData = {
        ...data,
        readAt: new Date().toISOString()
      };
      
      // Broadcast to all in room that messages were read
      io.to(data.roomId).emit('message-read', readData);
      
      if (data.isGroupMessage) {
        // For group messages, notify the sender specifically
        const members = groupMembers.get(data.roomId);
        if (members) {
          members.forEach(memberId => {
            if (memberId !== data.userId) {
              const memberSocketId = userSockets.get(memberId);
              if (memberSocketId) {
                io.to(memberSocketId).emit('message-read', readData);
              }
            }
          });
        }
      } else {
        // For direct messages
        const [userId1, userId2] = data.roomId.split('-');
        const senderId = userId1 === data.userId ? userId2 : userId1;
        const senderSocketId = userSockets.get(senderId);
        
        if (senderSocketId) {
          io.to(senderSocketId).emit('message-read', readData);
        }
      }
    });

    socket.on('get-undelivered-status', ({ roomId, userId, isGroupMessage }) => {
      if (isGroupMessage) {
        if (undeliveredGroupMessages.has(roomId)) {
          const userMessages = undeliveredGroupMessages.get(roomId);
          if (userMessages.has(userId)) {
            const messages = userMessages.get(userId);
            socket.emit('undelivered-messages-status', {
              roomId,
              count: messages.length,
              messages: messages.map(m => ({
                timestamp: m.timestamp,
                senderId: m.senderId
              }))
            });
          }
        }
      } else {
        if (undeliveredMessages.has(userId)) {
          const messages = undeliveredMessages.get(userId);
          const roomMessages = messages.filter(msg => msg.roomId === roomId);
          
          if (roomMessages.length > 0) {
            socket.emit('undelivered-messages-status', {
              roomId,
              count: roomMessages.length,
              messages: roomMessages.map(m => ({
                timestamp: m.timestamp,
                senderId: m.senderId
              }))
            });
          }
        }
      }
    });

    socket.on('edit-message', (data) => {
      console.log('✏️ Editing message:', data);
      const updatedData = {
        ...data,
        edited: true,
        editedAt: new Date().toISOString()
      };
      
      io.to(data.roomId).emit('message-updated', updatedData);
    });

    socket.on('delete-message', (data) => {
      console.log('🗑️ Deleting message:', data);
      
      const deletedMessageData = {
        ...data,
        deletedAt: new Date().toISOString()
      };
      
      io.to(data.roomId).emit('message-deleted', deletedMessageData);
    });

    socket.on('react-to-message', (data) => {
      console.log('😊 React to message:', data);
      io.to(data.roomId).emit('message-reaction', data);
    });

    socket.on('typing', ({ roomId, userId, isTyping }) => {
      socket.to(roomId).emit('user-typing', { userId, isTyping });
    });

    socket.on('get-user-status', ({ userId }, callback) => {
      const userStatus = onlineUsers.get(userId);
      if (userStatus) {
        callback({ 
          online: true, 
          lastSeen: userStatus.lastSeen 
        });
      } else {
        callback({ 
          online: false, 
          lastSeen: null 
        });
      }
    });

    socket.on('leave-chat', ({ roomId, userId }) => {
      console.log(`User ${userId} leaving room ${roomId}`);
      socket.leave(roomId);
      userRooms.delete(socket.id);
    });

    socket.on('disconnect', () => {
      console.log('❌ Client disconnected:', socket.id);
      
      const userInfo = userRooms.get(socket.id);
      if (userInfo) {
        const { userId, roomId } = userInfo;
        const lastSeen = new Date().toISOString();
        
        onlineUsers.delete(userId);
        userSockets.delete(userId);
        
        // Notify room that user went offline
        socket.to(roomId).emit('user-online', { userId, online: false, lastSeen });
        io.emit('user-status-change', { userId, online: false, lastSeen });
        socket.to(roomId).emit('user-typing', { userId, isTyping: false });
        
        userRooms.delete(socket.id);
      }
    });
  });

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});