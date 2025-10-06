import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader } from 'lucide-react';
import { Order, ordersApi } from '../lib/api';
import { toast } from 'sonner';


export default function OrderDetailsPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await ordersApi.getOrderById(orderId!);
        setOrder(response?.order);
        console.log('Fetched order details:', response.order);
      } catch (err: any) {
        console.error(err);
        toast.error('Failed to fetch order details');
        navigate('/'); // redirect to homepage if order not found
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="h-10 w-10 animate-spin text-black" />
      </div>
    );
  }

  if (!order) {
    return <div className="text-center mt-20 text-black">Order not found.</div>;
  }

  return (
    <div className="min-h-screen mt-12 flex items-center justify-center p-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Order Details</h1>

        <div className="rounded-lg border border-white/20 bg-white/5 p-6 mb-6">
          <div className="flex justify-between mb-2">
            <span>Order ID</span>
            <span className="font-mono">{order._id}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span>Payment Status</span>
            <span>{order.payment.status}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span>Payment Method</span>
            <span>{order.payment.method}</span>
          </div>
          {order.payment.transactionId && (
            <div className="flex justify-between mb-2">
              <span>Transaction ID</span>
              <span>{order.payment.transactionId}</span>
            </div>
          )}
          {order.payment.payuPaymentId && (
            <div className="flex justify-between mb-2">
              <span>PayU Payment ID</span>
              <span>{order.payment.payuPaymentId}</span>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-white/20 bg-white/5 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Items</h2>
          <ul>
            {order.items.map((item, idx) => (
              <li key={idx} className="flex justify-between mb-2">
                <span>{item.product.name} x {item.quantity}</span>
                <span>₹{(item.price * item.quantity).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-white/20 bg-white/5 p-6 mb-6">
          <div className="flex justify-between mb-2">
            <span>Subtotal</span>
            <span>₹{order.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span>Tax</span>
            <span>₹{order.tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span>Shipping</span>
            <span>₹{order.shippingCost.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>₹{order.total.toFixed(2)}</span>
          </div>
        </div>

        {order.notes && (
          <div className="rounded-lg border border-white/20 bg-white/5 p-6 mb-6">
            <h2 className="text-lg font-semibold mb-2">Notes</h2>
            <p>{order.notes}</p>
          </div>
        )}

        <div className="flex justify-between gap-4">
          <button
            onClick={() => navigate('/')}
            className="rounded-full border border-white/20 px-6 py-3 font-medium transition-colors hover:bg-white/10"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}
