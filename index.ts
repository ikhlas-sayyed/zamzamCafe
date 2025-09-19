import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from 'dotenv';
import path from 'path';
import { createServer } from 'http';
import { Server } from "socket.io";
import authRoutes from './Routes/Auth';
import menuRoutes from './Routes/Menu';
import orderRoutes from './Routes/Orders';

// Load environment variables
config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3000;

// Initialize WebSocket server
const io =new Server(server);

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Example of joining a room
  socket.on("newOrder", (room) => {
    socket.join(room); //for chef
  });
  socket.on('ItemStatus',(room)=>{
    socket.join(room) //for waiter and admin if status chnage by chef
  });
  socket.on('OrderStatus',(room)=>{
    socket.join(room) //for waiter and admin if status chnage by chef
  });
  socket.on('updateItem',(room)=>{
    socket.join(room)
  })
  socket.on('newItemAddtoOrder',(room)=>{
    socket.join(room); // for chef 
  })
  // Handle client disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

app.use((req, res, next) => {
  (req as any).io = io;
  next();
});


// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:57543', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // limit each IP to 100 requests per windowMs
//   message: 'Too many requests from this IP, please try again later.',
//   standardHeaders: true,
//   legacyHeaders: false,
// });
// app.use(limiter);

// Logging middleware
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files
// serve images from /uploads folder
app.use('/uploads', express.static('uploads', {
  setHeaders: (res, path, stat) => {
    // Allow any origin to load images
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Optional: prevent caching issues
    res.setHeader('Cache-Control', 'no-cache');

    // Optional: set proper content type if needed
    // res.setHeader('Content-Type', 'image/jpeg');
  }
}));




// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API Routes
app.use('/auth', authRoutes);
app.use('/menu', menuRoutes);
app.use('/orders', orderRoutes);

// Basic routes for testing
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Zamzam Cafe Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/auth/*',
      menu: '/menu/*',
      orders: '/orders/*',
    },
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    error: {
      message,
      status: statusCode,
      timestamp: new Date().toISOString(),
      path: req.path,
    },
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: {
      message: 'Route not found',
      status: 404,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
    },
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Zamzam Cafe Backend Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔌 WebSocket server initialized`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});
