import { Router } from 'express';
import { getMyChats, getChatMessages, sendMessage, deleteMessage } from '../controllers/chat.controller.js';
import { protect } from '../middleware/auth.js';
import { uploadSingle } from '../middleware/multer.js';

const router = Router();
router.use(protect);
router.get('/',                             getMyChats);
router.get('/:chatId/messages',             getChatMessages);
router.post('/:chatId/messages', uploadSingle, sendMessage);
router.delete('/:chatId/messages/:messageId', deleteMessage);
export default router;
