import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// 1. Create a new order (Supports guest and authenticated users)
router.post('/', async (req, res) => {
  try {
    const {
      userId,
      items,
      address,
      phone,
      paymentMethod,
      latitude,
      longitude,
      transactionId,
      deliveryDate,
      deliveryTimeSlot
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0 || !address || !phone) {
      return res.status(400).json({ message: 'Order items, delivery address, and phone number are required' });
    }

    // A. Validate delivery location and calculate distance
    const GADWAL_CENTER = { lat: 16.2268, lon: 77.8080 };
    const lat = parseFloat(latitude || 16.2268);
    const lon = parseFloat(longitude || 77.8080);
    
    // Haversine helper
    const toRad = (val: number) => (val * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat - GADWAL_CENTER.lat);
    const dLon = toRad(lon - GADWAL_CENTER.lon);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(GADWAL_CENTER.lat)) * Math.cos(toRad(lat)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = parseFloat((R * c).toFixed(2));

    if (distance > 25.0) {
      return res.status(400).json({ message: `Delivery address is ${distance} km away, which exceeds our maximum service radius of 25 km.` });
    }

    // Delivery fee: Free within 5 km, ₹10 for every 2 km after
    const deliveryFee = distance <= 5.0 ? 0 : Math.ceil((distance - 5.0) / 2) * 10;

    // B. Calculate prices and verify items
    let subtotal = 0;
    const verifiedItems: {
      productId: string;
      weight: string;
      quantity: number;
      price: number;
    }[] = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId }
      });

      if (!product) {
        return res.status(404).json({ message: `Product not found: ${item.productId}` });
      }

      if (!product.inStock) {
        return res.status(400).json({ message: `Product is out of stock: ${product.nameEn}` });
      }

      // Fetch appropriate price based on selected weight
      let unitPrice = 0;
      if (item.weight === '250g') {
        unitPrice = product.price250g;
      } else if (item.weight === '500g') {
        unitPrice = product.price500g;
      } else if (item.weight === '1kg') {
        unitPrice = product.price1kg;
      } else {
        return res.status(400).json({ message: `Invalid weight option: ${item.weight}` });
      }

      const itemTotal = unitPrice * parseInt(item.quantity);
      subtotal += itemTotal;

      verifiedItems.push({
        productId: product.id,
        weight: item.weight,
        quantity: parseInt(item.quantity),
        price: unitPrice
      });
    }

    const totalAmount = subtotal + deliveryFee;

    // C. Store the order inside a transaction
    const order = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          userId: userId || null,
          status: 'PENDING',
          totalAmount,
          paymentStatus: 'UNPAID',
          paymentMethod,
          address,
          phone,
          deliveryDistance: distance,
          deliveryFee,
          transactionId: transactionId || null,
          deliveryDate: deliveryDate || null,
          deliveryTimeSlot: deliveryTimeSlot || null
        }
      });

      for (const item of verifiedItems) {
        await tx.orderItem.create({
          data: {
            orderId: createdOrder.id,
            productId: item.productId,
            weight: item.weight,
            quantity: item.quantity,
            price: item.price
          }
        });
      }

      return createdOrder;
    });

    // Fetch complete order with item details to return
    const completeOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    return res.status(201).json(completeOrder);
  } catch (error: any) {
    console.error('Order creation error:', error);
    return res.status(500).json({ message: 'Error processing order check-out', error: error.message });
  }
});

// 2. Get order status by ID (Public tracking)
router.get('/track/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ message: 'Order tracking ID not found' });
    }

    return res.json(order);
  } catch (error: any) {
    console.error('Order tracking fetch error:', error);
    return res.status(500).json({ message: 'Error retrieving order status' });
  }
});

// 3. Get user orders history
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(orders);
  } catch (error: any) {
    console.error('User orders fetch error:', error);
    return res.status(500).json({ message: 'Error retrieving purchase history' });
  }
});

// 4. Get all orders with dashboard stats (Admin Only)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        user: true,
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Compute basic analytics for dashboard
    const totalSales = orders.reduce((acc, o) => o.paymentStatus === 'PAID' || o.status === 'DELIVERED' ? acc + o.totalAmount : acc, 0);
    const pendingOrdersCount = orders.filter(o => o.status === 'PENDING').length;
    const activeOrdersCount = orders.filter(o => ['PREPARING', 'PACKED', 'SHIPPED'].includes(o.status)).length;
    const completedOrdersCount = orders.filter(o => o.status === 'DELIVERED').length;

    return res.json({
      orders,
      stats: {
        totalSales,
        pendingOrdersCount,
        activeOrdersCount,
        completedOrdersCount,
        totalOrdersCount: orders.length
      }
    });
  } catch (error: any) {
    console.error('Admin orders fetch error:', error);
    return res.status(500).json({ message: 'Error loading admin orders data' });
  }
});

// 5. Update order status (Admin Only)
router.put('/:id/status', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['PENDING', 'PREPARING', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid order status value' });
    }

    const order = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    return res.json(order);
  } catch (error: any) {
    console.error('Order status update error:', error);
    return res.status(500).json({ message: 'Error updating order status' });
  }
});

// 6. Update order payment status (Admin Only)
router.put('/:id/payment', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body;

    const validPaymentStatuses = ['UNPAID', 'PAID', 'REFUNDED'];
    if (!validPaymentStatuses.includes(paymentStatus)) {
      return res.status(400).json({ message: 'Invalid payment status value' });
    }

    const order = await prisma.order.update({
      where: { id },
      data: { paymentStatus }
    });

    return res.json(order);
  } catch (error: any) {
    console.error('Order payment update error:', error);
    return res.status(500).json({ message: 'Error updating payment status' });
  }
});
// 7. Delete an order (Admin Only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.order.delete({
      where: { id }
    });
    return res.json({ message: 'Order deleted successfully' });
  } catch (error: any) {
    console.error('Delete order error:', error);
    return res.status(500).json({ message: 'Server error during order deletion' });
  }
});
export default router;
