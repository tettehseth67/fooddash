import React, { useState, useEffect } from 'react';
import { dbService } from '../services/db';
import { useAuth } from '../contexts/AuthContext';
import { Order } from '../types';
import { motion } from 'motion/react';
import { Clock as ClockIcon, CheckCircle2, ChevronRight, Package as PackageIcon, RotateCcw, Star, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { ReviewModal } from '../components/ReviewModal';
import { toast } from 'sonner';

export function OrdersPage() {
  const { user, signIn } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
  const [selectedOrderForReview, setSelectedOrderForReview] = useState<Order | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const unsubscribe = dbService.subscribeToUserOrders(user.uid, (data) => {
      setOrders(data);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedOrders(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleReorder = (order: Order, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    order.items.forEach(item => {
      for (let i = 0; i < item.quantity; i++) {
        addItem({ ...item, quantity: 1 });
      }
    });
    navigate('/checkout');
  };

  const handleDeleteOrder = async (orderId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    toast.error('Delete Order', {
      description: 'Are you sure you want to remove this order from your history?',
      action: {
        label: 'Delete',
        onClick: async () => {
          try {
            await dbService.deleteOrder(orderId);
            toast.success('Order deleted');
          } catch (error) {
            console.error('Deletion failed:', error);
            toast.error('Failed to delete order', {
              description: 'Something went wrong. Please try again.'
            });
          }
        }
      },
    });
  };

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="mb-6 bg-orange-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
          <PackageIcon className="w-10 h-10 text-orange-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Your Orders</h1>
        <p className="text-gray-500 mb-8">Please sign in to view your order history.</p>
        <button 
          onClick={signIn}
          className="bg-orange-500 text-white px-8 py-3 rounded-full font-bold hover:bg-orange-600 transition-all"
        >
          Sign In
        </button>
      </div>
    );
  }

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-12 flex justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 md:py-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-12">
        <div>
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 mb-2 tracking-tighter">Your Orders</h1>
          <p className="text-gray-500 font-medium italic">Track, repeat, and manage your delicious journeys.</p>
        </div>
        <div className="bg-orange-50 px-4 py-2 rounded-2xl border border-orange-100 hidden sm:block">
           <span className="text-xs font-black uppercase tracking-widest text-orange-600">{orders.length} TOTAL ORDERS</span>
        </div>
      </div>
      
      {orders.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] p-12 md:p-20 text-center border-2 border-dashed border-gray-100 shadow-soft">
          <div className="w-24 h-24 bg-surface rounded-full flex items-center justify-center mx-auto mb-8">
            <PackageIcon className="w-12 h-12 text-gray-200" />
          </div>
          <h3 className="text-3xl font-black text-[#191919] mb-3 uppercase tracking-tighter italic">Hungry? No orders yet!</h3>
          <p className="text-gray-400 font-medium mb-10 max-w-sm mx-auto italic">Your future delicious meals will appear here. Start exploring our top-rated restaurants!</p>
          <Link to="/" className="inline-block bg-[#191919] text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-brand transition-all shadow-xl shadow-gray-100">
             Explore Restaurants
          </Link>
        </div>
      ) : (
        <div className="space-y-12">
          {orders.map((order, idx) => (
            <motion.div 
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-gray-100 shadow-soft hover:shadow-card transition-all duration-500 group"
            >
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-6 mb-10">
                <div className="flex items-center space-x-6">
                  <div className="w-16 h-16 rounded-2xl bg-surface flex flex-col items-center justify-center border border-gray-100 group-hover:bg-red-50 group-hover:border-brand/10 transition-colors">
                     <span className="text-[10px] font-black text-gray-300 uppercase leading-none mb-1">Order</span>
                     <span className="text-lg font-black text-[#191919] italic tracking-tighter">#{order.id.slice(-4).toUpperCase()}</span>
                  </div>
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-md ${
                        order.status === 'completed' ? 'bg-emerald-500 text-white' : 
                        order.status === 'cancelled' ? 'bg-gray-100 text-gray-400' : 
                        'bg-brand text-white'
                      }`}>
                        {order.status}
                      </span>
                      {order.isRated && (
                        <span className="flex items-center space-x-1.5 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                           <CheckCircle2 className="w-3.5 h-3.5" />
                           <span>Verified</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-brand font-black uppercase tracking-wider">
                      {order.createdAt?.toDate ? format(order.createdAt.toDate(), 'PPP p') : 'Processing...'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end bg-surface sm:bg-transparent p-6 sm:p-0 rounded-3xl sm:rounded-none border border-gray-100 sm:border-0 italic tracking-tighter">
                  <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Receipt Total</span>
                  <span className="text-4xl font-black text-[#191919]">${order.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Status Progress Bar */}
              <div className="mb-8 px-2">
                <div className="flex justify-between mb-2">
                  {['pending', 'preparing', 'delivering', 'completed'].map((step, sIdx) => {
                    const statusOrder = ['pending', 'preparing', 'delivering', 'completed', 'cancelled'];
                    const currentIdx = statusOrder.indexOf(order.status);
                    const stepIdx = statusOrder.indexOf(step);
                    const isActive = order.status === 'cancelled' ? false : currentIdx >= stepIdx;
                    const isCurrent = order.status === step;

                    return (
                      <div key={step} className="flex flex-col items-center flex-1 relative">
                        <div className={`w-3 h-3 rounded-full z-10 transition-colors duration-500 ${
                          isActive ? 'bg-orange-500' : 'bg-gray-200'
                        } ${isCurrent ? 'ring-4 ring-orange-100' : ''}`} />
                        <span className={`text-[8px] font-black uppercase tracking-tighter mt-2 text-center transition-colors ${
                          isActive ? 'text-orange-500' : 'text-gray-300'
                        }`}>
                          {step}
                        </span>
                        {sIdx < 3 && (
                          <div className={`absolute left-[50%] top-1.5 w-full h-0.5 -z-0 transition-colors duration-500 ${
                            currentIdx > stepIdx ? 'bg-orange-500' : 'bg-gray-100'
                          }`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Collapsed View Summary */}
              {!expandedOrders[order.id] && (
                <div 
                  onClick={(e) => toggleExpand(order.id, e)}
                  className="bg-gray-50/50 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:bg-orange-50 transition-all border border-transparent hover:border-orange-100"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex -space-x-3 overflow-hidden">
                      {order.items.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="w-10 h-10 rounded-xl border-2 border-white overflow-hidden shadow-sm">
                           <img 
                            src={item.imageUrl} 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <div className="w-10 h-10 rounded-xl border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-500">
                          +{order.items.length - 3}
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 font-bold">
                       {order.items.length} items • <span className="font-medium">{order.items[0].name}{order.items.length > 1 ? '...' : ''}</span>
                    </div>
                  </div>
                  <div className="text-orange-500 flex items-center space-x-1 text-xs font-black uppercase tracking-widest">
                    <span>Details</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              )}

              {/* Expanded View Details */}
              {expandedOrders[order.id] && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mb-4 overflow-hidden"
                >
                  <div className="space-y-6 pt-2">
                    <div className="flex flex-wrap gap-3">
                      <div className="flex items-center space-x-3 p-4 bg-orange-50/50 rounded-2xl border border-orange-100 flex-1 min-w-[200px]">
                        <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center text-orange-500">
                           <PackageIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[8px] font-black uppercase tracking-widest text-orange-400 mb-0.5">Delivery Preference</p>
                          <span className="text-[10px] font-black text-[#191919] uppercase italic">{order.deliveryOption}</span>
                        </div>
                      </div>
                      
                      {order.instructions && (
                        <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 flex-1 min-w-[200px]">
                          <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400">
                             <ClockIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Note to Driver</p>
                            <span className="text-[10px] font-bold text-gray-600 block line-clamp-1 italic">"{order.instructions}"</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-1 h-4 bg-brand rounded-full" />
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-[#191919]">Ordered Items ({order.items.length})</h4>
                      </div>
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center bg-gray-50/50 p-4 rounded-3xl border border-gray-100 hover:border-brand/20 hover:shadow-soft transition-all group/item">
                          <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-soft shrink-0 border border-white">
                            <img 
                              src={item.imageUrl} 
                              className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-700" 
                              referrerPolicy="no-referrer" 
                            />
                          </div>
                          <div className="flex-1 ml-4 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="text-sm font-black text-[#191919] uppercase italic tracking-tighter truncate group-hover/item:text-brand transition-colors">{item.name}</h5>
                              <div className="flex flex-col items-end">
                                <span className="text-sm font-black text-[#191919] tracking-tighter">${(item.price * item.quantity).toFixed(2)}</span>
                                <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest">Total</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between bg-white/50 p-2 rounded-xl border border-gray-100">
                              <div className="flex items-center space-x-4">
                                <div className="flex flex-col">
                                  <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Unit Price</span>
                                  <span className="text-[10px] font-black text-[#191919]">${item.price.toFixed(2)}</span>
                                </div>
                                <div className="w-px h-6 bg-gray-100" />
                                <div className="flex flex-col">
                                  <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Quantity</span>
                                  <span className="text-[10px] font-black text-[#191919]">× {item.quantity}</span>
                                </div>
                              </div>
                              <div className="px-3 py-1 bg-[#191919] text-white rounded-lg">
                                <span className="text-[8px] font-black uppercase tracking-widest">Confirmed</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="bg-gray-100/50 p-6 rounded-[2rem] border border-gray-100 mt-6">
                       <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Subtotal</span>
                          <span className="text-sm font-black text-[#191919] tracking-tighter">${order.total.toFixed(2)}</span>
                       </div>
                       <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Delivery Fee</span>
                          <span className="text-xs font-black text-emerald-500 uppercase tracking-widest">Free</span>
                       </div>
                    </div>

                    <button 
                      onClick={(e) => toggleExpand(order.id, e)}
                      className="w-full py-4 text-[10px] font-black text-gray-400 hover:text-brand transition-colors uppercase tracking-[0.2em] italic border-t border-gray-50 mt-4"
                    >
                      Collapse Details
                    </button>
                  </div>
                </motion.div>
              )}
              
              <div className="mt-6 pt-4 border-t border-gray-50 flex justify-between items-center">
                <Link 
                  to={`/track/${order.id}`}
                  className="text-orange-500 font-black text-xs uppercase tracking-widest hover:underline"
                >
                  Track Status
                </Link>
                
                <div className="flex items-center space-x-3">
                  {order.status === 'completed' && !order.isRated && (
                    <button 
                      onClick={() => setSelectedOrderForReview(order)}
                      className="flex items-center space-x-2 text-sm font-black text-emerald-600 hover:text-white transition-all px-6 py-2.5 bg-emerald-50 rounded-2xl hover:bg-emerald-500 border border-transparent hover:border-emerald-600 shadow-sm"
                    >
                      <Star className="w-4 h-4 fill-current" />
                      <span>Rate Experience</span>
                    </button>
                  )}
                  <button 
                    onClick={(e) => handleReorder(order, e)}
                    className="flex items-center space-x-2 text-sm font-black text-gray-700 hover:text-orange-500 transition-all px-6 py-2.5 bg-gray-50 rounded-2xl hover:bg-orange-50 border border-transparent hover:border-orange-100"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Repeat Order</span>
                  </button>
                  <button 
                    onClick={(e) => handleDeleteOrder(order.id, e)}
                    className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all border border-transparent hover:border-red-100"
                    title="Delete Order"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {selectedOrderForReview && (
        <ReviewModal
          order={selectedOrderForReview}
          isOpen={!!selectedOrderForReview}
          onClose={() => setSelectedOrderForReview(null)}
          onSuccess={() => setSelectedOrderForReview(null)}
        />
      )}
    </div>
  );
}
