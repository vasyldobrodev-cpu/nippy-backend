import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Conversation, ConversationStatus } from '../entities/Conversation';
import { Message, MessageType, MessageStatus } from '../entities/Message';
import { User } from '../entities/User';

export class ConversationService {
  private conversationRepository: Repository<Conversation>;
  private messageRepository: Repository<Message>;
  private userRepository: Repository<User>;

  constructor() {
    this.conversationRepository = AppDataSource.getRepository(Conversation);
    this.messageRepository = AppDataSource.getRepository(Message);
    this.userRepository = AppDataSource.getRepository(User);
  }

  async createConversation(clientId: string, freelancerId: string, jobId?: string, projectTitle?: string): Promise<Conversation> {
    // Check if conversation already exists
    const existingConversation = await this.conversationRepository.findOne({
      where: {
        clientId,
        freelancerId,
        ...(jobId && { jobId })
      }
    });

    if (existingConversation) {
      return existingConversation;
    }

    const conversation = this.conversationRepository.create({
      clientId,
      freelancerId,
      jobId,
      projectTitle,
      status: ConversationStatus.NOT_HIRED
    });

    return await this.conversationRepository.save(conversation);
  }

  async getConversationsByUserId(userId: string): Promise<Conversation[]> {
    const conversations = await this.conversationRepository.find({
      where: [
        { clientId: userId },
        { freelancerId: userId }
      ],
      relations: ['client', 'freelancer', 'job'],
      order: { lastMessageAt: 'DESC', createdAt: 'DESC' }
    });

    // Add unread counts and format for frontend
    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await this.getUnreadMessageCount(conv.id, userId);
        const lastMessage = await this.getLastMessage(conv.id);
        
        return {
          ...conv,
          unreadCount,
          lastMessage: lastMessage?.content || '',
          unread: unreadCount > 0,
          timestamp: this.formatTimestamp(conv.lastMessageAt || conv.createdAt),
          // Determine the other participant
          otherParticipant: conv.clientId === userId ? conv.freelancer : conv.client
        };
      })
    );

    return conversationsWithDetails;
  }

  async getConversationById(conversationId: string, userId: string): Promise<Conversation | null> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
      relations: ['client', 'freelancer', 'job']
    });

    if (!conversation) return null;

    // Check if user is part of this conversation
    if (conversation.clientId !== userId && conversation.freelancerId !== userId) {
      throw new Error('Unauthorized access to conversation');
    }

    return conversation;
  }

  async updateConversationStatus(conversationId: string, status: ConversationStatus, userId: string): Promise<Conversation> {
    const conversation = await this.getConversationById(conversationId, userId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    conversation.status = status;
    return await this.conversationRepository.save(conversation);
  }

  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    type: MessageType = MessageType.TEXT,
    fileData?: any
  ): Promise<Message> {
    const conversation = await this.getConversationById(conversationId, senderId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Determine recipient
    const recipientId = conversation.clientId === senderId ? conversation.freelancerId : conversation.clientId;

    const message = this.messageRepository.create({
      conversationId,
      senderId,
      recipientId,
      content,
      type,
      fileData,
      status: MessageStatus.SENT
    });

    const savedMessage = await this.messageRepository.save(message);

    // Update conversation with last message info
    await this.conversationRepository.update(conversationId, {
      lastMessage: type === MessageType.TEXT ? content : 'File shared',
      lastMessageAt: new Date(),
      clientUnread: conversation.clientId !== senderId,
      freelancerUnread: conversation.freelancerId !== senderId
    });

    // Load the complete message with sender info
    return await this.messageRepository.findOne({
      where: { id: savedMessage.id },
      relations: ['sender', 'recipient']
    }) as Message;
  }

  async getConversationMessages(conversationId: string, userId: string, page: number = 1, limit: number = 50): Promise<Message[]> {
    const conversation = await this.getConversationById(conversationId, userId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const messages = await this.messageRepository.find({
      where: { conversationId },
      relations: ['sender', 'recipient'],
      order: { createdAt: 'ASC' },
      skip: (page - 1) * limit,
      take: limit
    });

    return messages;
  }

  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    await this.messageRepository.update(
      {
        conversationId,
        recipientId: userId,
        status: MessageStatus.SENT
      },
      {
        status: MessageStatus.READ,
        readAt: new Date()
      }
    );

    // Update conversation unread flags
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId }
    });

    if (conversation) {
      const updateData: any = {};
      if (conversation.clientId === userId) {
        updateData.clientUnread = false;
      } else {
        updateData.freelancerUnread = false;
      }
      
      await this.conversationRepository.update(conversationId, updateData);
    }
  }

  async getUnreadMessageCount(conversationId: string, userId: string): Promise<number> {
    return await this.messageRepository.count({
      where: {
        conversationId,
        recipientId: userId,
        status: MessageStatus.SENT
      }
    });
  }

  async deleteConversation(conversationId: string, userId: string): Promise<void> {
    const conversation = await this.getConversationById(conversationId, userId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Delete all messages first
    await this.messageRepository.delete({ conversationId });
    
    // Delete conversation
    await this.conversationRepository.delete(conversationId);
  }

  private async getLastMessage(conversationId: string): Promise<Message | null> {
    return await this.messageRepository.findOne({
      where: { conversationId },
      order: { createdAt: 'DESC' }
    });
  }

  private formatTimestamp(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString();
  }

  // Additional utility methods for the frontend features
  async hireFreelancer(conversationId: string, clientId: string): Promise<Conversation> {
    return await this.updateConversationStatus(conversationId, ConversationStatus.HIRED, clientId);
  }

  async markProjectComplete(conversationId: string, freelancerId: string): Promise<Message> {
    return await this.sendMessage(
      conversationId,
      freelancerId,
      'Project has been marked as complete. Please review and approve.',
      MessageType.SYSTEM
    );
  }

  async requestRevisions(conversationId: string, clientId: string, revisionNotes: string): Promise<Message> {
    return await this.sendMessage(
      conversationId,
      clientId,
      `Revision requested: ${revisionNotes}`,
      MessageType.SYSTEM
    );
  }

  async approveProject(conversationId: string, clientId: string): Promise<Conversation> {
    const conversation = await this.updateConversationStatus(conversationId, ConversationStatus.CLOSED, clientId);
    
    // Send system message
    await this.sendMessage(
      conversationId,
      clientId,
      'Project has been approved and payment completed.',
      MessageType.SYSTEM
    );

    return conversation;
  }
}
