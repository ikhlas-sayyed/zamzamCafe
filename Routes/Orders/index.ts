import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken, authorizeRole, asyncHandler } from '../../utils/middleware';
import { OrderProgress, OrderStatus, PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();
import { startOfDay, endOfDay } from "date-fns";



let lastGeneratedDate: string | null | undefined = null;
let currentOrderNumber = 0;
function generateOrderNumber(): number {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  if (lastGeneratedDate !== today) {
    // New day → reset counter
    currentOrderNumber = 0;
    lastGeneratedDate = today;
  }

  currentOrderNumber += 1;
  return currentOrderNumber;
}



// Validation middleware
const validateOrder = [
  body('items').isArray({ min: 1 }).withMessage('Items must be a non-empty array'),
  body('items.*.menuItemId').notEmpty().withMessage('Menu item ID is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('tableNumber').optional().isInt({ min: 1 }).withMessage('Table number must be a positive integer'),
];

const validateStatusUpdate = [
  body('status').isIn(['pending', 'preparing', 'ready', 'completed', 'cancelled']).withMessage('Invalid status'),
];

const validateItemStatusUpdate = [
  body('itemIndex').isInt({ min: 0 }).withMessage('Item index must be a valid number'),
  body('status').isIn(['pending', 'preparing', 'ready']).withMessage('Invalid item status'),
  body('chefRemarks').optional().isString().isLength({ max: 200 }).withMessage('Chef remarks must be less than 200 characters'),
];

const validatePayment = [
  body('paymentMethod').isIn(['cash', 'card', 'digital']).withMessage('Invalid payment method'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('cashCollected').optional().isFloat({ min: 0 }).withMessage('Cash collected must be a positive number'),
];

router.get(
  "/",
  authenticateToken,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const user = (req as any).user;

    const query: any = {};


    if (user.role === "waiter") {
      query.waiterId = user.userId;
    }

    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    const orders = await prisma.order.findMany({
      where: {
        ...(query.waiterId && { waiterId: query.waiterId }),
        createdAt: {
          gte: todayStart,
          lt: todayEnd,
        },
      },
      include: {
        items: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      success: true,
      data: orders,
    });
  })
);

// GET /orders/by-date?startDate=yyyy-mm-dd&endDate=yyyy-mm-dd
router.get(
  "/by-date",
  authenticateToken,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const user = (req as any).user;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: "startDate and endDate are required" });
    }

    const query: any = {};

    if (user.role === "waiter") {
      query.waiterId = user.userId;
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    end.setHours(23, 59, 59, 999);

    const orders = await prisma.order.findMany({
      where: {
        ...(query.waiterId && { waiterId: query.waiterId }),
        createdAt: { gte: start, lte: end },
      },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      success: true,
      data: orders,
    });
  })
);



router.get(
  "/insights",
  authenticateToken,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const user = (req as any).user;

    const query: any = {};
    console.log(query)
    if (user.role === "waiter") {
      query.waiterId = user.userId;
    }

    // Optional date filter from query params
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate as string) : startOfDay(new Date());
    const end = endDate ? new Date(endDate as string) : endOfDay(new Date());

    const orders = await prisma.order.findMany({
      where: {
        ...(query.waiterId && { waiterId: query.waiterId }),
        createdAt: { gte: start, lte: end },
      },
      include: { items: true, waiter: true },
      orderBy: { createdAt: "desc" },
    });

    // --- Order Summary ---
    const orderSummaryMap: Record<string, number> = {};
    orders.forEach(o => {
      const status = o.status.charAt(0).toUpperCase() + o.status.slice(1);
      orderSummaryMap[status] = (orderSummaryMap[status] || 0) + 1;
    });
    const orderSummary = Object.keys(orderSummaryMap).map(key => ({
      status: key,
      count: orderSummaryMap[key],
    }));

    // --- Revenue Over Time ---
    const revenueMap: Record<string, number> = {};
    orders.forEach(o => {
      const date = o.createdAt.toISOString().split("T")[0];
      revenueMap[date] = (revenueMap[date] || 0) + (o.status === 'completed' ? o.totalAmount : 0);
    });

    const revenueOverTime = Object.keys(revenueMap).map(date => ({
      date,
      revenue: revenueMap[date],
    }));


    // --- Top Selling Items ---
    const itemMap: Record<string, number> = {};
    orders.forEach(o => {
      o.items.forEach(item => {
        itemMap[item.name] = (itemMap[item.name] || 0) + item.quantity;
      });
    });
    const topSellingItems = Object.entries(itemMap)
      .map(([item, sales]) => ({ item, sales }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 10);

    // --- Peak Hours ---
    const hourMap: Record<string, number> = {};
    orders.forEach(o => {
      const hour = o.createdAt.getHours();
      const displayHour = hour % 12 === 0 ? 12 : hour % 12;
      const ampm = hour < 12 ? "AM" : "PM";
      const key = `${displayHour} ${ampm}`;
      hourMap[key] = (hourMap[key] || 0) + 1;
    });
    const peakHours = Object.keys(hourMap).map(hour => ({
      hour,
      orders: hourMap[hour],
    }));

    // --- Waiter Performance ---
    const waiters = await prisma.user.findMany({
      where: { role: "waiter" },
      include: { orders: true },
    });
    const waiterPerformance = waiters.map(w => ({
      waiter: w.username,
      orders: w.orders.length,
    }));

    // --- Order Categories ---
    const categoriesRaw = await prisma.menuItem.groupBy({
      by: ["category"],
      _count: { category: true },
    });
    const orderCategories = categoriesRaw.map(c => ({
      category: c.category,
      value: c._count.category,
    }));

    // --- Customer Retention (dummy) ---
    const customerRetention = [
      { type: "New Customers", value: 70 },
      { type: "Repeat Customers", value: 30 },
    ];

    res.json({
      success: true,
      data: {
        orderSummary,
        revenueOverTime,
        topSellingItems,
        peakHours,
        waiterPerformance,
        orderCategories,
        customerRetention,
      },
    });
  })
);


