import { Request, Response } from 'express';
import { ConversationService } from '../services/ConversationService';
import { MessageType } from '../entities/Message';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
    status: string;
  };
}

export class MessageController {
  private conversationService: ConversationService;

  constructor() {
    this.conversationService = new ConversationService();
    
    // Bind methods to preserve 'this' context
    this.getConversations = this.getConversations.bind(this);
    this.getConversation = this.getConversation.bind(this);
    this.createConversation = this.createConversation.bind(this);
    this.sendMessage = this.sendMessage.bind(this);
    this.markAsRead = this.markAsRead.bind(this);
    this.hireFreelancer = this.hireFreelancer.bind(this);
    this.markProjectComplete = this.markProjectComplete.bind(this);
    this.requestRevisions = this.requestRevisions.bind(this);
    this.approveProject = this.approveProject.bind(this);
    this.deleteConversation = this.deleteConversation.bind(this);
  }

  // Get all conversations for a user
  getConversations = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const conversations = await this.conversationService.getConversationsByUserId(userId);
      res.json({
        success: true,
        data: conversations
      });
    } catch (error) {
      console.error('Error fetching conversations:', error);
      res.status(500).json({ error: 'Failed to fetch conversations' });
    }
  };

  // Get a specific conversation with messages
  getConversation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { conversationId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const conversation = await this.conversationService.getConversationById(conversationId, userId);
      if (!conversation) {
        res.status(404).json({ error: 'Conversation not found' });
        return;
      }

      const messages = await this.conversationService.getConversationMessages(conversationId, userId, page, limit);

      res.json({
        success: true,
        data: {
          conversation,
          messages
        }
      });
    } catch (error) {
      console.error('Error fetching conversation:', error);
      res.status(500).json({ error: 'Failed to fetch conversation' });
    }
  };

  // Create a new conversation
  createConversation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { freelancerId, jobId, projectTitle } = req.body;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      if (!freelancerId) {
        res.status(400).json({ error: 'Freelancer ID is required' });
        return;
      }

      const conversation = await this.conversationService.createConversation(
        userId, // client
        freelancerId,
        jobId,
        projectTitle
      );

      res.status(201).json({
        success: true,
        data: conversation
      });
    } catch (error) {
      console.error('Error creating conversation:', error);
      res.status(500).json({ error: 'Failed to create conversation' });
    }
  };

  // Send a message
  sendMessage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { conversationId } = req.params;
      const { content, type = MessageType.TEXT, fileData } = req.body;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      if (!content && type === MessageType.TEXT) {
        res.status(400).json({ error: 'Message content is required' });
        return;
      }

      const message = await this.conversationService.sendMessage(
        conversationId,
        userId,
        content,
        type,
        fileData
      );

      res.status(201).json({
        success: true,
        data: message
      });
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  };

  // Mark messages as read
  markAsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { conversationId } = req.params;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      await this.conversationService.markMessagesAsRead(conversationId, userId);

      res.json({
        success: true,
        message: 'Messages marked as read'
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
      res.status(500).json({ error: 'Failed to mark messages as read' });
    }
  };

  // Hire freelancer
  hireFreelancer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { conversationId } = req.params;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const conversation = await this.conversationService.hireFreelancer(conversationId, userId);

      res.json({
        success: true,
        data: conversation,
        message: 'Freelancer hired successfully'
      });
    } catch (error) {
      console.error('Error hiring freelancer:', error);
      res.status(500).json({ error: 'Failed to hire freelancer' });
    }
  };

  // Mark project as complete (freelancer action)
  markProjectComplete = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { conversationId } = req.params;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const message = await this.conversationService.markProjectComplete(conversationId, userId);

      res.json({
        success: true,
        data: message,
        message: 'Project marked as complete'
      });
    } catch (error) {
      console.error('Error marking project complete:', error);
      res.status(500).json({ error: 'Failed to mark project complete' });
    }
  };

  // Request revisions (client action)
  requestRevisions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { conversationId } = req.params;
      const { revisionNotes } = req.body;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      if (!revisionNotes) {
        res.status(400).json({ error: 'Revision notes are required' });
        return;
      }

      const message = await this.conversationService.requestRevisions(conversationId, userId, revisionNotes);

      res.json({
        success: true,
        data: message,
        message: 'Revision request sent'
      });
    } catch (error) {
      console.error('Error requesting revisions:', error);
      res.status(500).json({ error: 'Failed to request revisions' });
    }
  };

  // Approve project and complete payment (client action)
  approveProject = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { conversationId } = req.params;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const conversation = await this.conversationService.approveProject(conversationId, userId);

      res.json({
        success: true,
        data: conversation,
        message: 'Project approved and payment completed'
      });
    } catch (error) {
      console.error('Error approving project:', error);
      res.status(500).json({ error: 'Failed to approve project' });
    }
  };

  // Delete conversation
  deleteConversation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { conversationId } = req.params;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      await this.conversationService.deleteConversation(conversationId, userId);

      res.json({
        success: true,
        message: 'Conversation deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting conversation:', error);
      res.status(500).json({ error: 'Failed to delete conversation' });
    }
  };
}
