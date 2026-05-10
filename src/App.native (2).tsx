import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  TextInput,
  Dimensions,
  FlatList,
  ActivityIndicator
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { 
  Bike, 
  ShoppingBag, 
  Search, 
  Sparkles, 
  Star, 
  Clock, 
  MapPin,
  Utensils,
  Pizza,
  Coffee,
  IceCream,
  Flame,
  Zap
} from 'lucide-react-native';
import { dbService } from './services/db';
import { Restaurant } from './types';
import { auth, googleProvider } from './lib/firebase';
import { signInWithPopup, onAuthStateChanged, User, signOut } from 'firebase/auth';

const { width } = Dimensions.get('window');

// Mock categories for UI
const CATEGORIES = [
  { name: 'All', icon: Utensils },
  { name: 'Pizza', icon: Pizza },
  { name: 'Sushi', icon: Flame },
  { name: 'Healthy', icon: Coffee },
  { name: 'Desserts', icon: IceCream },
];

export default function App() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function loadRestaurants() {
      try {
        const data = await dbService.getRestaurants();
        if (data.length === 0 && user?.email === 'tettehseth67@gmail.com') {
          console.log("Empty restaurants, seeding...");
          await dbService.seedDatabase();
          const refreshed = await dbService.getRestaurants();
          setRestaurants(refreshed);
        } else {
          setRestaurants(data);
        }
      } catch (error) {
        console.error("Failed to load restaurants", error);
      } finally {
        setLoading(false);
      }
    }
    loadRestaurants();
  }, [user]);

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Sign in failed", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign out failed", error);
    }
  };

  const filteredRestaurants = activeCategory === 'All' 
    ? restaurants 
    : restaurants.filter(r => r.category === activeCategory);

  const renderRestaurant = ({ item }: { item: Restaurant }) => (
    <TouchableOpacity 
      activeOpacity={0.9}
      className="mb-8 bg-white rounded-[32px] overflow-hidden shadow-sm border border-gray-100"
    >
      <View className="relative h-48">
        <Image 
          source={{ uri: item.imageUrl }} 
          className="w-full h-full object-cover"
        />
        <View className="absolute top-4 left-4 flex-row space-x-2">
          {item.isFeatured && (
            <View className="bg-brand px-3 py-1 rounded-full">
              <Text className="text-white text-[10px] font-bold uppercase tracking-wider">FEATURED</Text>
            </View>
          )}
          <View className="bg-white/90 px-3 py-1 rounded-full flex-row items-center">
            <Star size={10} color="#FFD700" fill="#FFD700" />
            <Text className="ml-1 text-[#191919] text-[10px] font-bold">{item.rating}</Text>
          </View>
        </View>
        
        <View className="absolute bottom-4 right-4 bg-white/90 px-3 py-1.5 rounded-full flex-row items-center">
          <Clock size={12} color="#EF4444" />
          <Text className="ml-1.5 text-[#191919] text-[10px] font-bold">{item.deliveryTime} min</Text>
        </View>
      </View>

      <View className="p-5">
        <View className="flex-row justify-between items-center mb-1">
          <Text className="text-xl font-bold text-[#191919]">{item.name}</Text>
          <Text className="text-brand font-bold text-xs">{item.deliveryFee === 0 ? 'FREE' : `$${item.deliveryFee}`}</Text>
        </View>
        <Text className="text-gray-500 text-sm mb-2">{item.description}</Text>
        
        <View className="flex-row items-center">
          <MapPin size={12} color="#9CA3AF" />
          <Text className="ml-1 text-gray-400 text-xs">{item.category} • Accra, Ghana</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]">
      <StatusBar style="dark" />
      
      {/* Dynamic Header */}
      <View className="px-6 py-4 flex-row items-center justify-between bg-white border-b border-gray-100">
        <View className="flex-row items-center">
          <View className="w-10 h-10 bg-brand rounded-2xl items-center justify-center shadow-lg shadow-brand/20">
            <Bike color="white" size={24} />
          </View>
          <View className="ml-3">
            <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest italic">Delivery to</Text>
            <View className="flex-row items-center">
              <Text className="text-sm font-black text-[#191919]">Oxford St, Osu</Text>
              <Zap size={10} color="#EF4444" fill="#EF4444" className="ml-1" />
            </View>
          </View>
        </View>
        <View className="flex-row items-center space-x-4">
          <TouchableOpacity 
            onPress={user ? handleSignOut : handleSignIn}
            className="px-4 py-2 bg-gray-50 rounded-full border border-gray-100"
          >
            <Text className="text-[10px] font-black text-[#191919] uppercase">
              {user ? 'Sign Out' : 'Sign In'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity className="relative p-2 bg-gray-50 rounded-full">
            <ShoppingBag color="#191919" size={22} />
            <View className="absolute top-0 right-0 w-4 h-4 bg-brand rounded-full items-center justify-center border-2 border-white">
              <Text className="text-[8px] text-white font-bold">2</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FF3008" />
          <Text className="mt-4 text-gray-500 font-bold uppercase tracking-widest text-[10px]">Loading Kitchens...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredRestaurants}
          keyExtractor={(item) => item.id}
          renderItem={renderRestaurant}
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 }}
          ListEmptyComponent={
            <View className="items-center py-20">
              <Utensils size={48} color="#E5E7EB" />
              <Text className="mt-4 text-gray-400 font-bold">No restaurants found in this category</Text>
            </View>
          }
          ListHeaderComponent={
          <>
            {/* Search Bar */}
            <View className="bg-white rounded-2xl flex-row items-center px-4 py-4 mb-6 shadow-sm border border-gray-100">
              <Search color="#9CA3AF" size={20} />
              <TextInput 
                placeholder="Search for restaurants or dishes..." 
                className="ml-3 flex-1 text-gray-900 font-medium text-sm"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Categories */}
            <View className="mb-8">
              <Text className="text-lg font-bold text-[#191919] mb-4">Categories</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-6 px-6">
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.name}
                    onPress={() => setActiveCategory(cat.name)}
                    className={`mr-4 items-center justify-center px-6 py-4 rounded-[24px] border ${
                      activeCategory === cat.name 
                        ? 'bg-[#191919] border-[#191919] shadow-lg shadow-gray-200' 
                        : 'bg-white border-gray-100'
                    }`}
                  >
                    <cat.icon size={20} color={activeCategory === cat.name ? "white" : "#9CA3AF"} />
                    <Text className={`mt-2 text-[10px] font-black uppercase tracking-widest ${
                      activeCategory === cat.name ? 'text-white' : 'text-[#494949]'
                    }`}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Featured Section */}
            <View className="mb-6 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Sparkles size={18} color="#EF4444" />
                <Text className="ml-2 text-xl font-black text-[#191919] italic tracking-tighter uppercase">Featured Kitchens</Text>
              </View>
              <TouchableOpacity>
                <Text className="text-brand text-xs font-bold">View all</Text>
              </TouchableOpacity>
            </View>
          </>
        }
        ListFooterComponent={
          <View className="mt-4 items-center">
            <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-widest text-center">
              Mobile version in development {"\n"}Built with Expo & NativeWind
            </Text>
          </View>
        }
      />
    )}
    </SafeAreaView>
  );
}