// Get order by ID
router.get('/:id', authenticateToken, asyncHandler(async (req: express.Request, res: express.Response) => {
  const { id } = req.params;
  const user = (req as any).user;

  const order = await prisma.order.findFirst({
    where: { id: parseInt(id as string) }
  })

  if (!order?.id) {
    return res.status(404).json({ error: 'Order not found' });
  }

  // Waiters can only see their own orders
  if (user.role === 'waiter' && order.waiterId.toString() !== user.userId) {
    return res.status(403).json({ error: 'Access denied' });
  }

  res.json({
    success: true,
    data: order
  });
}));

// Get order bill for printing (admin only)
router.get('/:id/bill', authenticateToken, authorizeRole(['admin']), asyncHandler(async (req: express.Request, res: express.Response) => {
  const { id } = req.params;

  const order = await prisma.order.findFirst({
    where: { id: parseInt(id as string) },
    include: {
      items: true
    }
  })

  console.log(order)

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  // Generate bill data
  const billData = {
    orderNumber: order.orderNumber,
    tableNumber: order.tableNumber || 'Takeaway',
    waiter: order.waiterId,
    items: order.items,
    totalAmount: order.totalAmount,
    notes: order.notes,
    chefRemarks: order.chefRemarks,
    createdAt: order.createdAt,
    status: order.status,
    billGeneratedAt: new Date(),
    restaurantInfo: {
      name: 'Zamzam Cafe',
      address: '123 Restaurant Street, City, Country',
      phone: '+1234567890',
      email: 'info@zamzamcafe.com'
    }
  };

  res.json({
    success: true,
    message: 'Bill generated successfully',
    data: billData
  });
}));

// Create new order (waiter and admin can create orders)
router.post('/', authenticateToken, authorizeRole(['waiter', 'admin']), validateOrder, asyncHandler(async (req: express.Request, res: express.Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { items, tableNumber, notes } = req.body;
  // console.log(items)
  const user = (req as any).user;

  // Validate menu items and calculate totals
  const orderItems = [];
  let totalAmount = 0;
  for (const item of items) {
    const menuItem = await prisma.menuItem.findFirst({ where: { id: item.menuItemId } });
    if (!menuItem) {
      return res.status(400).json({ error: `Menu item ${item.menuItemId} not found` });
    }
    if (!menuItem.isAvailable) {
      return res.status(400).json({ error: `Menu item ${menuItem.name} is not available` });
    }

    const itemTotal = menuItem.price * item.quantity;
    totalAmount += itemTotal;

    orderItems.push({
      menuItemId: menuItem.id,
      name: menuItem.name,
      price: menuItem.price,
      quantity: item.quantity,
      totalPrice: itemTotal,
      status: 'pending' as OrderStatus
    });
  }

  // console.log(orderItems)
  let cashCollected=false
  cashCollected = user.role === "admin" ? true : false;
  const orderNumber = generateOrderNumber().toString();
  const order = await prisma.order.create({
    data: {
      status: 'pending',
      waiterId: parseInt(user.userId as string),
      totalAmount,
      tableNumber: tableNumber || 0,
      orderNumber,
      // cashCollected,
      notes,
      items: {
        create: orderItems
      }
    },
    include: { items: true }
  })

  const io = (req as any).io;
  let waiterId = user.role === "admin" ? 0 : user.userId;

  io.emit('newOrder', { waiterId: waiterId, order });

  res.status(201).json({
    success: true,
    message: 'Order created successfully',
    data: {
      orderNumber
    }
  });
}));

