import React from 'react';
import { FaCar, FaUser, FaSignOutAlt } from 'react-icons/fa';

const Header = ({ 
  onMenuClick, 
  onHistoryClick, 
  onBookingClick, 
  onServicesClick, 
  onTestimonialsClick,
  onLoginClick, 
  hasOrderHistory, 
  currentUser, 
  onLogout 
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 bg-white shadow-lg z-40">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Left: Logo (link) */}
        <a href="/" className="flex items-center space-x-1 order-1 md:order-1">
          <div className="bg-blue-600 text-white p-2 rounded-lg">
            <FaCar className="text-xl" />
          </div>
          <span className="text-xl font-bold text-gray-800">RideShare</span>
        </a>

        {/* Desktop Navigation (center) */}
        <nav className="hidden md:flex items-center space-x-6 order-2">
          <button className="text-gray-700 hover:text-blue-600 transition duration-200">
            Home
          </button>

          <button 
            onClick={onBookingClick}
            className="text-gray-700 hover:text-blue-600 transition duration-200"
          >
            Booking
          </button>

          <button 
            onClick={onServicesClick}
            className="text-gray-700 hover:text-blue-600 transition duration-200"
          >
            Services
          </button>

          <button 
            onClick={onTestimonialsClick}
            className="text-gray-700 hover:text-blue-600 transition duration-200"
          >
            Testimonials
          </button>

          {hasOrderHistory && (
            <button 
              onClick={onHistoryClick}
              className="text-gray-700 hover:text-blue-600 transition duration-200"
            >
              Order History
            </button>
          )}
        </nav>

        {/* Right: Auth actions (desktop) */}
        <div className="hidden md:flex items-center space-x-4 order-3">
          {currentUser ? (
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {currentUser.fullName}</span>
              <button 
                onClick={onLogout}
                className="flex items-center space-x-2 text-gray-700 hover:text-red-600 transition duration-200"
                aria-label="Logout"
              >
                <FaSignOutAlt />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <button 
              onClick={onLoginClick}
              className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition duration-200"
              aria-label="Login"
            >
              <FaUser />
              <span>Login</span>
            </button>
          )}
        </div>

        {/* Mobile right side: menu button + auth (compact) */}
        <div className="flex items-center space-x-2 md:hidden order-4">
          {/* Show a compact login icon on mobile if no user */}
          {!currentUser && (
            <button
              onClick={onLoginClick}
              className="bg-transparent p-2 rounded-md text-gray-700"
              aria-label="Login"
            >
              <FaUser />
            </button>
          )}

          {/* Mobile menu toggle */}
          <button 
            onClick={onMenuClick}
            className="bg-blue-600 text-white p-2 rounded-lg"
            aria-label="Open menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;