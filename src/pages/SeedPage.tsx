import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useState } from 'react';
import { dbService } from '../services/db';
import { useAuth } from '../contexts/AuthContext';

const MOCK_RESTAURANTS = [
  {
    name: "Burger Haven",
    description: "The best juicy burgers and gourmet fries in town.",
    category: "Burger",
    address: "123 Burger Lane, Food District, FD 45678",
    rating: 4.8,
    deliveryTime: "20-30 min",
    deliveryFee: 1.99,
    lat: 5.6042,
    lng: -0.1871,
    imageUrl: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=800&q=80",
    menu: [
      { name: "Classic Cheeseburger", price: 12.99, description: "Angus beef, cheddar, lettuce, tomato, special sauce.", imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80", category: "Burgers" },
      { name: "Truffle Mushroom Burger", price: 15.99, description: "Burger with sautéed mushrooms and truffle aioli.", imageUrl: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=400&q=80", category: "Burgers" },
      { name: "Spicy Jalapeno Burger", price: 14.99, description: "Beef patty with melted pepper jack cheese and jalapeños.", imageUrl: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=400&q=80", category: "Burgers", isSpicy: true },
      { name: "Loaded Fries", price: 6.99, description: "Crispy fries with cheese sauce, bacon, and chives.", imageUrl: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=400&q=80", category: "Sides" },
      { name: "Onion Rings", price: 5.99, description: "Beer-battered onion rings with ranch dip.", imageUrl: "https://images.unsplash.com/photo-1639024471283-035188801981?auto=format&fit=crop&w=400&q=80", category: "Sides", isVegetarian: true },
      { name: "Vanilla Milkshake", price: 5.50, description: "Classic Madagascar vanilla bean shake.", imageUrl: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=400&q=80", category: "Drinks", isVegetarian: true }
    ]
  },
  {
    name: "Pizza Palace",
    description: "Authentic wood-fired Neapolitan pizza.",
    category: "Pizza",
    address: "456 Napoli Way, Little Italy, LI 12345",
    rating: 4.9,
    deliveryTime: "25-35 min",
    deliveryFee: 2.99,
    lat: 5.6142,
    lng: -0.1971,
    imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80",
    menu: [
      { name: "Margherita", price: 14.99, description: "Tomato sauce, fresh mozzarella, basil, olive oil.", imageUrl: "https://images.unsplash.com/photo-1574071318508-1cdbad80ad38?auto=format&fit=crop&w=400&q=80", category: "Pizzas", isVegetarian: true },
      { name: "Pepperoni Passion", price: 16.99, description: "Double pepperoni, mixed cheese, classic sauce.", imageUrl: "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=400&q=80", category: "Pizzas" },
      { name: "Spicy Arrabbiata", price: 15.99, description: "Spicy tomato sauce, garlic, chili flakes, parsley.", imageUrl: "https://images.unsplash.com/photo-1595854341625-f33ee10dbf94?auto=format&fit=crop&w=400&q=80", category: "Pizzas", isSpicy: true, isVegetarian: true },
      { name: "Garlic Knots", price: 5.99, description: "Soft bread knots with garlic butter and parsley.", imageUrl: "https://images.unsplash.com/photo-1619531051664-88981f7289ee?auto=format&fit=crop&w=400&q=80", category: "Sides", isVegetarian: true },
      { name: "Caesar Salad", price: 8.99, description: "Romaine lettuce, croutons, parmesan, caesar dressing.", imageUrl: "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&w=400&q=80", category: "Sides" }
    ]
  },
  {
    name: "Sushi Zen",
    description: "Premium sushi and Japanese fusion.",
    category: "Asian",
    address: "789 Sakura Blvd, Downtown, DT 98765",
    rating: 4.7,
    deliveryTime: "30-45 min",
    deliveryFee: 3.99,
    lat: 5.5942,
    lng: -0.1771,
    imageUrl: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80",
    menu: [
      { name: "Dragon Roll", price: 13.99, description: "Shrimp tempura, eel, avocado, kabayaki sauce.", imageUrl: "https://images.unsplash.com/photo-1617196034183-421b4917c92d?auto=format&fit=crop&w=400&q=80", category: "Sushi Rolls" },
      { name: "Spicy Tuna Roll", price: 12.99, description: "Fresh tuna, spicy mayo, cucumber.", imageUrl: "https://images.unsplash.com/photo-1559410545-c95117588825?auto=format&fit=crop&w=400&q=80", category: "Sushi Rolls", isSpicy: true },
      { name: "Sashimi Deluxe", price: 18.99, description: "12 pieces of premium assorted raw fish.", imageUrl: "https://images.unsplash.com/photo-1534482421-0d45a48a73fe?auto=format&fit=crop&w=400&q=80", category: "Sashimi" },
      { name: "Miso Soup", price: 4.50, description: "Traditional soybean broth with tofu and seaweed.", imageUrl: "https://images.unsplash.com/photo-1607330289024-1535c6b4e1c1?auto=format&fit=crop&w=400&q=80", category: "Starters", isVegetarian: true },
      { name: "Edamame", price: 5.99, description: "Steamed soybeans with sea salt.", imageUrl: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=400&q=80", category: "Starters", isVegetarian: true }
    ]
  },
  {
    name: "Green Garden",
    description: "Fresh bowls, salads, and healthy smoothies.",
    category: "Healthy",
    address: "101 Wellness Court, Green Hills, GH 54321",
    rating: 4.6,
    deliveryTime: "15-25 min",
    deliveryFee: 0,
    lat: 5.6242,
    lng: -0.1871,
    imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80",
    menu: [
      { name: "Buddha Bowl", price: 11.50, description: "Quinoa, kale, chickpeas, avocado, tahini dressing.", imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80", category: "Bowls", isVegetarian: true },
      { name: "Mediterranean Bowl", price: 12.50, description: "Hummus, falafel, cucumber, olives, feta.", imageUrl: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=400&q=80", category: "Bowls", isVegetarian: true },
      { name: "Acai Berry Smoothie", price: 8.99, description: "Acai berries, banana, almond milk, granola topping.", imageUrl: "https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=400&q=80", category: "Smoothies", isVegetarian: true }
    ]
  }
];

const MOCK_PROMOTIONS = [
  {
    title: "Free Delivery Friday!",
    subtitle: "Enjoy $0 delivery fees on your favorite burgers today.",
    imageUrl: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=800&q=80",
    active: true,
    color: "bg-orange-500"
  },
  {
    title: "Fresh & Healthy 🥗",
    subtitle: "Get 20% off all salads from Green Garden this week.",
    imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
    active: true,
    color: "bg-emerald-500"
  },
  {
    title: "Pizza Party 🍕",
    subtitle: "Order any two large pizzas and get a free garlic knot.",
    imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80",
    active: true,
    color: "bg-blue-600"
  }
];

const MOCK_DRIVERS = [
  {
    name: "Alex Johnson",
    photoURL: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80",
    rating: 4.9,
    phone: "+1 555-0101"
  }
];

export function SeedPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState<'idle' | 'seeding' | 'done'>('idle');

  async function seed() {
    setStatus('seeding');
    try {
      // Seed Drivers
      const driverRefs = [];
      for (const d of MOCK_DRIVERS) {
        const ref = await addDoc(collection(db, 'drivers'), d);
        driverRefs.push(ref);
      }

      // Seed Promotions
      for (const p of MOCK_PROMOTIONS) {
        await addDoc(collection(db, 'promotions'), p);
      }

      // Seed Restaurants
      for (const r of MOCK_RESTAURANTS) {
        const { menu, ...rest } = r;
        const restRef = await addDoc(collection(db, 'restaurants'), rest);
        
        for (const item of menu) {
          await addDoc(collection(db, 'menu'), {
            ...item,
            restaurantId: restRef.id
          });
        }
      }
      setStatus('done');
    } catch (e) {
      console.error(e);
      alert('Seeding failed: ' + (e as Error).message);
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center">
      <h1 className="text-4xl font-black text-[#191919] mb-4 tracking-tight">System Tools</h1>
      <p className="text-gray-500 mb-12">Initialize environment and manage permissions.</p>
      
      <div className="space-y-6">
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-soft">
          <h2 className="text-lg font-bold mb-4">Initialize Data</h2>
          <p className="text-sm text-gray-500 mb-6 italic">Populate the database with trial restaurants, menu items, and drivers.</p>
          <button 
            onClick={seed}
            disabled={status !== 'idle'}
            className="w-full bg-[#191919] text-white px-8 py-4 rounded-xl disabled:opacity-50 font-bold hover:bg-brand transition-all shadow-lg"
          >
            {status === 'idle' ? 'Start Data Seeding' : status === 'seeding' ? 'Seeding Data...' : 'Data Seeded Successfully'}
          </button>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-soft">
          <h2 className="text-lg font-bold mb-4">Manage Roles</h2>
          <p className="text-sm text-gray-500 mb-6 italic">Elevate your profile to access specialized dashboards.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button 
              onClick={async () => {
                if (user) {
                  await dbService.setUserAdmin(user.uid, true);
                  alert('You are now an administrator! Please refresh the page.');
                  window.location.reload();
                } else {
                  alert('Please sign in first.');
                }
              }}
              className="bg-brand text-white px-6 py-4 rounded-xl font-bold hover:bg-brand-hover transition-all shadow-lg"
            >
              Make Me Admin
            </button>
            <button 
              onClick={async () => {
                if (user) {
                  await dbService.setUserDriver(user.uid, user.displayName || 'Demo Driver');
                  alert('You are now a driver! Please refresh the page.');
                  window.location.reload();
                } else {
                  alert('Please sign in first.');
                }
              }}
              className="bg-[#191919] text-white px-6 py-4 rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg"
            >
              Make Me Driver
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
