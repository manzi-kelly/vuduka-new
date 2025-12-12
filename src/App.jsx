import React, { useState } from 'react';
import Header from './components/layout/Header';
import MobileMenu from './components/layout/MobileMenu';
import Footer from './components/layout/Footer';
import HeroSection from './components/sections/HeroSection';
import ServicesSection from './components/sections/ServicesSection';
import WhyChooseUsSection from './components/sections/WhyChooseUsSection';
import TestimonialsSection from './components/sections/TestimonialsSection';
import DownloadAppSection from './components/sections/DownloadAppSection';
import BookingForm from './components/forms/BookingForm';
import LoginForm from './components/forms/LoginForm';
import RegistrationForm from './components/forms/RegistrationForm';
import OrderHistory from './components/sections/OrderHistory';
import { useAuthState } from './hooks/useAuthState';

function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [orderHistoryOpen, setOrderHistoryOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  const {
    authModal,
    authMessage,
    user,
    openLoginModal,
    openRegisterModal,
    closeAuthModal,
    switchToRegister,
    switchToLogin,
    handleLogin,
    handleRegister,
    handleGoogleLogin,
    handleLogout,
    setAuthMessage
  } = useAuthState();

  const handleMenuClick = () => setMobileMenuOpen(true);
  const handleHistoryClick = () => setOrderHistoryOpen(true);
  const handleBookingClick = () => setActiveSection('booking');
  const handleServicesClick = () => setActiveSection('services');
  const handleTestimonialsClick = () => setActiveSection('testimonials');

  // Mock orders for OrderHistory
  const mockOrders = [
    {
      id: '1',
      pickup: 'Kigali Convention Center',
      dropoff: 'Kigali International Airport',
      price: '25,000 RWF',
      date: '2024-01-15',
      time: '10:30 AM',
      type: 'Premium',
      driver: 'Jean Claude',
      status: 'completed',
      rating: 4.9,
      duration: '45 min'
    },
    // Add more mock orders as needed
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header
        onMenuClick={handleMenuClick}
        onHistoryClick={handleHistoryClick}
        onBookingClick={handleBookingClick}
        onServicesClick={handleServicesClick}
        onTestimonialsClick={handleTestimonialsClick}
        onLoginClick={openLoginModal}
        hasOrderHistory={!!user}
        currentUser={user}
        onLogout={handleLogout}
      />

      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        onLoginClick={openLoginModal}
        onRegisterClick={openRegisterModal}
        onBookingClick={handleBookingClick}
        onServicesClick={handleServicesClick}
        onTestimonialsClick={handleTestimonialsClick}
        onHistoryClick={handleHistoryClick}
        currentUser={user}
        onLogout={handleLogout}
      />

      <main className="pt-20">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {activeSection === 'home' && (
            <>
              <HeroSection onBookNowClick={handleBookingClick} />
              <ServicesSection />
              <WhyChooseUsSection />
              <TestimonialsSection />
              <DownloadAppSection />
            </>
          )}

          {activeSection === 'booking' && <BookingForm />}
          {activeSection === 'services' && <ServicesSection />}
          {activeSection === 'testimonials' && <TestimonialsSection />}
        </div>
      </main>

      <Footer />

      {/* Authentication Modals */}
      <LoginForm
        isOpen={authModal.isOpen && authModal.type === 'login'}
        onClose={closeAuthModal}
        onLogin={handleLogin}
        onSwitchToRegister={switchToRegister}
        authMessage={authMessage}
        onGoogleLogin={handleGoogleLogin}
      />

      <RegistrationForm
        isOpen={authModal.isOpen && authModal.type === 'register'}
        onClose={closeAuthModal}
        onRegister={handleRegister}
        onSwitchToLogin={switchToLogin}
        onNavigateToSection={setActiveSection}
        authMessage={authMessage}
      />

      {/* Order History Modal */}
      <OrderHistory
        orders={mockOrders}
        isOpen={orderHistoryOpen}
        onClose={() => setOrderHistoryOpen(false)}
      />
    </div>
  );
}

export default App;