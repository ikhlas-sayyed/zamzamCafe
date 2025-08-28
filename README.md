# 🍽️ Zamzam Cafe Restaurant Management System

A comprehensive restaurant management system with real-time updates, role-based access control, and advanced features for waiters, chefs, and administrators.

## 🚀 Features

### **Waiter Dashboard**
- ✅ **Create Orders Only** - Waiters can create new orders but cannot edit/update existing orders
- ✅ **View Own Orders** - Real-time order status tracking
- ✅ **Payment Processing** - Create payment records for completed orders
- ✅ **Cash Collection** - Submit cash collections to admin
- ✅ **Real-time Notifications** - Instant updates via WebSocket

### **Chef Dashboard**
- ✅ **Order Management** - View and manage incoming orders
- ✅ **Start Preparing Orders** - Mark orders as "In Progress" (status: preparing)
- ✅ **Individual Item Status** - Mark specific items as "Ready" independently
- ✅ **Chef Remarks** - Add special instructions (e.g., "Extra spicy", "No onions")
- ✅ **Real-time Updates** - Instant notifications for new orders and status changes

### **Admin Dashboard**
- ✅ **Order Overview** - Complete order management and tracking
- ✅ **Date Range Filtering** - Filter insights by Start Date → End Date
- ✅ **Cash Collections** - Track all cash transactions
- ✅ **Waiter Cash Tracking** - Monitor which waiters haven't submitted cash
- ✅ **Payment Record Management** - Edit/update payment records as needed
- ✅ **Bill Printing** - Generate final bills for completed orders
- ✅ **Menu Management** - Full CRUD operations for menu items
- ✅ **User Management** - Manage waiter and chef accounts
- ✅ **Analytics** - Sales reports and performance metrics

### **Technical Features**
- ✅ **WebSocket Integration** - Real-time notifications between all roles
- ✅ **Role-Based Access Control** - Secure permissions for each user type
- ✅ **Payment Tracking** - Comprehensive cash and digital payment management
- ✅ **Item-Level Status Tracking** - Granular control over order preparation
- ✅ **Date Range Filtering** - Advanced filtering for reports and analytics

## 🛠️ Technology Stack

### **Backend**
- **Runtime**: Node.js with Bun
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with bcryptjs
- **Real-time**: Socket.io for WebSocket connections
- **File Upload**: Multer for image handling
- **Validation**: Express-validator
- **Security**: Helmet, CORS, Rate limiting

### **Frontend**
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with Shadcn/UI components
- **State Management**: Zustand for authentication
- **Data Fetching**: TanStack Query (React Query)
- **Routing**: React Router DOM
- **Real-time**: Socket.io client
- **Charts**: Recharts for analytics
- **Notifications**: Sonner for toast notifications
- **Icons**: Lucide React

## 📋 API Endpoints

### **Authentication**
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `GET /auth/profile` - Get user profile

### **Orders**
- `GET /orders` - Get orders (with date filtering)
- `POST /orders` - Create new order (waiter only)
- `PATCH /orders/:id/status` - Update order status (chef/admin)
- `PATCH /orders/:id/items/:itemIndex/status` - Update item status (chef only)
- `PATCH /orders/:id/remarks` - Add chef remarks (chef only)
- `POST /orders/:id/payment` - Create payment record (waiter only)
- `PATCH /orders/payments/:paymentId/submit-cash` - Submit cash (waiter only)
- `GET /orders/payments/cash-collections` - Get cash collections (admin only)
- `PUT /orders/payments/:paymentId` - Update payment record (admin only)

### **Menu**
- `GET /menu` - Get available menu items
- `GET /menu/admin` - Get all menu items (admin only)
- `POST /menu` - Create menu item (admin only)
- `PUT /menu/:id` - Update menu item (admin only)
- `PATCH /menu/:id/toggle` - Toggle availability (admin only)
- `DELETE /menu/:id` - Delete menu item (admin only)

## 🔧 Installation & Setup

### **Backend Setup**
```bash
# Install dependencies
bun install

# Set up environment variables
cp env.example .env
# Edit .env with your MongoDB URI and JWT secret

# Start development server
bun run dev
```

### **Frontend Setup**
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

## 🌐 Environment Variables

### **Backend (.env)**
```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

### **Frontend (.env)**
```env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=http://localhost:3000
```

## 🔐 Role-Based Permissions

### **Waiter**
- Create new orders
- View own orders
- Create payment records
- Submit cash collections
- Cannot edit existing orders
- Cannot delete orders

### **Chef**
- View all orders
- Start preparing orders (status: preparing)
- Mark individual items as ready
- Add chef remarks to orders
- Cannot change order to completed/cancelled

### **Admin**
- Full access to all features
- Manage menu items
- Manage users
- View analytics and reports
- Edit payment records
- Track cash collections
- Print bills

## 📊 Database Schema

### **Order Model**
```typescript
interface IOrder {
  orderNumber: string;
  waiter: ObjectId;
  items: IOrderItem[];
  totalAmount: number;
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  tableNumber?: number;
  notes?: string;
  chefRemarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface IOrderItem {
  menuItem: ObjectId;
  name: string;
  price: number;
  quantity: number;
  totalPrice: number;
  status: 'pending' | 'preparing' | 'ready';
  chefRemarks?: string;
}
```

### **Payment Model**
```typescript
interface IPayment {
  orderId: ObjectId;
  waiter: ObjectId;
  amount: number;
  paymentMethod: 'cash' | 'card' | 'digital';
  status: 'pending' | 'completed' | 'refunded';
  cashCollected?: number;
  cashSubmitted?: number;
  submittedAt?: Date;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## 🔌 WebSocket Events

### **Client → Server**
- `connect` - Establish connection with authentication
- `disconnect` - Handle disconnection

### **Server → Client**
- `newOrder` - Notify chef/admin of new order
- `orderStatusChanged` - Notify waiter/admin of status change
- `itemStatusChanged` - Notify waiter/admin of item status change
- `chefRemarksAdded` - Notify waiter/admin of chef remarks
- `paymentReceived` - Notify admin of new payment
- `cashSubmitted` - Notify admin of cash submission
- `menuItemAvailabilityChanged` - Notify all users of menu changes

## 🎯 Key Updates from Feedback

### **Waiter Dashboard Changes**
- ❌ **Removed**: Ability to edit/update existing orders
- ✅ **Added**: Payment processing and cash collection features
- ✅ **Enhanced**: Real-time order status notifications

### **Chef Dashboard Changes**
- ✅ **Added**: "In Progress" status for order preparation
- ✅ **Added**: Individual item status tracking
- ✅ **Added**: Chef remarks functionality for special instructions
- ✅ **Enhanced**: Real-time order notifications

### **Admin Dashboard Changes**
- ✅ **Added**: Date range filtering for insights
- ✅ **Added**: Cash collection tracking
- ✅ **Added**: Waiter cash submission monitoring
- ✅ **Added**: Payment record editing capabilities
- ✅ **Added**: Bill printing functionality

### **Technical Enhancements**
- ✅ **Added**: WebSocket integration for real-time updates
- ✅ **Enhanced**: Payment tracking system
- ✅ **Improved**: Order status management
- ✅ **Added**: Comprehensive cash management

## 🚀 Getting Started

1. **Clone the repository**
2. **Set up MongoDB database**
3. **Configure environment variables**
4. **Install dependencies for both backend and frontend**
5. **Start both servers**
6. **Access the application at http://localhost:5173**

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**Built with ❤️ for Zamzam Cafe**
