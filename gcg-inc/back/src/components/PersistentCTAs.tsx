import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag,
  MessageCircle,
  Phone,
  Mail,
  X,
  Plus,
  Minus,
} from "lucide-react";
import { useSetAtom } from "jotai";
import { addToCartAtom } from "../store/cart";

interface PersistentCTAsProps {
  productId?: string;
  productName?: string;
  productPrice?: number;
  isInStock?: boolean;
  onAddToCart?: () => void;
  className?: string;
}

export default function PersistentCTAs({
  productId,
  productName,
  productPrice,
  isInStock = true,
  onAddToCart,
  className = "",
}: PersistentCTAsProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showCustomerService, setShowCustomerService] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const addToCart = useSetAtom(addToCartAtom);

  useEffect(() => {
    const handleScroll = () => {
      // Show CTAs when user scrolls down more than 300px
      const shouldShow = window.scrollY > 300;
      setIsVisible(shouldShow);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Check initial state

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart();
    } else if (productId && productName && productPrice) {
      addToCart({
        id: productId,
        name: productName,
        price: productPrice,
        quantity,
      });
    }
  };

  const customerServiceOptions = [
    {
      icon: MessageCircle,
      label: "Live Chat",
      action: () => {
        // Integration point for live chat
        console.log("Opening live chat...");
        // You can integrate with services like Intercom, Zendesk, etc.
      },
      description: "Chat with our experts",
    },
    {
      icon: Phone,
      label: "Call Us",
      action: () => window.open("tel:+1-800-123-4567"),
      description: "+1 (800) 123-4567",
    },
    {
      icon: Mail,
      label: "Email Support",
      action: () => window.open("mailto:support@gcg.com"),
      description: "support@gcg.com",
    },
  ];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
          }}
          className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-[95%] max-w-lg ${className}`}
        >
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Add to Cart Section */}
            {productId && (
              <div className="bg-black/90 backdrop-blur-lg border border-white/20 rounded-2xl px-4 py-3 sm:px-6 sm:py-4 shadow-2xl w-full">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
                  {/* Quantity Selector */}
                  <div className="flex items-center border border-white/20 rounded-full">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-2 hover:bg-white/10 transition-colors rounded-l-full"
                      disabled={quantity <= 1}
                    >
                      <Minus className="w-3 h-3 text-white" />
                    </button>
                    <span className="px-3 py-2 min-w-[40px] text-center text-white text-sm">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="p-2 hover:bg-white/10 transition-colors rounded-r-full"
                    >
                      <Plus className="w-3 h-3 text-white" />
                    </button>
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    onClick={handleAddToCart}
                    disabled={!isInStock}
                    className="flex items-center justify-center gap-2 bg-white text-black px-5 py-3 rounded-full font-medium text-sm transition-all hover:bg-white/90 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 w-full sm:w-auto"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    {isInStock ? "Add to Cart" : "Out of Stock"}
                  </button>

                  {/* Price */}
                  {productPrice && (
                    <div className="text-white font-light">
                      <span className="text-lg">
                        ${(productPrice * quantity).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Customer Service Button */}
            <div className="relative">
              <button
                onClick={() => setShowCustomerService(!showCustomerService)}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-full shadow-2xl hover:from-blue-700 hover:to-blue-800 transition-all hover:scale-110 border border-blue-500/20"
                aria-label="Customer Service"
              >
                <MessageCircle className="w-5 h-5" />
              </button>

              {/* Customer Service Options */}
              <AnimatePresence>
                {showCustomerService && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ duration: 0.2 }}
                    className="absolute bottom-16 right-0 w-80 bg-black/95 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl overflow-hidden"
                  >
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white font-medium">Need Help?</h3>
                        <button
                          onClick={() => setShowCustomerService(false)}
                          className="text-white/60 hover:text-white transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-2">
                        {customerServiceOptions.map((option, index) => {
                          const Icon = option.icon;
                          return (
                            <button
                              key={index}
                              onClick={() => {
                                option.action();
                                setShowCustomerService(false);
                              }}
                              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-colors text-left group"
                            >
                              <div className="bg-white/10 p-2 rounded-lg group-hover:bg-white/20 transition-colors">
                                <Icon className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <div className="text-white font-medium text-sm">
                                  {option.label}
                                </div>
                                <div className="text-white/60 text-xs">
                                  {option.description}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      <div className="mt-4 pt-4 border-t border-white/10 text-center">
                        <p className="text-white/60 text-xs">
                          Average response time: 2 minutes
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Alternative simpler version for non-product pages
export function SimplePersistentCTAs({
  className = "",
}: {
  className?: string;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [showCustomerService, setShowCustomerService] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const shouldShow = window.scrollY > 300;
      setIsVisible(shouldShow);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const customerServiceOptions = [
    {
      icon: MessageCircle,
      label: "Live Chat",
      action: () => console.log("Opening live chat..."),
      description: "Chat with our experts",
    },
    {
      icon: Phone,
      label: "Call Us",
      action: () => window.open("tel:+1-800-123-4567"),
      description: "+1 (800) 123-4567",
    },
    {
      icon: Mail,
      label: "Email Support",
      action: () => window.open("mailto:support@gcg.com"),
      description: "support@gcg.com",
    },
  ];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
          }}
          className={`fixed bottom-6 right-6 z-50 ${className}`}
        >
          <div className="relative">
            <button
              onClick={() => setShowCustomerService(!showCustomerService)}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-full shadow-2xl hover:from-blue-700 hover:to-blue-800 transition-all hover:scale-110 border border-blue-500/20"
              aria-label="Customer Service"
            >
              <MessageCircle className="w-6 h-6" />
            </button>

            {/* Customer Service Options */}
            <AnimatePresence>
              {showCustomerService && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  transition={{ duration: 0.2 }}
                  className="absolute bottom-16 right-0 w-80 bg-black/95 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl overflow-hidden"
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-white font-medium">Need Help?</h3>
                      <button
                        onClick={() => setShowCustomerService(false)}
                        className="text-white/60 hover:text-white transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      {customerServiceOptions.map((option, index) => {
                        const Icon = option.icon;
                        return (
                          <button
                            key={index}
                            onClick={() => {
                              option.action();
                              setShowCustomerService(false);
                            }}
                            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-colors text-left group"
                          >
                            <div className="bg-white/10 p-2 rounded-lg group-hover:bg-white/20 transition-colors">
                              <Icon className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <div className="text-white font-medium text-sm">
                                {option.label}
                              </div>
                              <div className="text-white/60 text-xs">
                                {option.description}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-4 pt-4 border-t border-white/10 text-center">
                      <p className="text-white/60 text-xs">
                        Average response time: 2 minutes
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
