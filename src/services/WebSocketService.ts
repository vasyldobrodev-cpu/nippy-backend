import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: any;
}

interface SocketMessage {
  type: string;
  conversationId?: string;
  content?: string;
  recipientId?: string;
  messageId?: string;
  data?: any;
}

class WebSocketService {
  private io: SocketIOServer;
  private connectedUsers: Map<string, AuthenticatedSocket> = new Map();

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    this.initializeSocketHandlers();
  }

  private initializeSocketHandlers(): void {
    this.io.use(this.authenticateSocket.bind(this));

    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`🔌 User ${socket.userId} connected`);
      
      // Store user connection
      if (socket.userId) {
        this.connectedUsers.set(socket.userId, socket);
      }

      // Join user to their personal room
      if (socket.userId) {
        socket.join(`user:${socket.userId}`);
      }

      // Handle different socket events
      this.handleMessageEvents(socket);
      this.handleConversationEvents(socket);
      this.handleTypingEvents(socket);
      this.handleDisconnection(socket);
    });
  }

  private async authenticateSocket(socket: AuthenticatedSocket, next: (err?: Error) => void): Promise<void> {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
      socket.userId = decoded.userId;
      socket.user = decoded;
      
      next();
    } catch (error) {
      console.error('Socket authentication failed:', error);
      next(new Error('Invalid authentication token'));
    }
  }

  private handleMessageEvents(socket: AuthenticatedSocket): void {
    socket.on('send_message', async (data: SocketMessage) => {
      try {
        console.log(`📨 Message from ${socket.userId}:`, data);
        
        // Emit to recipient if they're online
        if (data.recipientId) {
          const recipientSocket = this.connectedUsers.get(data.recipientId);
          if (recipientSocket) {
            recipientSocket.emit('new_message', {
              ...data,
              senderId: socket.userId,
              timestamp: new Date().toISOString()
            });
          }
        }

        // Emit to conversation room
        if (data.conversationId) {
          socket.to(`conversation:${data.conversationId}`).emit('new_message', {
            ...data,
            senderId: socket.userId,
            timestamp: new Date().toISOString()
          });
        }

        // Confirm message sent
        socket.emit('message_sent', {
          success: true,
          messageId: data.messageId,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('Error handling send_message:', error);
        socket.emit('message_error', { error: 'Failed to send message' });
      }
    });

    socket.on('mark_as_read', async (data: { messageId: string, conversationId: string }) => {
      try {
        // Emit to other participants that message was read
        socket.to(`conversation:${data.conversationId}`).emit('message_read', {
          messageId: data.messageId,
          readBy: socket.userId,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    });
  }

  private handleConversationEvents(socket: AuthenticatedSocket): void {
    socket.on('join_conversation', (data: { conversationId: string }) => {
      socket.join(`conversation:${data.conversationId}`);
      console.log(`👥 User ${socket.userId} joined conversation ${data.conversationId}`);
    });

    socket.on('leave_conversation', (data: { conversationId: string }) => {
      socket.leave(`conversation:${data.conversationId}`);
      console.log(`👋 User ${socket.userId} left conversation ${data.conversationId}`);
    });

    socket.on('freelancer_hired', (data: { conversationId: string }) => {
      socket.to(`conversation:${data.conversationId}`).emit('status_update', {
        type: 'hired',
        conversationId: data.conversationId,
        timestamp: new Date().toISOString()
      });
    });

    socket.on('project_completed', (data: { conversationId: string, projectData?: any }) => {
      socket.to(`conversation:${data.conversationId}`).emit('status_update', {
        type: 'project_completed',
        conversationId: data.conversationId,
        projectData: data.projectData,
        timestamp: new Date().toISOString()
      });
    });

    socket.on('payment_completed', (data: { conversationId: string, paymentData?: any }) => {
      socket.to(`conversation:${data.conversationId}`).emit('status_update', {
        type: 'payment_completed',
        conversationId: data.conversationId,
        paymentData: data.paymentData,
        timestamp: new Date().toISOString()
      });
    });

    socket.on('revision_requested', (data: { conversationId: string, revisionData?: any }) => {
      socket.to(`conversation:${data.conversationId}`).emit('status_update', {
        type: 'revision_requested',
        conversationId: data.conversationId,
        revisionData: data.revisionData,
        timestamp: new Date().toISOString()
      });
    });
  }

  private handleTypingEvents(socket: AuthenticatedSocket): void {
    socket.on('typing_start', (data: { conversationId: string }) => {
      socket.to(`conversation:${data.conversationId}`).emit('user_typing', {
        userId: socket.userId,
        conversationId: data.conversationId,
        isTyping: true
      });
    });

    socket.on('typing_stop', (data: { conversationId: string }) => {
      socket.to(`conversation:${data.conversationId}`).emit('user_typing', {
        userId: socket.userId,
        conversationId: data.conversationId,
        isTyping: false
      });
    });
  }

  private handleDisconnection(socket: AuthenticatedSocket): void {
    socket.on('disconnect', () => {
      console.log(`🔌 User ${socket.userId} disconnected`);
      if (socket.userId) {
        this.connectedUsers.delete(socket.userId);
      }
    });
  }

  // Public methods for sending notifications
  public sendNotification(userId: string, notification: any): void {
    const userSocket = this.connectedUsers.get(userId);
    if (userSocket) {
      userSocket.emit('notification', notification);
    }
  }

  public sendToConversation(conversationId: string, event: string, data: any): void {
    this.io.to(`conversation:${conversationId}`).emit(event, data);
  }

  public sendToUser(userId: string, event: string, data: any): void {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  public isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  public getOnlineUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }
}

export default WebSocketService;
