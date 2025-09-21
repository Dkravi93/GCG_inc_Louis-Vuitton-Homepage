import { useAtom, useSetAtom } from 'jotai';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, ShoppingBag, Truck, Shield, RotateCcw } from 'lucide-react';
import { cartDrawerOpenAtom, cartItemsAtom, cartTotalAtom, removeItemAtom, setQuantityAtom } from '../store/cart';
import { useTheme } from "../contexts/ThemeContext";

const SHIPPING_THRESHOLD = 150;
const SHIPPING_COST = 12.99;

export default function CartDrawer() {
  const [open, setOpen] = useAtom(cartDrawerOpenAtom);
  const [items] = useAtom(cartItemsAtom);
  const [total] = useAtom(cartTotalAtom);
  const { theme } = useTheme();
  const removeItem = useSetAtom(removeItemAtom);
  const setQuantity = useSetAtom(setQuantityAtom);

  const subtotal = total;
  const shipping = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const tax = subtotal * 0.08; // 8% tax
  const finalTotal = subtotal + shipping + tax;
  const freeShippingRemaining = SHIPPING_THRESHOLD - subtotal;

  const updateQuantity = (id: string, delta: number) => {
    const item = items.find(i => i.id === id);
    if (item) {
      const newQuantity = Math.max(1, item.quantity + delta);
      setQuantity({ id, quantity: newQuantity });
    }
  };

  return (
    <AnimatePresence>
      {open && (
      <div className="fixed inset-0 z-50">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={`absolute right-0 top-0 h-full w-full max-w-lg shadow-2xl ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-6">
              <div className="flex items-center gap-3">
                <ShoppingBag className="h-6 w-6" />
                <h2 className="text-2xl font-light">Shopping Bag</h2>
                {items.length > 0 && (
                  <span className="rounded-full px-2 py-1 text-sm">
                    {items.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                )}
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full p-2 hover:bg-white/20 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex h-[calc(100%-120px)] flex-col">
              {/* Cart Items */}
              <div className="flex-1 overflow-auto">
                {items.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center px-6">
                    <div className="rounded-full p-6 mb-6">
                      <ShoppingBag className="h-12 w-12" />
                    </div>
                    <h3 className="text-xl font-light mb-2">Your bag is empty</h3>
                    <p className="text-center mb-8">
                      Discover our premium eyewear collection and find your perfect frames.
                    </p>
                    <Link
                      to="/collections"
                      onClick={() => setOpen(false)}
                      className="rounded-full px-8 py-3 text-black font-medium hover:bg-white/90 transition-colors"
                    >
                      Shop Collections
                    </Link>
                  </div>
                ) : (
                  <div className="px-6 py-6 space-y-6">
                    {/* Free Shipping Progress */}
                    {freeShippingRemaining > 0 && (
                      <div className="rounded-2xl border border-white/10 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Truck className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            Add ${freeShippingRemaining.toFixed(2)} for FREE shipping
                          </span>
                        </div>
                        <div className="w-full rounded-full h-2">
                          <div
                            className="from-green-400 to-green-500 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min((subtotal / SHIPPING_THRESHOLD) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Cart Items List */}
                    {items.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="flex gap-4 rounded-2xl border border-white/10  p-4"
                      >
                        <img
                          src={item.image || `https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=200&h=200&fit=crop&sig=${item.id}`}
                          alt={item.name}
                          className="h-20 w-20 rounded-xl object-cover"
                        />
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-medium truncate">{item.name}</h4>
                              <p className="text-sm">
                                {item.variant ? `${item.variant.color} • ${item.variant.size}` : 'Default'}
                              </p>
                            </div>
                            <button
                              onClick={() => removeItem(item.id)}
                              className="hover:text-red-400 transition-colors"
                              aria-label="Remove item"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => updateQuantity(item.id, -1)}
                                disabled={item.quantity <= 1}
                                className="rounded-full p-1 hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label="Decrease quantity"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              
                              <span className="text-sm font-medium min-w-[2ch] text-center">
                                {item.quantity}
                              </span>
                              
                              <button
                                onClick={() => updateQuantity(item.id, 1)}
                                className="rounded-full p-1 hover:bg-white/20 transition-colors"
                                aria-label="Increase quantity"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                            
                            <div className="text-right">
                              <div className="font-medium">${(item.price * item.quantity).toFixed(2)}</div>
                              {item.quantity > 1 && (
                                <div className="text-xs">${item.price.toFixed(2)} each</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {items.length > 0 && (
                <div className="border-t border-white/10 p-6 space-y-4">
                  {/* Trust Badges */}
                  <div className="grid grid-cols-3 gap-4 text-center text-xs">
                    <div className="flex flex-col items-center gap-1">
                      <Shield className="h-4 w-4" />
                      <span>Secure Payment</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <Truck className="h-4 w-4" />
                      <span>Free Shipping</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <RotateCcw className="h-4 w-4" />
                      <span>Easy Returns</span>
                    </div>
                  </div>

                  {/* Pricing Breakdown */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="">Subtotal</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="">Shipping</span>
                      <span className={shipping === 0 ? 'text-green-400' : ''}>
                        {shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="">Tax</span>
                      <span>${tax.toFixed(2)}</span>
                    </div>
                    
                    <div className="border-t border-white/10 pt-2 flex justify-between text-lg font-medium">
                      <span>Total</span>
                      <span>${finalTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Checkout Button */}
                  <Link
                    to="/checkout"
                    onClick={() => setOpen(false)}
                    className="block w-full border rounded-full from-white to-gray-100 px-6 py-4 text-center font-medium transition-all hover:shadow-lg hover:scale-105 active:scale-95"
                  >
                    Secure Checkout
                  </Link>
                  
                  <p className="text-xs text-center">
                    Tax included. Shipping calculated at checkout.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}