router.patch('/:id/status', authenticateToken, authorizeRole(['chef', 'admin', 'waiter']), validateStatusUpdate, asyncHandler(async (req: express.Request, res: express.Response) => {
  // const errors = validationResult(req);
  // if (!errors.isEmpty()) {
  //   return res.status(400).json({ errors: errors.array() });
  // }

  const { id } = req.params;
  const { status } = req.body;
  status as string;
  const user = (req as any).user;
  const order = await prisma.order.findFirst({
    where: { id: parseInt(id as string) },
  })
  if (!order?.id) {
    return res.status(404).json({ error: 'Order not found' });
  }
  const allowedStatuses = ['pending', 'preparing', 'ready', 'completed', 'cancelled'];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: 'Cannot update status out of range' });
  }
  // Only allow status changes for orders that are not completed or cancelled
  if ((order.status === 'completed' || order.status === 'cancelled') && user.role as string == 'waiter') {
    return res.status(400).json({ error: 'Cannot update completed or cancelled orders' });
  }
  if (status === 'cancelled' && !(order.status === 'pending') && user.role === 'waiter') {
    return res.status(400).json({ error: "Cannot cancelled orders it's preparing" });
  }
  if (status === 'completed' && !(order.status === 'ready') && user.role === 'waiter') {
    return res.status(400).json({ error: "Cannot completed orders not ready" });
  }
  const updatedOrder = await prisma.order.update({
    where: { id: parseInt(id as string) },
    data: {
      status: status as OrderProgress,
    }
  })
  const io = (req as any).io;
  let waiterId = updatedOrder.waiterId;

  io.emit('OrderStatus', { waiterId: waiterId, status, orderNumber: updatedOrder.orderNumber });
  res.json({
    success: true,
    message: 'Order status updated successfully',
    data: { id, status }
  });
}));


router.patch('/:id/submitCash', authenticateToken, authorizeRole(['admin']), validateStatusUpdate, asyncHandler(async (req: express.Request, res: express.Response) => {
  // const errors = validationResult(req);
  // if (!errors.isEmpty()) {
  //   return res.status(400).json({ errors: errors.array() });
  // }

  const { id } = req.params;
  const { status } = req.body;
  status as string;
  const user = (req as any).user;
  const order = await prisma.order.findFirst({
    where: { id: parseInt(id as string) },
  })
  if (!order?.id) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const updatedOrder = await prisma.order.update({
    where: { id: parseInt(id as string) },
    data: {
      cashCollected: true
    }
  });

 res.json({
    success: true,
    message: 'Order cashCollected updated successfully',
    data: { id, status }
  });
}));

// Update individual item status (chef only)
router.patch('/:id/items/:itemId/status', authenticateToken, authorizeRole(['chef', 'admin']), validateItemStatusUpdate, asyncHandler(async (req: express.Request, res: express.Response) => {
  // const errors = validationResult(req);
  // if (!errors.isEmpty()) {
  //   return res.status(400).json({ errors: errors.array() });
  // }

  const { id, itemId } = req.params;
  const { status, chefRemarks } = req.body;
  const user = (req as any).user
  console.log(req.body)
  const order = await prisma.orderItem.findFirst({
    where: { id: parseInt(itemId as string) }
  })
  if (!order?.id) {
    return res.status(404).json({ error: 'Order itmes not found' });
  }

  if (!(user.role == 'admin' || user.role == 'chef')) {
    return res.status(404).json({ error: 'out of scope' });
  }


  const { name } = await prisma.orderItem.update({
    where: { id: parseInt(itemId as string) },
    data: {
      status: status as OrderStatus
    }
  })
  let OrderStatus = 'preparing'
  const allReady = await prisma.orderItem.findMany({
    where: {
      orderId: parseInt(id as string),       // your orderId
      NOT: {
        status: 'ready'   // find items that are NOT ready
      }
    }
  })

  if (allReady.length === 0) {
    OrderStatus = 'ready'
  }

  const orderupdate = await prisma.order.update({
    where: { id: parseInt(id as string) },
    data: {
      status: OrderStatus as OrderProgress
    }
  })

  const io = (req as any).io;
  let waiterId = orderupdate.waiterId;
  io.emit('ItemStatus', { waiterId: waiterId, status, itemId, name, orderId: id, orderNumber: orderupdate.orderNumber });

  io.emit('OrderStatus', { waiterId: waiterId, status: OrderStatus, orderNumber: orderupdate.orderNumber });

  res.json({
    success: true,
    message: 'Item status updated successfully',
    data: {
      orderId: id,
      itemId,
      status
    }
  });
}));

