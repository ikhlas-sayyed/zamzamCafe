import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  role?: string;
}

class WebSocketServer {
  private io: SocketIOServer;

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        methods: ["GET", "POST"]
      }
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    this.io.use(async (socket: AuthenticatedSocket, next: (err?: Error) => void) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication error'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
        socket.userId = decoded.userId;
        socket.role = decoded.role;
        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`User ${socket.userId} (${socket.role}) connected`);

      // Join role-specific rooms
      socket.join(socket.role || 'guest');

      // Join waiter-specific room if waiter
      if (socket.role === 'waiter') {
        socket.join(`waiter-${socket.userId}`);
      }

      socket.on('disconnect', () => {
        console.log(`User ${socket.userId} disconnected`);
      });
    });
  }

  // Notify all users about new order
  public notifyNewOrder(order: any) {
    this.io.to('chef').to('admin').emit('newOrder', order);
  }

  // Notify waiter about order status change
  public notifyOrderStatusChange(order: any) {
    this.io.to(`waiter-${order.waiter}`).to('admin').emit('orderStatusChanged', order);
  }

  // Notify about item status change
  public notifyItemStatusChange(order: any) {
    this.io.to(`waiter-${order.waiter}`).to('admin').emit('itemStatusChanged', order);
  }

  // Notify about chef remarks
  public notifyChefRemarks(order: any) {
    this.io.to(`waiter-${order.waiter}`).to('admin').emit('chefRemarksAdded', order);
  }

  // Notify about payment
  public notifyPayment(payment: any) {
    this.io.to('admin').emit('paymentReceived', payment);
  }

  // Notify about cash submission
  public notifyCashSubmission(payment: any) {
    this.io.to('admin').emit('cashSubmitted', payment);
  }

  // Notify about menu item availability change
  public notifyMenuItemAvailability(menuItem: any) {
    this.io.to('waiter').to('chef').to('admin').emit('menuItemAvailabilityChanged', menuItem);
  }
}

export default WebSocketServer;
