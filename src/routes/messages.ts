import express from 'express';
import { MessageController } from '../controllers/MessageController';
import { authenticate } from '../middleware/auth';

const router = express.Router();
const messageController = new MessageController();

// All routes require authentication
router.use(authenticate);

// Conversation routes
router.get('/conversations', messageController.getConversations as any);
router.get('/conversations/:conversationId', messageController.getConversation as any);
router.post('/conversations', messageController.createConversation as any);
router.delete('/conversations/:conversationId', messageController.deleteConversation as any);

// Message routes
router.post('/conversations/:conversationId/messages', messageController.sendMessage as any);
router.put('/conversations/:conversationId/mark-read', messageController.markAsRead as any);

// Action routes
router.put('/conversations/:conversationId/hire', messageController.hireFreelancer as any);
router.put('/conversations/:conversationId/complete', messageController.markProjectComplete as any);
router.put('/conversations/:conversationId/revisions', messageController.requestRevisions as any);
router.put('/conversations/:conversationId/approve', messageController.approveProject as any);

export default router;
