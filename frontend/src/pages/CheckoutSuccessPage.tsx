import { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Download, Mail, Truck, Calendar, ArrowLeft, Loader } from 'lucide-react';
import { useSetAtom } from 'jotai';
import { clearCartAtom } from '../store/cart';
import { ordersApi } from '../lib/api';

export default function CheckoutSuccessPage() {
  const location = useLocation();
  const clearCart = useSetAtom(clearCartAtom);
  
  interface OrderItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
  }
  
  interface OrderData {
    orderNumber: string;
    total: number;
    items: OrderItem[];
  }
  
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get orderId from URL params
  const orderId = new URLSearchParams(location.search).get('orderId');

  useEffect(() => {
    // Clear cart after successful order
    clearCart();
    
    // If we have an orderId in URL params, fetch the order details
    const fetchOrderDetails = async () => {
      if (!orderId) {
        setError('Order ID not found');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const response = await ordersApi.getOrderById(orderId);
        
        interface ApiProduct {
          _id: string;
          name: string;
          images: Array<{ url?: string }>;
        }
        
        interface ApiOrderItem {
          product: ApiProduct;
          price: number;
          quantity: number;
        }
        
        interface ApiOrderResponse {
          order: {
            _id: string;
            total: number;
            items: ApiOrderItem[];
          };
        }
        
        const typedResponse = response as ApiOrderResponse;
        
        setOrderData({
          orderNumber: typedResponse.order._id,
          total: typedResponse.order.total,
          items: typedResponse.order.items.map((item) => ({
            id: item.product._id,
            name: item.product.name,
            price: item.price,
            quantity: item.quantity,
            image: item.product.images[0]?.url || `https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=100&h=100&fit=crop&sig=${item.product._id}`
          }))
        });
      } catch (err) {
        setError('Failed to fetch order details');
        console.error('Error fetching order details:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrderDetails();
  }, [clearCart, orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-12 w-12 text-white/60 animate-spin mx-auto mb-4" />
          <p className="text-lg text-white/80">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !orderData) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-light mb-4">Order Not Found</h1>
          <p className="text-white/70 mb-6">{error || 'We could not retrieve your order details.'}</p>
          <Link to="/" className="inline-block px-8 py-3 bg-white text-black rounded-full hover:bg-white/90 transition">
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  const { orderNumber, total, items } = orderData;
  const estimatedDelivery = new Date();
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 7);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-4xl px-6 py-16">
        {/* Success Animation */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ 
              type: "spring", 
              stiffness: 200, 
              damping: 20,
              delay: 0.2 
            }}
            className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-green-500"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Check className="h-12 w-12 text-white" />
            </motion.div>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-6xl font-extralight mb-4"
          >
            Order Confirmed
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-white/70 mb-2"
          >
            Thank you for your purchase!
          </motion.p>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-white/60"
          >
            Your order <span className="font-medium text-white">{orderNumber}</span> has been successfully placed.
          </motion.p>
        </div>

        {/* Order Details Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="rounded-2xl border border-white/10 bg-white/5 p-6"
          >
            <h2 className="text-xl font-light mb-6 flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Order Summary
            </h2>
            
            <div className="space-y-4">
              {items.slice(0, 3).map((item: any) => (
                <div key={item.id} className="flex items-center gap-3">
                  <img
                    src={item.image || `https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=100&h=100&fit=crop&sig=${item.id}`}
                    alt={item.name}
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{item.name}</div>
                    <div className="text-xs text-white/60">Qty: {item.quantity}</div>
                  </div>
                  <div className="text-sm font-medium">
                    ${(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
              {items.length > 3 && (
                <div className="text-sm text-white/60 text-center py-2">
                  +{items.length - 3} more items
                </div>
              )}
              
              <div className="border-t border-white/10 pt-4 flex justify-between font-medium">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </motion.div>

          {/* Shipping Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="rounded-2xl border border-white/10 bg-white/5 p-6"
          >
            <h2 className="text-xl font-light mb-6 flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Shipping Information
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-green-500/20 p-2">
                  <Check className="h-4 w-4 text-green-400" />
                </div>
                <div>
                  <div className="font-medium text-sm">Order Confirmed</div>
                  <div className="text-xs text-white/60">Just now</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 opacity-60">
                <div className="rounded-full bg-white/10 p-2">
                  <div className="h-4 w-4 rounded-full border-2 border-white/40" />
                </div>
                <div>
                  <div className="font-medium text-sm">Processing</div>
                  <div className="text-xs text-white/60">Within 24 hours</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 opacity-60">
                <div className="rounded-full bg-white/10 p-2">
                  <Truck className="h-4 w-4 text-white/40" />
                </div>
                <div>
                  <div className="font-medium text-sm">Shipped</div>
                  <div className="text-xs text-white/60">2-3 business days</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 opacity-60">
                <div className="rounded-full bg-white/10 p-2">
                  <Calendar className="h-4 w-4 text-white/40" />
                </div>
                <div>
                  <div className="font-medium text-sm">Delivered</div>
                  <div className="text-xs text-white/60">
                    Est. {estimatedDelivery.toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* What's Next */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="rounded-2xl border border-white/10 bg-white/5 p-8 mb-8"
        >
          <h2 className="text-2xl font-light mb-6">What's Next?</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="rounded-full bg-white/10 p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Mail className="h-8 w-8" />
              </div>
              <h3 className="font-medium mb-2">Check Your Email</h3>
              <p className="text-sm text-white/60">
                We've sent you an order confirmation email with all the details.
              </p>
            </div>
            
            <div className="text-center">
              <div className="rounded-full bg-white/10 p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Truck className="h-8 w-8" />
              </div>
              <h3 className="font-medium mb-2">Track Your Order</h3>
              <p className="text-sm text-white/60">
                You'll receive tracking information once your order ships.
              </p>
            </div>
            
            <div className="text-center">
              <div className="rounded-full bg-white/10 p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Download className="h-8 w-8" />
              </div>
              <h3 className="font-medium mb-2">Download Receipt</h3>
              <p className="text-sm text-white/60">
                Access your receipt anytime from your account.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="flex flex-col md:flex-row gap-4 justify-center items-center"
        >
          <Link
            to="/collections"
            className="rounded-full bg-white px-8 py-3 font-medium text-black transition-all hover:bg-white/90 hover:scale-105"
          >
            Continue Shopping
          </Link>
          
          <Link
            to="/account"
            className="rounded-full border border-white/20 px-8 py-3 font-medium transition-colors hover:bg-white/10"
          >
            View Order History
          </Link>
        </motion.div>

        {/* Back to Home */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center mt-12"
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </motion.div>
      </div>
    </div>
  );
}