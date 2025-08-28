import express from 'express';
import { body, validationResult } from 'express-validator';
import multer from 'multer';
import path from 'path';
import { authenticateToken, authorizeRole, asyncHandler } from '../utils/middleware';
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
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

// Validation middleware
const validateMenuItem = [
  body('name').notEmpty().withMessage('Name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('category').notEmpty().withMessage('Category is required'),
];

// Get all menu items (public)
router.get('/', asyncHandler(async (req: express.Request, res: express.Response) => {
  console.log(req.query)
  const menuItems = await prisma.menuItem.findMany({
    where: { isAvailable: true }
  })
  console.log(menuItems)
  res.json({
    success: true,
    data: menuItems
  });
}));

// Get all menu items (admin only - includes unavailable items)
router.get('/admin', authenticateToken, authorizeRole(['admin']), asyncHandler(async (req: express.Request, res: express.Response) => {
  const menuItems = await prisma.menuItem.findMany({
    where: { isAvailable: true }
  })

  res.json({
    success: true,
    data: menuItems
  });
}));

// Get menu item by ID
router.get('/:id', asyncHandler(async (req: express.Request, res: express.Response) => {
  const menuItem = await prisma.menuItem.findFirst({
    where: { id: parseInt(req.params.id as string) }
  })

  if (!menuItem) {
    return res.status(404).json({ error: 'Menu item not found' });
  }

  res.json({
    success: true,
    data: menuItem
  });
}));

// Create new menu item (admin only)
router.post('/',
  authenticateToken,
  authorizeRole(['admin']),
  upload.single('image'),
  validateMenuItem,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Image is required' });
    }

    const { name, description, price, category } = req.body;

    const menuItem = await prisma.menuItem.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        category,
        image: `/uploads/${req.file.filename}`,
        updatedAt: new Date()
      }
    });

    res.status(201).json({
      success: true,
      message: 'Menu item created successfully',
      data: menuItem
    });
  })
);

// Update menu item (admin only)
router.put('/:id',
  authenticateToken,
  authorizeRole(['admin']),
  upload.single('image'),
  validateMenuItem,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, price, category, isAvailable } = req.body;

    const updateData: any = {
      name,
      description,
      price: parseFloat(price),
      category,
      isAvailable: isAvailable === 'true'
    };

    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    }

    const menuItem = await prisma.menuItem.update({
      where: { id: parseInt(req.params.id as string) },
      data: updateData
    })

    if (!menuItem) {
      return res.status(404).json({ error: 'Menu item not found' });
    }



    res.json({
      success: true,
      message: 'Menu item updated successfully',
      data: menuItem
    });
  })
);

// Delete menu item (admin only)
router.delete('/:id',
  authenticateToken,
  authorizeRole(['admin']),
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const menuItem = await prisma.menuItem.delete({
      where: { id: parseInt(req.params.id as string) }
    })

    if (!menuItem) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    res.json({
      success: true,
      message: 'Menu item deleted successfully'
    });
  })
);

// Toggle menu item availability (admin only)
router.patch('/:id/toggle',
  authenticateToken,
  authorizeRole(['admin']),
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const menuItem_current = await prisma.menuItem.findFirst({
      where: { id: parseInt(req.params.id as string) }
    });

    if (!menuItem_current?.name) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    const menuItem_update = await prisma.menuItem.update({
      where: { id: parseInt(req.params.id as string) },
      data: {
        isAvailable: !menuItem_current.isAvailable
      },
    });
    res.json({
      success: true,
      message: `Menu item ${!menuItem_current.isAvailable ? 'enabled' : 'disabled'} successfully`,
    });
  })
);

export default router; 