import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Submit investment
router.post('/', authenticate, async (req: any, res) => {
  try {
    const {
      investorName,
      cnic,
      passport,
      country,
      amountPKR,
      amountUSD,
      paymentMethod
    } = req.body;

    const investment = await prisma.investment.create({
      data: {
        userId: req.user.id,
        investorName,
        cnic,
        passport,
        country,
        amountPKR,
        amountUSD,
        paymentMethod
      }
    });

    res.json({ success: true, message: 'Investment submitted', data: investment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to submit investment' });
  }
});

export default router;