import { useLocation, Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { XCircle, AlertTriangle, RefreshCcw, ArrowLeft, HelpCircle, Loader } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function CheckoutFailurePage() {
  const location = useLocation();
  interface ErrorData {
    errorMessage: string;
    errorCode: string;
  }
  
  const [errorData, setErrorData] = useState<ErrorData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Get parameters from URL
  const searchParams = new URLSearchParams(location.search);
  // const orderId = searchParams.get('orderId');
  const errorFromUrl = searchParams.get('error');

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        // Set default error data
        setErrorData({
          errorMessage: errorFromUrl || 'Payment processing failed. Please try again later.',
          errorCode: 'PAYMENT_FAILED'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrderDetails();
  }, [errorFromUrl]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-12 w-12 text-white/60 animate-spin mx-auto mb-4" />
          <p className="text-lg text-white/80">Processing payment information...</p>
        </div>
      </div>
    );
  }

  if (!errorData) {
    return <Navigate to="/" replace />;
  }

  const { errorMessage, errorCode } = errorData;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-4xl px-6 py-16">
        {/* Failure Animation */}
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
            className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-red-500"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              <XCircle className="h-12 w-12 text-white" />
            </motion.div>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-6xl font-extralight mb-4"
          >
            Payment Failed
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-white/70 mb-2"
          >
            We couldn't process your payment
          </motion.p>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-white/60"
          >
            Error code: <span className="font-medium text-white">{errorCode}</span>
          </motion.p>
        </div>

        {/* Error Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="h-6 w-6 text-red-400" />
            <h2 className="text-xl font-light">Error Details</h2>
          </div>
          <p className="text-white/70">{errorMessage}</p>
        </motion.div>

        {/* What to Do Next */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="rounded-2xl border border-white/10 bg-white/5 p-8 mb-8"
        >
          <h2 className="text-2xl font-light mb-6">What to Do Next?</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="rounded-full bg-white/10 p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <RefreshCcw className="h-8 w-8" />
              </div>
              <h3 className="font-medium mb-2">Try Again</h3>
              <p className="text-sm text-white/60">
                Double-check your payment details and try the purchase again.
              </p>
            </div>
            
            <div className="text-center">
              <div className="rounded-full bg-white/10 p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <HelpCircle className="h-8 w-8" />
              </div>
              <h3 className="font-medium mb-2">Contact Support</h3>
              <p className="text-sm text-white/60">
                Our support team is here to help resolve any issues.
              </p>
            </div>
            
            <div className="text-center">
              <div className="rounded-full bg-white/10 p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <AlertTriangle className="h-8 w-8" />
              </div>
              <h3 className="font-medium mb-2">Check Status</h3>
              <p className="text-sm text-white/60">
                Verify your payment status with your bank.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col md:flex-row gap-4 justify-center items-center"
        >
          <Link
            to="/checkout"
            className="rounded-full bg-white px-8 py-3 font-medium text-black transition-all hover:bg-white/90 hover:scale-105"
          >
            Try Again
          </Link>
          
          <Link
            to="/support"
            className="rounded-full border border-white/20 px-8 py-3 font-medium transition-colors hover:bg-white/10"
          >
            Contact Support
          </Link>
        </motion.div>

        {/* Back to Cart */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="text-center mt-12"
        >
          <Link
            to="/cart"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Cart
          </Link>
        </motion.div>
      </div>
    </div>
  );
}