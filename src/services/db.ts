import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  addDoc, 
  updateDoc, 
  setDoc,
  serverTimestamp,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Restaurant, MenuItem, Order, OrderItem, UserProfile, Promotion, Driver, OrderStatus, Review, ChatMessage } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const dbService = {
  // Promotions
  async getPromotions(): Promise<Promotion[]> {
    const path = 'promotions';
    try {
      const q = query(collection(db, path), where('active', '==', true));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Promotion));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  // Drivers
  async getDriver(id: string): Promise<Driver | null> {
    const path = `drivers/${id}`;
    try {
      const docRef = doc(db, 'drivers', id);
      const snapshot = await getDoc(docRef);
      return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } as Driver : null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  },

  // Restaurants
  async getRestaurants(): Promise<Restaurant[]> {
    const path = 'restaurants';
    try {
      const q = query(collection(db, path), orderBy('name'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Restaurant));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  async getRestaurant(id: string): Promise<Restaurant | null> {
    const path = `restaurants/${id}`;
    try {
      const docRef = doc(db, 'restaurants', id);
      const snapshot = await getDoc(docRef);
      return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } as Restaurant : null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  },

  // Menu Items
  async getMenuItems(restaurantId: string): Promise<MenuItem[]> {
    const path = 'menu';
    try {
      const q = query(collection(db, path), where('restaurantId', '==', restaurantId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  // Orders
  async createOrder(
    userId: string, 
    restaurantId: string, 
    items: OrderItem[], 
    total: number, 
    address: string, 
    deliveryOption: string, 
    instructions?: string,
    restaurantName?: string,
    restaurantAddress?: string,
    restaurantLat?: number,
    restaurantLng?: number
  ): Promise<string> {
    const path = 'orders';
    try {
      const orderData = {
        userId,
        restaurantId,
        restaurantName: restaurantName || '',
        restaurantAddress: restaurantAddress || '',
        restaurantLat: restaurantLat || 0,
        restaurantLng: restaurantLng || 0,
        // Default customer delivery coords (central Accra for demo)
        lat: 5.6037,
        lng: -0.1870,
        items,
        total,
        address,
        deliveryOption,
        instructions: instructions || '',
        status: 'pending',
        createdAt: serverTimestamp(),
        isRated: false
      };
      const docRef = await addDoc(collection(db, path), orderData);
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      return '';
    }
  },

  async submitReview(
    userId: string, 
    restaurantId: string, 
    rating: number, 
    orderId?: string, 
    driverId?: string, 
    driverRating?: number,
    comment?: string
  ): Promise<void> {
    const path = 'reviews';
    try {
      // 1. Create review record
      const reviewData: any = {
        userId,
        restaurantId,
        rating,
        comment: comment || '',
        createdAt: serverTimestamp()
      };

      if (orderId) reviewData.orderId = orderId;
      if (driverId) reviewData.driverId = driverId;
      if (driverRating) reviewData.driverRating = driverRating;

      await addDoc(collection(db, path), reviewData);

      // 2. Mark order as rated if applicable
      if (orderId) {
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, { isRated: true });
      }

      // 3. Update driver rating (demo aggregation logic)
      if (driverId && driverRating) {
        const driverRef = doc(db, 'drivers', driverId);
        const driverSnap = await getDoc(driverRef);
        if (driverSnap.exists()) {
          const currentRating = driverSnap.data().rating || 5.0;
          // Simplified moving average for demo
          const newRating = Number(((currentRating * 5 + driverRating) / 6).toFixed(1));
          await updateDoc(driverRef, { rating: newRating });
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  async getUserOrders(userId: string): Promise<Order[]> {
    const path = 'orders';
    try {
      const q = query(
        collection(db, path), 
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  // Real-time subscriptions
  subscribeToUserOrders(userId: string, callback: (orders: Order[]) => void) {
    const path = 'orders';
    const q = query(
      collection(db, path),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      callback(orders);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  },

  subscribeToDriverOrders(driverId: string, callback: (orders: Order[]) => void) {
    const path = 'orders';
    const q = query(
      collection(db, path),
      where('driverId', '==', driverId),
      orderBy('updatedAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      callback(orders);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  },

  subscribeToAvailableOrders(callback: (orders: Order[]) => void) {
    const path = 'orders';
    const q = query(
      collection(db, path),
      where('status', 'in', ['pending', 'preparing']),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      callback(orders.filter(o => !o.driverId));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  },

  subscribeToActiveDriverOrders(driverId: string, callback: (orders: Order[]) => void) {
    const path = 'orders';
    const q = query(
      collection(db, path),
      where('driverId', '==', driverId),
      where('status', 'in', ['assigned', 'delivering'])
    );

    return onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      callback(orders);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  },

  subscribeToOrder(orderId: string, callback: (order: Order | null) => void) {
    const path = `orders/${orderId}`;
    const docRef = doc(db, 'orders', orderId);

    return onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        callback({ id: snapshot.id, ...snapshot.data() } as Order);
      } else {
        callback(null);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  },

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
    const path = `orders/${orderId}`;
    try {
      const docRef = doc(db, 'orders', orderId);
      await updateDoc(docRef, { 
        status,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  // User Profile
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const path = `users/${uid}`;
    try {
      const docRef = doc(db, 'users', uid);
      const snapshot = await getDoc(docRef);
      return snapshot.exists() ? snapshot.data() as UserProfile : null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  },

  async updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
    const path = `users/${uid}`;
    try {
      const docRef = doc(db, 'users', uid);
      await setDoc(docRef, data, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async toggleFavorite(uid: string, restaurantId: string, isFavorite: boolean): Promise<void> {
    const path = `users/${uid}`;
    try {
      const { arrayUnion, arrayRemove } = await import('firebase/firestore');
      const docRef = doc(db, 'users', uid);
      await updateDoc(docRef, {
        favorites: isFavorite ? arrayUnion(restaurantId) : arrayRemove(restaurantId)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async getFavoriteRestaurants(restaurantIds: string[]): Promise<Restaurant[]> {
    if (!restaurantIds || restaurantIds.length === 0) return [];
    
    const path = 'restaurants';
    try {
      // Note: in queries are limited to 10 items. For a real app we'd fetch in chunks if needed.
      // But for this scale, 10 is usually enough or we fetch all and filter.
      // Let's fetch all and filter to avoid the 10 item limit for simplicity in this demo.
      const restaurants = await this.getRestaurants();
      return restaurants.filter(r => restaurantIds.includes(r.id));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  async setUserAdmin(uid: string, isAdmin: boolean): Promise<void> {
    const path = `users/${uid}`;
    try {
      const docRef = doc(db, 'users', uid);
      const profileData: any = { uid, isAdmin };
      if (auth.currentUser?.email) profileData.email = auth.currentUser.email;
      if (auth.currentUser?.displayName) profileData.displayName = auth.currentUser.displayName;
      if (auth.currentUser?.photoURL) profileData.photoURL = auth.currentUser.photoURL;
      
      await setDoc(docRef, profileData, { merge: true });
      if (isAdmin) {
        await setDoc(doc(db, 'admins', uid), { active: true });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async setUserDriver(uid: string, name: string): Promise<void> {
    const path = `drivers/${uid}`;
    try {
      // 1. Create driver document
      const docRef = doc(db, 'drivers', uid);
      await setDoc(docRef, { 
        name,
        photoURL: auth.currentUser?.photoURL || '',
        rating: 5.0,
        createdAt: serverTimestamp(),
        isOnline: false
      });

      // 2. Sync to user profile
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        isDriver: true,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async assignDriverToOrder(orderId: string, driverId: string): Promise<void> {
    const path = `orders/${orderId}`;
    try {
      const docRef = doc(db, 'orders', orderId);
      await updateDoc(docRef, {
        status: 'assigned',
        driverId,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async deleteRestaurant(id: string): Promise<void> {
    const path = `restaurants/${id}`;
    try {
      const docRef = doc(db, 'restaurants', id);
      const { deleteDoc } = await import('firebase/firestore');
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  async updateRestaurant(id: string, data: Partial<Restaurant>): Promise<void> {
    const path = `restaurants/${id}`;
    try {
      const docRef = doc(db, 'restaurants', id);
      await updateDoc(docRef, data);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async createRestaurant(data: Omit<Restaurant, 'id'>): Promise<string> {
    const path = 'restaurants';
    try {
      const docRef = await addDoc(collection(db, path), data);
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      return '';
    }
  },

  // Reviews
  async getRestaurantReviews(restaurantId: string): Promise<Review[]> {
    const path = 'reviews';
    try {
      const q = query(
        collection(db, path), 
        where('restaurantId', '==', restaurantId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  // Menu Items
  async createMenuItem(data: Omit<MenuItem, 'id'>): Promise<string> {
    const path = 'menu';
    try {
      const docRef = await addDoc(collection(db, path), data);
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      return '';
    }
  },

  async updateMenuItem(id: string, data: Partial<MenuItem>): Promise<void> {
    const path = `menu/${id}`;
    try {
      const docRef = doc(db, 'menu', id);
      await updateDoc(docRef, data);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async deleteMenuItem(id: string): Promise<void> {
    const path = `menu/${id}`;
    try {
      const docRef = doc(db, 'menu', id);
      const { deleteDoc } = await import('firebase/firestore');
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  async deleteOrder(id: string): Promise<void> {
    const path = `orders/${id}`;
    try {
      const docRef = doc(db, 'orders', id);
      const { deleteDoc } = await import('firebase/firestore');
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  async clearAllOrders(): Promise<void> {
    const path = 'orders';
    try {
      const snapshot = await getDocs(collection(db, path));
      const { deleteDoc } = await import('firebase/firestore');
      const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, path, d.id)));
      await Promise.all(deletePromises);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  async updateDriverStatus(uid: string, isOnline: boolean): Promise<void> {
    const path = `drivers/${uid}`;
    try {
      const docRef = doc(db, 'drivers', uid);
      await updateDoc(docRef, { isOnline });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  // Chat
  async sendChatMessage(orderId: string, senderId: string, text: string): Promise<void> {
    const path = 'messages';
    try {
      const messageData = {
        orderId,
        senderId,
        text,
        createdAt: serverTimestamp()
      };
      await addDoc(collection(db, path), messageData);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  subscribeToChatMessages(orderId: string, callback: (messages: ChatMessage[]) => void) {
    const path = 'messages';
    const q = query(
      collection(db, path),
      where('orderId', '==', orderId),
      orderBy('createdAt', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage));
      callback(messages);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  },

  async clearDriverOrders(driverId: string): Promise<void> {
    const path = 'orders';
    try {
      const q = query(collection(db, path), where('driverId', '==', driverId), where('status', '==', 'completed'));
      const snapshot = await getDocs(q);
      const { deleteDoc } = await import('firebase/firestore');
      const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, path, d.id)));
      await Promise.all(deletePromises);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }
};
