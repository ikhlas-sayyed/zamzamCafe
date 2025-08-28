import express from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import User from '../utils/db/Models/User';
import type { IUser } from '../utils/db/Models/User';
import { PrismaClient } from "@prisma/client";
import { authenticateToken, asyncHandler } from '../utils/middleware';

const router = express.Router();
const prisma = new PrismaClient();

// Validation middleware
const validateLogin = [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
];

const validateRegister = [
  body('username').notEmpty().withMessage('Username is required'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('role').isIn(['waiter', 'chef', 'admin']).withMessage('Invalid role'),
];

// Login route
router.post('/login',  asyncHandler(async (req: express.Request, res: express.Response) => {
  console.log(req.body);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;

  // Find user by username
  const user=await prisma.user.findUnique({
    where:{username,password}
  });
  // const user = await User.findOne({ username, password });
  console.log(user);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Check password
  const isPasswordValid =  user.password===password;
  if (!isPasswordValid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Generate JWT token
  const secret = process.env.JWT_SECRET || 'your-secret-key';
  const token = jwt.sign(
    { 
      userId: user.id, 
      username: user.username, 
      role: user.role,
      email: user.email 
    },
    secret,
    { expiresIn: '24h' }
  );

  res.json({
    message: 'Login successful',
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    },
    token,
  });
}));

// Register route
router.post('/register', validateRegister, asyncHandler(async (req: express.Request, res: express.Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, email, password, firstName, lastName, role } = req.body;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where :{username}
  })
  
  if (existingUser) {
    return res.status(400).json({ 
      error: 'Username or email already exists' 
    });
  }

  // Create new user
  const user = await prisma.user.create({
    data:{
    username,
    email,
    password,
    firstName,
    lastName,
    role: role || 'waiter'
  }
});

  // Generate JWT token
  const secret = process.env.JWT_SECRET || 'your-secret-key';
  const token = jwt.sign(
    { 
      userId: user.id, 
      username: user.username, 
      role: user.role,
      email: user.email 
    },
    secret,
    { expiresIn: '24h' }
  );

  res.status(201).json({
    message: 'Registration successful',
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    },
    token,
  });
}));

// Logout route
router.post('/logout', (req: express.Request, res: express.Response) => {
  // JWT tokens are stateless, so logout is handled client-side
  res.json({
    message: 'Logout successful',
  });
});

// Get current user route
router.get('/me', authenticateToken, asyncHandler(async (req: express.Request, res: express.Response) => {
  const user = await prisma.user.findUnique({
    where:{id:(req as any).user.id},
    select:{id:true,username:true,email:true,firstName:true,lastName:true,role:true}
  })
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    },
  });
}));

export default router;
