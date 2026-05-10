import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { RestaurantPage } from './pages/RestaurantPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrdersPage } from './pages/OrdersPage';
import { CartSidebar } from './components/CartSidebar';
import { SeedPage } from './pages/SeedPage';
import { OrderTrackingPage } from './pages/OrderTrackingPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminDashboard } from './pages/AdminDashboard';
import { DriverDashboard } from './pages/DriverDashboard';
import { DriverEarningsPage } from './pages/DriverEarningsPage';
import { AuthPage } from './pages/AuthPage';
import { Toaster } from 'sonner';
import { ProtectedRoute } from './components/ProtectedRoute';

import { DriverLayout } from './components/DriverLayout';
import { AdminLayout } from './components/AdminLayout';
import DriverProfilePage from './pages/driver/DriverProfilePage';
import DriverOnboardingPage from './pages/driver/DriverOnboardingPage';
import AdminProfilePage from './pages/admin/AdminProfilePage';
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage';

function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 selection:bg-orange-100 selection:text-orange-900">
      <Toaster position="top-center" expand={true} richColors />
      <Navbar />
      <main>
        {children}
      </main>
      <Footer />
      <CartSidebar />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <Routes>
            {/* Driver Logistics Experience */}
            <Route path="/driver/*" element={
              <ProtectedRoute requireDriver>
                <DriverLayout>
                  <Routes>
                    <Route path="/" element={<DriverDashboard />} />
                    <Route path="/earnings" element={<DriverEarningsPage />} />
                    <Route path="/profile" element={<DriverProfilePage />} />
                    <Route path="/onboarding" element={<DriverOnboardingPage />} />
                  </Routes>
                </DriverLayout>
              </ProtectedRoute>
            } />

            {/* Admin Command Experience */}
            <Route path="/admin/*" element={
              <ProtectedRoute requireAdmin>
                <AdminLayout>
                  <Routes>
                    <Route path="/" element={<AdminDashboard />} />
                    <Route path="/profile" element={<AdminProfilePage />} />
                    <Route path="/analytics" element={<AdminAnalyticsPage />} />
                    <Route path="/seed" element={<SeedPage />} />
                  </Routes>
                </AdminLayout>
              </ProtectedRoute>
            } />

            {/* Client App Experience */}
            <Route path="*" element={
              <MainLayout>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/restaurant/:id" element={<RestaurantPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/orders" element={<OrdersPage />} />
                  <Route path="/track/:id" element={<OrderTrackingPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/seed" element={<SeedPage />} />
                </Routes>
              </MainLayout>
            } />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}
