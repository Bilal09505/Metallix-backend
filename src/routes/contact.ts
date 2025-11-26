import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Submit contact form
router.post('/', async (req, res) => {
  try {
    const { name, phone, email, message } = req.body;

    const contact = await prisma.contact.create({
      data: { name, phone, email, message }
    });

    res.json({ success: true, message: 'Message sent successfully', data: contact });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
});

export default router;