// Update individual item status (chef only)
router.patch('/:id/items/update', authenticateToken, authorizeRole(['waiter', 'admin']), validateItemStatusUpdate, asyncHandler(async (req: express.Request, res: express.Response) => {
  // const errors = validationResult(req);
  // if (!errors.isEmpty()) {
  //   console.log(errors.array())
  //   console.log(req.body)
  //   return res.status(400).json({ errors: errors.array() });
  // }

  const { id } = req.params;
  const { updates } = req.body;
  const user = (req as any).user
  let totalAmount = 0;
  for (let i = 0; i < updates.length; i++) {
    const order = await prisma.orderItem.findFirst({
      where: { id: parseInt(updates[i].id as string) }
    })
    if (!order?.id) {
      return res.status(404).json({ error: 'Order itmes not found' });
    }
    if (order.status === 'ready') {
      return res.status(502).json({ error: "can't changes qty of ready items" });
    }
    totalAmount = ((order.price * updates[i].quantity) - (order.price * order.quantity)) + totalAmount
    const update_items = await prisma.orderItem.update({
      where: { id: parseInt(updates[i].id as string) },
      data: {
        quantity: updates[i].quantity
      }
    })

  }

  const { orderNumber, waiterId } = await prisma.order.update({
    where: { id: parseInt(id as string) },
    data: {
      totalAmount: {
        increment: totalAmount,
      },
    },
  });


  const io = (req as any).io;

  io.emit('updateItem', { waiterId, items: updates, id, orderNumber });

  res.json({
    success: true,
    message: 'Item status updated successfully',
    data: {
      orderId: id,
    }
  });
}));

router.patch('/:id/additems', authenticateToken, authorizeRole(['waiter', 'admin']), validateOrder, asyncHandler(async (req: express.Request, res: express.Response) => {
  // const errors = validationResult(req);
  // if (!errors.isEmpty()) {
  //   return res.status(400).json({ errors: errors.array() });
  // }

  const { items } = req.body;
  const { id } = req.params;
  const user = (req as any).user;
  let totalAmount = 0;
  const added_items = [];
  console.log(items)
  for (const item of items) {
    const menuItem = await prisma.menuItem.findFirst({ where: { id: parseInt(item.id) } });
    if (!menuItem) {
      return res.status(400).json({ error: `Menu item ${item.id} not found` });
    }
    if (!menuItem.isAvailable) {
      return res.status(400).json({ error: `Menu item ${menuItem.name} is not available` });
    }

    const itemTotal = menuItem.price * item.quantity;
    totalAmount += itemTotal;

    added_items.push({
      menuItemId: menuItem.id,
      name: menuItem.name,
      price: menuItem.price,
      quantity: parseInt(item.quantity as string),
      totalPrice: itemTotal,
      status: 'pending' as OrderStatus,
      orderId: parseInt(id as string),
    });
  }

  const inserted = await prisma.$transaction(
    added_items.map(item =>
      prisma.orderItem.create({ data: item })
    )
  );


  const statusCounts = await prisma.orderItem.groupBy({
    by: ['status'],
    where: { orderId: parseInt(id as string) },
    _count: { status: true }
  });

  const total = statusCounts.reduce((sum, s) => sum + s._count.status, 0);
  const pendingCount = statusCounts.find(s => s.status === 'pending')?._count.status ?? 0;
  const preparingCount = statusCounts.find(s => s.status === 'preparing')?._count.status ?? 0;
  const readyCount = statusCounts.find(s => s.status === 'ready')?._count.status ?? 0;

  let orderStatus: string;
  if (pendingCount === total) {
    orderStatus = 'pending';
  } else if (preparingCount > 0) {
    orderStatus = 'preparing';
  } else if (readyCount === total) {
    orderStatus = 'ready';
  } else {
    orderStatus = 'pending';
  }

  const { waiterId } = await prisma.order.update({
    where: { id: parseInt(id as string) },
    data: {
      totalAmount: { increment: totalAmount },
      status: orderStatus as OrderProgress
    },
  });

  const io = (req as any).io;


  io.emit('newItemAddtoOrder', { waiterId, items: inserted });
  io.emit('OrderStatus', { waiterId: waiterId, status: OrderStatus });

  console.log(inserted)
  res.status(201).json({
    success: true,
    message: 'Order items added successfully',
    data: { orderId: id, item: inserted[0] }
  });

}));

// routes/orders.ts

router.delete('/:id',
  authenticateToken,
  authorizeRole(['admin']),
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const orderId = parseInt(req.params.id as string);

    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!existingOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Delete order items first (if cascade not set)
    await prisma.orderItem.deleteMany({
      where: { orderId },
    });

    // Delete the order
    await prisma.order.delete({
      where: { id: orderId },
    });

    res.json({
      success: true,
      message: 'Order deleted successfully',
    });
  })
);

export default router;
