import express from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import { PrismaClient } from "@prisma/client";
import { authenticateToken, asyncHandler, authorizeRole } from '../utils/middleware';

const router = express.Router();
const prisma = new PrismaClient();

// ✅ Validation middleware
const validateLogin = [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
];

const validateRegister = [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('role').isIn(['waiter', 'chef', 'admin']).withMessage('Invalid role'),
];

// ✅ Login route
router.post('/login', asyncHandler(async (req: express.Request, res: express.Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;

  // Check user
  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Generate JWT
  const secret = process.env.JWT_SECRET || 'your-secret-key';
  const token = jwt.sign(
    {
      userId: user.id,
      username: user.username,
      role: user.role,
    },
    secret,
    { expiresIn: '356d' }
  );

  res.json({
    message: 'Login successful',
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
    },
    token,
  });
}));

// ✅ Register route (only username, password, role)
router.post('/register', asyncHandler(async (req: express.Request, res: express.Response) => {

  const { username, password, role } = req.body;
  console.log(req.body)
  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { username },
  });

  if (existingUser) {
    return res.status(400).json({ error: 'Username already exists' });
  }

  // Create user
  const user = await prisma.user.create({
    data: { username, password, role },
  });

  // Generate JWT
  const secret = process.env.JWT_SECRET || 'your-secret-key';
  const token = jwt.sign(
    { userId: user.id, username: user.username, role: user.role },
    secret,
    { expiresIn: '24h' }
  );

  res.status(201).json({
    message: 'Registration successful',
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
    },
    token,
  });
}));

// ✅ Delete user (admin only)
router.post('/:id/delete', authenticateToken, authorizeRole(['admin']), asyncHandler(async (req: express.Request, res: express.Response) => {
  const { id } = req.params;

  try {
    await prisma.user.delete({
      where: { id: Number(id) },
    });
    res.json({ message: "User deleted successfully" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to delete user" });
  }
}));

// ✅ Get current user
router.get('/me', authenticateToken, asyncHandler(async (req: express.Request, res: express.Response) => {
  const user = await prisma.user.findUnique({
    where: { id: (req as any).user.id },
    select: { id: true, username: true, role: true },
  });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({ user });
}));

// ✅ Get all users (admin only)
router.get(
  '/all',
  authenticateToken,
  authorizeRole(['admin']),
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const user = (req as any).user; // contains userId from JWT
    
    const users = await prisma.user.findMany({
      where: {
        id: {
          not: user.userId, // exclude logged-in user
        },
      },
      select: { id: true, username: true, role: true },
    });

    res.json({ users });
  })
);


export default router;
