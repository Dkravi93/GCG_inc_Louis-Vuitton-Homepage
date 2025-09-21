import { Request, Response } from 'express';
import { z } from 'zod';
import { Order } from '../models/order';
import { UserModel } from '../models/user';
import { AuthenticatedRequest } from '../types/express';
import { payuService } from '../utils/payuService';
import EmailService from '../services/emailService';

// Validation schemas
const createOrderSchema = z.object({
  items: z.array(z.object({
    product: z.string(),
    variant: z.object({
      color: z.string(),
      size: z.string(),
      sku: z.string(),
    }),
    quantity: z.number().min(1),
    price: z.number().min(0),
  })),
  shippingAddress: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    country: z.string(),
  }),
  billingAddress: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    country: z.string(),
  }),
  paymentMethod: z.enum(['credit_card', 'debit_card', 'paypal', 'upi', 'net_banking', 'wallet']),
  notes: z.string().optional(),
});

const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']),
  notes: z.string().optional(),
});

/**
 * Get all orders for a user or all orders for admin
 */
export async function getOrders(req: Request, res: Response) {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    if (!authenticatedReq.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    let query: any = {};

    // If not admin, only show user's orders
    if (authenticatedReq.user.role !== 'admin' && authenticatedReq.user.role !== 'superadmin') {
      query.user = authenticatedReq.user.sub;
    }

    // Filter by status if provided
    if (req.query.status) {
      query.status = req.query.status;
    }
    console.log('Authenticated user:', query);
    const orders = await Order.find(query)
      .populate('user', 'firstName lastName email')
      .populate('items.product', 'name images basePrice category brand')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
}

/**
 * Get a specific order by ID
 */
export async function getOrderById(req: Request, res: Response) {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    if (!authenticatedReq.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const orderId = req.params.id;
    let query: any = { _id: orderId };

    // If not admin, only allow access to user's own orders
    if (authenticatedReq.user.role !== 'admin' && authenticatedReq.user.role !== 'superadmin') {
      query.user = authenticatedReq.user.sub;
    }

    const order = await Order.findOne(query)
      .populate('user', 'firstName lastName email phone')
      .populate('items.product', 'name images basePrice category brand');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({ order });
  } catch (error) {
    console.error('Get order by ID error:', error);
    res.status(500).json({ message: 'Failed to fetch order' });
  }
}

/**
 * Create a new order
 */
export async function createOrder(req: Request, res: Response) {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    if (!authenticatedReq.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const validation = createOrderSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        message: 'Invalid order data', 
        errors: validation.error.issues 
      });
    }

    const { items, shippingAddress, billingAddress, paymentMethod, notes } = validation.data;

    // Get user details
    const user = await UserModel.findById(authenticatedReq.user.sub);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Calculate order totals
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.08; // 8% tax rate
    const shippingCost = subtotal >= 2000 ? 0 : 199; // Free shipping over ₹2000, otherwise ₹199
    const total = subtotal + tax + shippingCost;

    // Create order
    const order = new Order({
      user: user._id,
      items,
      shippingAddress,
      billingAddress,
      payment: {
        method: paymentMethod,
        status: 'pending',
        gateway: 'payu',
      },
      subtotal,
      tax,
      shippingCost,
      total,
      notes,
    });

    await order.save();

    // Generate PayU payment request
    const paymentRequest = payuService.preparePaymentRequest({
      orderId: order._id.toString(),
      amount: order.total,
      productInfo: `GCG Eyewear Order - ${order.items.length} items`,
      customerName: `${user.firstName} ${user.lastName}`,
      customerEmail: user.email,
      customerPhone: req.body.phone || user.phone || '9999999999',
      successUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/checkout/success`,
      failureUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/checkout/failure`,
    });

    // Update order with PayU transaction ID
    order.payment.payuOrderId = paymentRequest.txnid;
    await order.save();

    res.status(201).json({
      message: 'Order created successfully',
      order,
      paymentRequest,
      paymentUrl: payuService.getGatewayUrl(),
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Failed to create order' });
  }
}

/**
 * Handle PayU payment response (webhook/redirect)
 */
