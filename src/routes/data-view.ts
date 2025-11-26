import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get user's data
router.get('/my-data', authenticate, async (req: any, res) => {
  try {
    const userData = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        purchases: { include: { metal: true } },
        investments: true
      }
    });

    res.json({ success: true, data: userData });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch data' });
  }
});

export default router;