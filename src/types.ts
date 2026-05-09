export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  isAdmin?: boolean;
  isDriver?: boolean;
  isOnline?: boolean;
  favorites?: string[];
  phone?: string;
  addresses?: string[];
  driverInfo?: {
    vehicleType?: string;
    licensePlate?: string;
    rating?: number;
    tripsCount?: number;
  };
  payoutInfo?: {
    type: 'bank' | 'momo';
    // Bank fields
    accountHolder?: string;
    bankName?: string;
    accountNumber?: string;
    routingNumber?: string;
    // MoMo fields
    momoNumber?: string;
    momoNetwork?: 'mtn' | 'telecel' | 'at';
    momoName?: string;
  };
}

export interface Restaurant {
  id: string;
  name: string;
  description: string;
  rating: number;
  deliveryTime: string;
  deliveryFee: number;
  imageUrl: string;
  category: string;
  address: string;
  lat?: number;
  lng?: number;
  isFeatured?: boolean;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  isVegetarian?: boolean;
  isSpicy?: boolean;
}

export type OrderStatus = 'pending' | 'preparing' | 'assigned' | 'delivering' | 'completed' | 'cancelled';
export type DeliveryOption = 'Leave at door' | 'Hand to me';

export interface OrderItem {
  id: string;
  restaurantId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

export interface Order {
  id: string;
  userId: string;
  restaurantId: string;
  driverId?: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: any; // ServerTimestamp
  updatedAt?: any;
  address: string;
  lat?: number;
  lng?: number;
  restaurantName?: string;
  restaurantAddress?: string;
  restaurantLat?: number;
  restaurantLng?: number;
  deliveryOption: DeliveryOption;
  instructions?: string;
  isRated?: boolean;
}

export interface Driver {
  id: string;
  name: string;
  photoURL?: string;
  rating?: number;
  phone?: string;
  isOnline?: boolean;
}

export interface Review {
  id: string;
  orderId: string;
  userId: string;
  restaurantId: string;
  driverId?: string;
  rating: number;
  driverRating?: number;
  comment?: string;
  createdAt: any;
}

export interface ChatMessage {
  id: string;
  orderId: string;
  senderId: string;
  text: string;
  createdAt: any;
}

export interface Promotion {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  link?: string;
  active: boolean;
  color?: string;
}
