import React, { useState } from 'react';
import { Plus, Minus, ShoppingBag, Star, X, Trash2, AlertTriangle } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export function CartSidebar() {
  const { items, updateQuantity, removeItem, clearCart, total, isCartOpen, setIsCartOpen } = useCart();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleClearCart = () => {
    clearCart();
    setShowClearConfirm(false);
    toast.success("Cart cleared", {
      description: "Starting fresh!",
    });
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setIsCartOpen(false);
              setShowClearConfirm(false);
            }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full z-50 bg-[#161616] text-white shadow-2xl border-l border-white/10 w-full sm:max-w-md overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="bg-brand p-2.5 rounded-2xl text-white shadow-lg shadow-brand/20">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black italic uppercase tracking-tighter text-xl leading-tight">Cart Review</h3>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">{items.reduce((acc, i) => acc + i.quantity, 0)} Items</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsCartOpen(false);
                  setShowClearConfirm(false);
                }}
                className="p-2.5 hover:bg-white/5 rounded-full transition-all text-gray-500 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-10">
                  <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 ring-1 ring-white/10">
                    <ShoppingBag className="w-10 h-10 text-white/10" />
                  </div>
                  <h4 className="text-2xl font-black italic uppercase tracking-tighter mb-3">Your cart is empty</h4>
                  <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] leading-relaxed">
                    Looks like you haven't added any gourmet dishes yet.
                  </p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {items.map((item) => (
                    <motion.div 
                      key={item.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex items-center gap-5 group py-1"
                    >
                      <div className="relative w-20 h-20 shrink-0 rounded-[1.5rem] overflow-hidden shadow-2xl ring-1 ring-white/10">
                        <img 
                          src={item.imageUrl} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                          referrerPolicy="no-referrer"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/20" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-base font-black uppercase italic tracking-tighter truncate group-hover:text-brand transition-colors">{item.name}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-sm font-black text-white/40">${item.price}</p>
                          <button 
                            onClick={() => removeItem(item.id)}
                            className="p-1 text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 bg-white/5 rounded-2xl px-4 py-2.5 border border-white/10 shadow-inner">
                        <button 
                          onClick={() => updateQuantity(item.id, -1)}
                          className="text-gray-400 hover:text-brand transition-colors active:scale-75"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="text-base font-black italic w-6 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, 1)}
                          className="text-gray-400 hover:text-brand transition-colors active:scale-75"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-8 bg-white/[0.03] border-t border-white/5 backdrop-blur-xl relative">
                <AnimatePresence>
                  {showClearConfirm && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-[60] flex items-center justify-center p-6"
                    >
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowClearConfirm(false)}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                      />
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative bg-[#1a1a1a] border border-white/10 rounded-[2.5rem] p-10 max-w-sm w-full shadow-2xl text-center"
                      >
                        <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 text-red-500">
                          <Trash2 className="w-10 h-10" />
                        </div>
                        <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-4">Clear Entire Cart?</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-10 leading-relaxed px-4">
                          All your selected gourmet dishes will be removed from the cart.
                        </p>
                        <div className="flex flex-col gap-3">
                          <button 
                            id="confirm-clear-cart"
                            onClick={handleClearCart}
                            className="w-full py-5 bg-red-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-red-600 transition-all shadow-xl shadow-red-500/20"
                          >
                            Clear Cart
                          </button>
                          <button 
                            id="cancel-clear-cart"
                            onClick={() => setShowClearConfirm(false)}
                            className="w-full py-5 bg-white/5 text-gray-400 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex justify-between items-end mb-8">
                  <div className="text-left">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 block mb-2">Total Amount</span>
                    <span className="text-4xl font-black italic tracking-tighter text-white tabular-nums">${total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowClearConfirm(true)}
                    className="p-5 bg-white/5 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-[1.5rem] transition-all border border-white/10 group flex items-center justify-center"
                    title="Clear Cart"
                  >
                    <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </button>
                  <Link 
                    to="/checkout"
                    onClick={() => setIsCartOpen(false)}
                    className="flex-1 flex items-center justify-between bg-brand text-white px-8 py-5 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[10px] hover:bg-red-600 transition-all hover:shadow-[0_20px_40px_-8px_rgba(239,68,68,0.4)] active:scale-[0.98] group"
                  >
                    <span>Review & Checkout</span>
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                  </Link>
                </div>
                
                <div className="mt-6 flex items-center justify-center gap-3 opacity-30">
                  <Star className="w-3 h-3 fill-white" />
                  <span className="text-[8px] font-black uppercase tracking-[0.4em]">Premium Delivery Only</span>
                  <Star className="w-3 h-3 fill-white" />
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