export async function handlePaymentResponse(req: Request, res: Response) {
  try {
    console.log('Payment response received:', req.body);
    const emailService = new EmailService();

    // Parse payment response
    const paymentResponse = payuService.parsePaymentResponse(req.body);

    // Verify payment hash
    if (!payuService.verifyPaymentResponse(req.body)) {
      console.error('Payment verification failed - invalid hash');
      return res.status(400).json({ message: 'Invalid payment response' });
    }

    // Find order using UDF1 (orderId)
    const orderId = paymentResponse.udf1;
    const order = await Order.findById(orderId);

    if (!order) {
      console.error('Order not found:', orderId);
      return res.status(404).json({ message: 'Order not found' });
    }

    // Validate payment amount
    // Ensure both values are numbers before comparison
    const expectedAmount = typeof order.total === 'number' ? order.total : parseFloat(String(order.total));
    const receivedAmount = typeof paymentResponse.amount === 'number' ? paymentResponse.amount : parseFloat(String(paymentResponse.amount));
    
    if (!payuService.validatePaymentAmount(expectedAmount, receivedAmount)) {
      console.error('Payment amount mismatch:', { 
        expected: expectedAmount, 
        received: receivedAmount 
      });
      return res.status(400).json({ message: 'Payment amount mismatch' });
    }

    // Update order based on payment status
    if (payuService.isPaymentSuccessful(paymentResponse)) {
      order.payment.status = 'completed';
      order.payment.transactionId = paymentResponse.txnid;
      order.payment.payuPaymentId = paymentResponse.mihpayid;
      order.payment.gatewayResponse = paymentResponse;
      order.status = 'confirmed';

      // Send order confirmation email
      await emailService.sendOrderConfirmation(order.user.toString(), order);
    } else {
      order.payment.status = 'failed';
      order.payment.gatewayResponse = paymentResponse;
      order.status = 'cancelled';
      
      console.log('Payment failed:', payuService.getFailureReason(paymentResponse));
    }

    await order.save();

    // Return appropriate response based on request type
    if (req.headers['content-type']?.includes('application/json')) {
      // API response for AJAX calls
      res.json({
        success: payuService.isPaymentSuccessful(paymentResponse),
        orderId: order._id.toString(),
        order,
        message: payuService.isPaymentSuccessful(paymentResponse) 
          ? 'Payment successful' 
          : payuService.getFailureReason(paymentResponse)
      });
    } else {
      // For PayU redirects, we need to ensure the frontend receives all necessary data
      // Since we can't pass a complex state in a redirect, we'll store the order data temporarily
      // and redirect with just the orderId, and update the frontend to fetch the order details
      const redirectUrl = payuService.isPaymentSuccessful(paymentResponse)
        ? `${process.env.FRONTEND_URL || 'http://localhost:5173'}/checkout/success?orderId=${orderId}`
        : `${process.env.FRONTEND_URL || 'http://localhost:5173'}/checkout/failure?orderId=${orderId}&error=${encodeURIComponent(payuService.getFailureReason(paymentResponse))}`;

      res.redirect(redirectUrl);
    }
  } catch (error) {
    console.error('Handle payment response error:', error);
    res.status(500).json({ message: 'Failed to process payment response' });
  }
}

/**
 * Update order status (admin only)
 */
export async function updateOrderStatus(req: Request, res: Response) {
  try {
    const emailService = new EmailService();
    const authenticatedReq = req as AuthenticatedRequest;
    if (!authenticatedReq.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Check if user is admin
    if (authenticatedReq.user.role !== 'admin' && authenticatedReq.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const validation = updateOrderStatusSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        message: 'Invalid status data', 
        errors: validation.error.issues 
      });
    }

    const orderId = req.params.id;
    const { status, notes } = validation.data;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.status = status;
    if (notes) {
      order.notes = notes;
    }

    await order.save();

    // Send status update email to customer
    await emailService.sendOrderStatusUpdate(authenticatedReq.user.email, order);

    res.json({ 
      message: 'Order status updated successfully',
      order 
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Failed to update order status' });
  }
}

/**
 * Cancel order
 */
export async function cancelOrder(req: Request, res: Response) {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    if (!authenticatedReq.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const orderId = req.params.id;
    let query: any = { _id: orderId };

    // If not admin, only allow access to user's own orders
    if (authenticatedReq.user.role !== 'admin' && authenticatedReq.user.role !== 'superadmin') {
      query.user = authenticatedReq.user.sub;
    }

    const order = await Order.findOne(query);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if order can be cancelled
    if (['shipped', 'delivered'].includes(order.status)) {
      return res.status(400).json({ 
        message: 'Cannot cancel order that has been shipped or delivered' 
      });
    }

    order.status = 'cancelled';
    if (order.payment.status === 'completed') {
      order.payment.status = 'refunded';
      // Here you would integrate with PayU's refund API
    }

    await order.save();

    res.json({ 
      message: 'Order cancelled successfully',
      order 
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ message: 'Failed to cancel order' });
  }
}
