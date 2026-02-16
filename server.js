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

  const onlineUsers = new Map();
  const userRooms = new Map();
  const userSockets = new Map();
  const groupMembers = new Map();

  io.on('connection', (socket) => {
    console.log('✅ New client connected:', socket.id);
    console.log('📊 Total connected clients:', io.sockets.sockets.size);

    socket.on('user-online', ({ userId }) => {
      console.log(`👤 User ${userId} is now online`);
      onlineUsers.set(userId, { 
        socketId: socket.id, 
        lastSeen: new Date().toISOString() 
      });
      userSockets.set(userId, socket.id);
      
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
        groupMembers.set(roomId, new Set(members.map(m => m.userId || m)));
        console.log(`📋 Stored ${members.length} members for group ${roomId}`);
      }
      
      onlineUsers.set(userId, { 
        socketId: socket.id, 
        lastSeen: new Date().toISOString() 
      });
      
      socket.to(roomId).emit('user-online', { userId, online: true });
      socket.emit('joined-room', { roomId, success: true });
      
      socket.to(roomId).emit('message-delivered', {
        roomId,
        userId,
        deliveredAt: new Date().toISOString()
      });
      
      console.log(`✅ User ${userId} successfully joined room ${roomId}`);
    });

    socket.on('send-message', (message) => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📨 MESSAGE RECEIVED ON SERVER');
      console.log('From:', message.senderId);
      console.log('To:', message.receiverId);
      console.log('Room:', message.roomId);
      console.log('Content:', message.content);
      console.log('Is Group:', message.isGroupMessage);
      console.log('DeliveredAt from client:', message.deliveredAt);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      if (onlineUsers.has(message.senderId)) {
        onlineUsers.get(message.senderId).lastSeen = new Date().toISOString();
      }
      
      const deliveredAt = message.deliveredAt || new Date().toISOString();
      
      if (message.isGroupMessage) {
        console.log('📤 Broadcasting group message to room:', message.roomId);
        
        const messageWithDelivery = {
          ...message,
          delivered: true,
          deliveredAt: deliveredAt
        };
        
        io.to(message.roomId).emit('receive-message', messageWithDelivery);
        
        const members = groupMembers.get(message.roomId);
        if (members) {
          console.log(`📤 Sending to ${members.size} group members individually`);
          members.forEach(memberId => {
            const memberSocketId = userSockets.get(memberId);
            if (memberSocketId) {
              console.log(`  ↳ Sending to member ${memberId} (socket: ${memberSocketId})`);
              io.to(memberSocketId).emit('receive-message', messageWithDelivery);
            }
          });
        }
        
        const senderSocketId = userSockets.get(message.senderId);
        if (senderSocketId) {
          console.log(`📤 Sending to sender ${message.senderId} (socket: ${senderSocketId})`);
          io.to(senderSocketId).emit('receive-message', messageWithDelivery);
        }
        
        const deliveredData = {
          roomId: message.roomId,
          timestamp: message.timestamp,
          senderId: message.senderId,
          deliveredAt: deliveredAt,
          isGroupMessage: true
        };
        io.to(message.roomId).emit('message-delivered', deliveredData);
        
        if (members) {
          members.forEach(memberId => {
            const memberSocketId = userSockets.get(memberId);
            if (memberSocketId) {
              io.to(memberSocketId).emit('message-delivered', deliveredData);
            }
          });
        }
        
        console.log('✅ Group message broadcast complete with deliveredAt:', deliveredAt);
      } else {
        const messageWithDelivery = {
          ...message,
          delivered: true,
          deliveredAt: deliveredAt
        };
        
        console.log('📤 Broadcasting direct message with deliveredAt:', deliveredAt);
        
        io.to(message.roomId).emit('receive-message', messageWithDelivery);
        
        const receiverSocketId = userSockets.get(message.receiverId);
        if (receiverSocketId) {
          console.log(`📤 Sending message directly to receiver socket: ${receiverSocketId}`);
          io.to(receiverSocketId).emit('receive-message', messageWithDelivery);
        }
        
        const senderSocketId = userSockets.get(message.senderId);
        if (senderSocketId) {
          console.log(`📤 Sending message directly to sender socket: ${senderSocketId}`);
          io.to(senderSocketId).emit('receive-message', messageWithDelivery);
        }
        
        if (onlineUsers.has(message.receiverId)) {
          const deliveredData = {
            roomId: message.roomId,
            timestamp: message.timestamp,
            deliveredAt: deliveredAt
          };
          io.to(message.roomId).emit('message-delivered', deliveredData);
          
          if (receiverSocketId) io.to(receiverSocketId).emit('message-delivered', deliveredData);
          if (senderSocketId) io.to(senderSocketId).emit('message-delivered', deliveredData);
        }
        
        console.log('✅ Direct message broadcast complete with deliveredAt:', deliveredAt);
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
      
      if (data.isGroupMessage) {
        const members = groupMembers.get(data.roomId);
        if (members) {
          members.forEach(memberId => {
            const memberSocketId = userSockets.get(memberId);
            if (memberSocketId) {
              io.to(memberSocketId).emit('message-updated', updatedData);
            }
          });
        }
      } else {
        const [userId1, userId2] = data.roomId.split('-');
        const socket1 = userSockets.get(userId1);
        const socket2 = userSockets.get(userId2);
        if (socket1) io.to(socket1).emit('message-updated', updatedData);
        if (socket2) io.to(socket2).emit('message-updated', updatedData);
      }
    });

    socket.on('delete-message', (data) => {
      console.log('🗑️ Deleting message:', data);
      
      const deletedMessageData = {
        ...data,
        deletedAt: new Date().toISOString()
      };
      
      io.to(data.roomId).emit('message-deleted', deletedMessageData);
      
      if (data.isGroupMessage) {
        const members = groupMembers.get(data.roomId);
        if (members) {
          members.forEach(memberId => {
            const memberSocketId = userSockets.get(memberId);
            if (memberSocketId) {
              io.to(memberSocketId).emit('message-deleted', deletedMessageData);
            }
          });
        }
      } else {
        const [userId1, userId2] = data.roomId.split('-');
        const socket1 = userSockets.get(userId1);
        const socket2 = userSockets.get(userId2);
        if (socket1) io.to(socket1).emit('message-deleted', deletedMessageData);
        if (socket2) io.to(socket2).emit('message-deleted', deletedMessageData);
      }
    });

    socket.on('react-to-message', (data) => {
      console.log('😊 React to message:', data);
      
      io.to(data.roomId).emit('message-reaction', data);
      
      if (data.isGroupMessage) {
        const members = groupMembers.get(data.roomId);
        if (members) {
          members.forEach(memberId => {
            const memberSocketId = userSockets.get(memberId);
            if (memberSocketId) {
              io.to(memberSocketId).emit('message-reaction', data);
            }
          });
        }
      } else {
        const [userId1, userId2] = data.roomId.split('-');
        const socket1 = userSockets.get(userId1);
        const socket2 = userSockets.get(userId2);
        if (socket1) io.to(socket1).emit('message-reaction', data);
        if (socket2) io.to(socket2).emit('message-reaction', data);
      }
    });

    socket.on('mark-as-read', (data) => {
      console.log('✓✓ Marking messages as read:', data);
      const readData = {
        ...data,
        readAt: new Date().toISOString()
      };
      
      if (data.isGroupMessage) {
        io.to(data.roomId).emit('message-read', readData);
        
        const members = groupMembers.get(data.roomId);
        if (members) {
          members.forEach(memberId => {
            const memberSocketId = userSockets.get(memberId);
            if (memberSocketId) {
              io.to(memberSocketId).emit('message-read', readData);
            }
          });
        }
        
        console.log(`✓✓ Group message read by ${data.userId} in room ${data.roomId}`);
      } else {
        socket.to(data.roomId).emit('message-read', readData);
        
        const [userId1, userId2] = data.roomId.split('-');
        const socket1 = userSockets.get(userId1);
        const socket2 = userSockets.get(userId2);
        if (socket1) io.to(socket1).emit('message-read', readData);
        if (socket2) io.to(socket2).emit('message-read', readData);
      }
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
    });

    socket.on('disconnect', () => {
      console.log('❌ Client disconnected:', socket.id);
      
      const userInfo = userRooms.get(socket.id);
      if (userInfo) {
        const { userId, roomId } = userInfo;
        const lastSeen = new Date().toISOString();
        
        onlineUsers.delete(userId);
        userSockets.delete(userId);
        
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
      console.log('> Socket.io server is running');
    });
});
