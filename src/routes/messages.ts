import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Send message
router.post('/', authenticate, async (req: any, res) => {
  try {
    const { message } = req.body;

    const newMessage = await prisma.message.create({
      data: {
        userId: req.user.id,
        message
      }
    });

    res.json({ success: true, message: 'Message sent successfully', data: newMessage });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
});

export default router;