export interface User {
  _id: string
  username: string
  email: string
  firstName: string
  message? : string
  lastName: string
  role: 'waiter' | 'chef' | 'admin'
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface MenuItem {
  id: number
  name: string
  description?: string
  message? : string
  price: number
  image: string
  category: string
  isAvailable: boolean
  createdAt: string
  updatedAt: string
}

export interface OrderItem {
  menuItem: string
  name: string
  message? : string
  price: number
  quantity: number
  totalPrice: number
  status: 'pending' | 'preparing' | 'ready'
  chefRemarks?: string
}

export interface Order {
  id: string
  orderNumber: string
  waiter: User
  items: OrderItem[]
  totalAmount: number
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled'
  tableNumber?: number
  notes?: string
  chefRemarks?: string
  createdAt: string
  updatedAt: string
  message? : string
}
interface orderItems{
  menuItemId: string,
  quantity: number,
}

export interface CreateOrderRequest {
  message? : string
  items: orderItems[]
  tableNumber?: number
  notes?: string
}

export interface UpdateOrderRequest {
  message? : string
  items: Array<{
    menuItemId: string
    quantity: number
  }>
  tableNumber?: number
  notes?: string
}

export interface Payment {
  _id: string
  orderId: Order
  waiter: User
  amount: number
  paymentMethod: 'cash' | 'card' | 'digital'
  status: 'pending' | 'completed' | 'refunded'
  cashCollected?: number
  cashSubmitted?: number
  submittedAt?: string
  remarks?: string
  createdAt: string
  updatedAt: string
}

export interface SalesInsights {
  period: {
    startDate: string
    endDate: string
  }
  summary: {
    totalOrders: number
    totalRevenue: number
    averageOrderValue: number
  }
  waiterStats: Array<{
    waiterId: string
    waiterName: string
    orders: number
    revenue: number
  }>
  topSellingItems: Array<{
    name: string
    quantity: number
    revenue: number
  }>
  dailyBreakdown: Array<{
    date: string
    orders: number
    revenue: number
  }>
}

export interface BillData {
  orderNumber: string
  tableNumber: number | string
  waiter: User
  items: OrderItem[]
  totalAmount: number
  notes?: string
  chefRemarks?: string
  createdAt: string
  status: string
  billGeneratedAt: string
  restaurantInfo: {
    name: string
    address: string
    phone: string
    email: string
  }
}

export interface ApiResponse<T> {
  message? : string
  success: boolean
  data?: T
  error?: string
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  message? : string
  token: string
  user: User
}

export interface DashboardStats {
  message? : string
  totalOrders: number
  totalRevenue: number
  pendingOrders: number
  completedOrders: number
  topSellingItems: Array<{
    name: string
    quantity: number
    revenue: number
  }>
  peakHours: Array<{
    hour: number
    orders: number
  }>
}
