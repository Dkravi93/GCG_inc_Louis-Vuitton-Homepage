import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader, ArrowRight, Package, CreditCard, Clock } from 'lucide-react';
import { ordersApi } from '../lib/api';
import { toast } from 'sonner';

interface PaymentStatus {
  status: 'success' | 'failure' | 'pending' | 'loading';
  orderId?: string;
  amount?: number;
  paymentId?: string;
  message?: string;
}

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>({ status: 'loading' });

  useEffect(() => {
    const processPaymentResponse = async () => {
      try {
        // Extract PayU response parameters
        const mihpayid = searchParams.get('mihpayid');
        const status = searchParams.get('status');
        const txnid = searchParams.get('txnid');
        const amount = searchParams.get('amount');
        const productinfo = searchParams.get('productinfo');
        const firstname = searchParams.get('firstname');
        const email = searchParams.get('email');
        const phone = searchParams.get('phone');
        const hash = searchParams.get('hash');
        const error = searchParams.get('error');
        const error_Message = searchParams.get('error_Message');

        if (!mihpayid || !status || !txnid) {
          throw new Error('Invalid payment response');
        }

        // Send payment response to backend for verification
        const response = await ordersApi.handlePaymentResponse({
          mihpayid,
          status,
          txnid,
          amount,
          productinfo,
          firstname,
          email,
          phone,
          hash,
          error,
          error_Message
        });

        if (response.success) {
          setPaymentStatus({
            status: status.toLowerCase() === 'success' ? 'success' : 'failure',
            orderId: response.orderId,
            amount: parseFloat(amount || '0'),
            paymentId: mihpayid,
            message: response.message || 'Payment processed successfully'
          });

          if (status.toLowerCase() === 'success') {
            toast.success('Payment completed successfully!');
          } else {
            toast.error('Payment failed. Please try again.');
          }
        } else {
          throw new Error(response.message || 'Payment verification failed');
        }
      } catch (error: any) {
        console.error('Payment processing error:', error);
        setPaymentStatus({
          status: 'failure',
          message: error.message || 'Payment processing failed'
        });
        toast.error(error.message || 'Payment processing failed');
      }
    };

    if (searchParams.size > 0) {
      processPaymentResponse();
    } else {
      setPaymentStatus({
        status: 'failure',
        message: 'No payment data received'
      });
    }
  }, [searchParams]);

  const renderStatusIcon = () => {
    switch (paymentStatus.status) {
      case 'success':
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500"
          >
            <CheckCircle className="h-10 w-10 text-white" />
          </motion.div>
        );
      case 'failure':
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-500"
          >
            <XCircle className="h-10 w-10 text-white" />
          </motion.div>
        );
      case 'pending':
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-yellow-500"
          >
            <Clock className="h-10 w-10 text-white" />
          </motion.div>
        );
      default:
        return (
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center">
            <Loader className="h-10 w-10 animate-spin text-white" />
          </div>
        );
    }
  };

  const getStatusTitle = () => {
    switch (paymentStatus.status) {
      case 'success':
        return 'Payment Successful!';
      case 'failure':
        return 'Payment Failed';
      case 'pending':
        return 'Payment Pending';
      default:
        return 'Processing Payment...';
    }
  };

  const getStatusMessage = () => {
    if (paymentStatus.message) {
      return paymentStatus.message;
    }

    switch (paymentStatus.status) {
      case 'success':
        return 'Your order has been confirmed and you will receive a confirmation email shortly.';
      case 'failure':
        return 'There was an issue processing your payment. Please try again or contact support.';
      case 'pending':
        return 'Your payment is being processed. You will be notified once it is confirmed.';
      default:
        return 'Please wait while we process your payment...';
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center"
      >
        {renderStatusIcon()}

        <h1 className="text-3xl font-light mb-4">{getStatusTitle()}</h1>
        
        <p className="text-white/80 mb-8">{getStatusMessage()}</p>

        {paymentStatus.status !== 'loading' && (
          <div className="space-y-4 mb-8">
            {paymentStatus.orderId && (
              <div className="rounded-lg border border-white/20 bg-white/5 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/60">Order ID</span>
                  <span className="font-mono text-sm">{paymentStatus.orderId}</span>
                </div>
                {paymentStatus.amount && (
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/60">Amount</span>
                    <span className="font-medium">₹{paymentStatus.amount.toFixed(2)}</span>
                  </div>
                )}
                {paymentStatus.paymentId && (
                  <div className="flex items-center justify-between">
                    <span className="text-white/60">Payment ID</span>
                    <span className="font-mono text-sm">{paymentStatus.paymentId}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {paymentStatus.status !== 'loading' && (
          <div className="flex flex-col gap-4">
            {paymentStatus.status === 'success' && paymentStatus.orderId ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/orders/${paymentStatus.orderId}`)}
                className="flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 font-medium text-black transition-all hover:bg-white/90"
              >
                <Package className="h-4 w-4" />
                View Order Details
                <ArrowRight className="h-4 w-4" />
              </motion.button>
            ) : paymentStatus.status === 'failure' ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/cart')}
                className="flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 font-medium text-black transition-all hover:bg-white/90"
              >
                <CreditCard className="h-4 w-4" />
                Try Again
              </motion.button>
            ) : null}

            <button
              onClick={() => navigate('/')}
              className="rounded-full border border-white/20 px-6 py-3 font-medium transition-colors hover:bg-white/10"
            >
              Continue Shopping
            </button>
          </div>
        )}

        {paymentStatus.status === 'success' && (
          <div className="mt-8 text-sm text-white/60">
            <p>📧 A confirmation email has been sent to your email address</p>
            <p>📱 You can track your order status in the Orders section</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}