import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware';

const router = express.Router();
const prisma = new PrismaClient();

// Create new purchase
router.post('/', authenticate, async (req: any, res) => {
  try {
    const { metalId, quantity, paymentMethod } = req.body;
    const userId = req.user.id;

    // Get current metal rate
    const metal = await prisma.metal.findUnique({
      where: { id: metalId, isActive: true }
    });

    if (!metal) {
      return res.status(404).json({ success: false, message: 'Metal not found' });
    }

    const totalAmount = quantity * metal.currentRate;

    // Create purchase with pending payment
    const purchase = await prisma.purchase.create({
      data: {
        userId,
        metalId,
        quantity,
        buyPrice: metal.currentRate,
        currentPrice: metal.currentRate,
        payment: {
          create: {
            amount: totalAmount,
            method: paymentMethod,
            status: 'PENDING'
          }
        }
      },
      include: {
        metal: true,
        payment: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Purchase created successfully',
      data: purchase
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create purchase' });
  }
});

// Get user's purchases
router.get('/my-purchases', authenticate, async (req: any, res) => {
  try {
    const purchases = await prisma.purchase.findMany({
      where: { userId: req.user.id },
      include: {
        metal: true,
        payment: true
      },
      orderBy: { purchaseDate: 'desc' }
    });

    // Calculate profit/loss for each purchase
    const purchasesWithProfit = purchases.map((purchase:any) => ({
      ...purchase,
      profitLoss: (purchase.currentPrice - purchase.buyPrice) * purchase.quantity,
      profitLossPercentage: ((purchase.currentPrice - purchase.buyPrice) / purchase.buyPrice) * 100
    }));

    res.json({ success: true, data: purchasesWithProfit });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch purchases' });
  }
});

// Sell metal
router.post('/:id/sell', authenticate, async (req: any, res) => {
  try {
    const purchaseId = req.params.id;
    
    const purchase = await prisma.purchase.update({
      where: { 
        id: purchaseId,
        userId: req.user.id,
        status: 'ACTIVE'
      },
      data: { status: 'SOLD' },
      include: { metal: true }
    });

    res.json({ 
      success: true, 
      message: 'Metal sold successfully',
      data: purchase 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to sell metal' });
  }
});

export default router;