import { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Smartphone, Wallet, Building2, Check, Loader } from 'lucide-react';
import { ordersApi } from '../lib/api';
import { useAtom } from 'jotai';
import { clearCartAtom } from '../store/cart';

interface PayUCheckoutProps {
  orderData: {
    items: Array<{
      product: string;
      variant: { color: string; size: string; sku: string };
      quantity: number;
      price: number;
    }>;
    shippingAddress: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    billingAddress: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    phone: string;
    notes?: string;
  };
  total: number;
  onSuccess?: (orderId: string) => void;
  onError?: (error: string) => void;
}

type PaymentMethod = 'credit_card' | 'debit_card' | 'upi' | 'net_banking' | 'wallet';

const PAYMENT_METHODS = [
  {
    id: 'credit_card' as PaymentMethod,
    name: 'Credit Card',
    icon: CreditCard,
    description: 'Visa, MasterCard, American Express'
  },
  {
    id: 'debit_card' as PaymentMethod,
    name: 'Debit Card',
    icon: CreditCard,
    description: 'All major debit cards'
  },
  {
    id: 'upi' as PaymentMethod,
    name: 'UPI',
    icon: Smartphone,
    description: 'PhonePe, Google Pay, Paytm'
  },
  {
    id: 'net_banking' as PaymentMethod,
    name: 'Net Banking',
    icon: Building2,
    description: 'All major banks'
  },
  {
    id: 'wallet' as PaymentMethod,
    name: 'Wallet',
    icon: Wallet,
    description: 'Paytm, MobiKwik, Freecharge'
  }
];

export default function PayUCheckout({ orderData, total, onError }: PayUCheckoutProps) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('credit_card');
  const [processing, setProcessing] = useState(false);
  const [orderCreated, setOrderCreated] = useState(false);
  const clearCart = useAtom(clearCartAtom)[1];

  const handlePayment = async () => {
    try {
      setProcessing(true);

      // Validate order data
      if (!orderData.items || orderData.items.length === 0) {
        throw new Error('No items in order');
      }

      if (total <= 0) {
        throw new Error('Invalid order total');
      }

      // Create order with selected payment method
      const orderPayload = {
        ...orderData,
        paymentMethod: selectedPaymentMethod,
        phone: orderData.phone || '9999999999'
      };

      console.log('Creating order with payload:', orderPayload);

      const response = await ordersApi.createOrder(orderPayload);
      
      console.log('Order created successfully:', response);

      if (response.paymentRequest && response.paymentUrl) {
        setOrderCreated(true);
        
        // Create a form and submit it to PayU
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = response.paymentUrl;
        
        // Add all PayU parameters as hidden inputs
        Object.keys(response.paymentRequest).forEach(key => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = response.paymentRequest[key];
          form.appendChild(input);
        });
        
        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);

        // Clear the cart since order is created
        clearCart();
        
        // Note: onSuccess will be called after PayU redirects back
        // The actual success handling happens in PaymentSuccessPage
      } else {
        throw new Error('Invalid payment response from server');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Payment failed. Please try again.';
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Payment Method Selection */}
      <div>
        <h3 className="text-lg font-medium mb-4">Choose Payment Method</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PAYMENT_METHODS.map((method) => {
            const Icon = method.icon;
            const isSelected = selectedPaymentMethod === method.id;
            
            return (
              <button
                key={method.id}
                onClick={() => setSelectedPaymentMethod(method.id)}
                className={`relative rounded-xl border p-4 text-left transition-all hover:scale-105 ${
                  isSelected
                    ? 'border-white/40 bg-white/10'
                    : 'border-white/20 bg-white/5 hover:border-white/30'
                }`}
                disabled={processing}
              >
                <div className="flex items-center gap-4">
                  <div className={`rounded-lg p-3 ${
                    isSelected ? 'bg-white text-black' : 'bg-white/10'
                  }`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="font-medium">{method.name}</div>
                    <div className="text-sm">{method.description}</div>
                  </div>
                </div>
                {isSelected && (
                  <div className="absolute top-4 right-4">
                    <div className="rounded-full bg-green-500 p-1">
                      <Check className="h-3 w-3" />
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Order Summary */}
      <div className="rounded-xl border border-white/20 bg-white/5 p-6">
        <h3 className="text-lg font-medium mb-4">Order Summary</h3>
        <div className="space-y-2 mb-4">
          {orderData.items.map((item, index) => (
            <div key={index} className="flex justify-between text-sm">
              <span className="">
                Item {index + 1} × {item.quantity}
              </span>
              <span className="text-white">₹{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-white/20 pt-4">
          <div className="flex justify-between text-lg font-medium">
            <span className="">Total</span>
            <span className="">₹{total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Payment Button */}
      <motion.button
        whileHover={{ scale: processing ? 1 : 1.02 }}
        whileTap={{ scale: processing ? 1 : 0.98 }}
        onClick={handlePayment}
        disabled={processing || orderCreated}
        className={`w-full border flex items-center justify-center gap-3 rounded-full px-8 py-4 font-medium text-lg transition-all ${
          processing || orderCreated
            ? 'bg-white/20 cursor-not-allowed'
            : 'bg-white text-black hover:bg-white/90'
        }`}
      >
        {processing ? (
          <>
            <Loader className="w-5 h-5 animate-spin" />
            {orderCreated ? 'Redirecting to Payment...' : 'Creating Order...'}
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            Pay ₹{total.toFixed(2)}
          </>
        )}
      </motion.button>

      {/* Security Notice */}
      <div className="text-center text-sm">
        <p>🔒 Your payment is secured by PayU</p>
        <p>All transactions are encrypted and secure</p>
      </div>
    </div>
  );
}