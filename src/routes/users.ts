import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import bcrypt from 'bcryptjs';

const router = express.Router();
const prisma = new PrismaClient();

// Get user profile
router.get('/profile', authenticate, async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        cnic: true,
        phone: true,
        role: true,
        selfie: true,
        isActive: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/profile', authenticate, async (req: any, res) => {
  try {
    const { name, phone } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { name, phone },
      select: {
        id: true,
        name: true,
        cnic: true,
        phone: true,
        role: true,
        selfie: true
      }
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
});

// Change password
router.put('/change-password', authenticate, async (req: any, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { password: true }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword }
    });

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Failed to change password' });
  }
});

// Get user dashboard stats
router.get('/dashboard', authenticate, async (req: any, res) => {
  try {
    const userId = req.user.id;

    const [
      totalPurchases,
      activePurchases,
      totalInvestments,
      totalMessages
    ] = await Promise.all([
      prisma.purchase.count({ where: { userId } }),
      prisma.purchase.count({ 
        where: { 
          userId, 
          status: 'ACTIVE' 
        } 
      }),
      prisma.investment.count({ where: { userId } }),
      prisma.message.count({ where: { userId } })
    ]);

    // Get recent purchases
    const recentPurchases = await prisma.purchase.findMany({
      where: { userId },
      include: {
        metal: { select: { name: true, symbol: true } },
        payment: { select: { status: true, amount: true } }
      },
      orderBy: { purchaseDate: 'desc' },
      take: 5
    });

    res.json({
      success: true,
      data: {
        stats: {
          totalPurchases,
          activePurchases,
          totalInvestments,
          totalMessages
        },
        recentPurchases
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard data' });
  }
});

export default router;