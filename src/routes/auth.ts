import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();
const prisma = new PrismaClient();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'selfie-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Register user with file upload
router.post('/register', upload.single('selfie'), async (req, res) => {
  try {
    console.log('Registration body:', req.body);
    console.log('Uploaded file:', req.file);

    const { name, cnic, phone, password } = req.body;

    // Validate required fields
    if (!name || !cnic || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Validate CNIC format
    if (!/^\d{13}$/.test(cnic)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid CNIC format' 
      });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { cnic } });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User already exists' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Handle selfie file
    const selfieUrl = req.file ? `/uploads/${req.file.filename}` : null;

    // Create user
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        cnic: cnic.trim(),
        phone: phone.trim(),
        password: hashedPassword,
        selfie: selfieUrl,
      },
      select: { 
        id: true, name: true, cnic: true, phone: true, role: true, selfie: true, createdAt: true
      }
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, cnic: user.cnic }, 
      process.env.JWT_SECRET!, 
      { expiresIn: '30d' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: { user, token }
    });

  } catch (error: any) {
    console.error('Registration error:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({ 
        success: false, 
        message: 'User already exists' 
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Registration failed'
    });
  }
});

// Serve uploaded files
// router.use('/uploads', express.static(path.join(__dirname, '../../uploads')));


// Login user
router.post('/login', async (req, res) => {
  try {
    console.log('Login request body:', req.body); // Debug log

    if (!req.body || !req.body.cnic || !req.body.password) {
      return res.status(400).json({ 
        success: false, 
        message: 'CNIC and password are required' 
      });
    }

    const { cnic, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({ 
      where: { cnic: cnic.trim() },
      select: { 
        id: true, 
        name: true, 
        cnic: true, 
        phone: true, 
        password: true, 
        role: true, 
        selfie: true,
        isActive: true 
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, cnic: user.cnic }, 
      process.env.JWT_SECRET!, 
      { expiresIn: '30d' }
    );

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: 'Login successful',
      data: { user: userWithoutPassword, token }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Login failed' 
    });
  }
});

// Test endpoint to check if server is working
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Auth routes are working!',
    timestamp: new Date().toISOString()
  });
});

export default router;