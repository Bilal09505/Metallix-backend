import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get user's payments
router.get('/my-payments', authenticate, async (req: any, res) => {
  try {
    const payments = await prisma.payment.findMany({
      where: {
        purchase: { userId: req.user.id }
      },
      include: {
        purchase: {
          include: {
            metal: { select: { name: true, symbol: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: payments });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch payments' });
  }
});

// Update payment status (Admin only)
router.put('/:id/status', authenticate, requireAdmin, async (req: any, res) => {
  try {
    const { status, transactionId } = req.body;
    const paymentId = req.params.id;

    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: { 
        status,
        transactionId,
        ...(status === 'COMPLETED' && { paidAt: new Date() })
      },
      include: {
        purchase: {
          include: {
            user: { select: { name: true, phone: true } },
            metal: { select: { name: true } }
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Payment status updated successfully',
      data: updatedPayment
    });
  } catch (error) {
    console.error('Update payment error:', error);
    res.status(500).json({ success: false, message: 'Failed to update payment' });
  }
});

// Get all payments (Admin only)
router.get('/', authenticate, requireAdmin, async (req: any, res) => {
  try {
    const payments = await prisma.payment.findMany({
      include: {
        purchase: {
          include: {
            user: { select: { name: true, cnic: true } },
            metal: { select: { name: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: payments });
  } catch (error) {
    console.error('Get all payments error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch payments' });
  }
});

export default router;