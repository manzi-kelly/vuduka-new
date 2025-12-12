import React from 'react';
import { FaTimes, FaUser, FaSignOutAlt, FaCar, FaHistory, FaCog, FaComments, FaUserPlus, FaArrowRight, FaHome, FaStar } from 'react-icons/fa';

const MobileMenu = ({ 
  isOpen, 
  onClose, 
  onLoginClick,
  onRegisterClick,
  onBookingClick,
  onServicesClick,
  onTestimonialsClick,
  onHistoryClick,
  currentUser, 
  onLogout 
}) => {
  if (!isOpen) return null;

  const handleLogin = () => {
    onLoginClick();
    onClose();
  };

  const handleRegister = () => {
    onRegisterClick();
    onClose();
  };

  const handleBooking = () => {
    onBookingClick();
    onClose();
  };

  const handleServices = () => {
    onServicesClick();
    onClose();
  };

  const handleTestimonials = () => {
    onTestimonialsClick();
    onClose();
  };

  const handleHistory = () => {
    onHistoryClick();
    onClose();
  };

  const handleLogout = () => {
    onLogout();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-60 transition-opacity duration-300"
        onClick={onClose} 
      />
      
      {/* Menu Panel */}
      <div className="absolute right-0 top-0 h-full w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out">
        {/* Header */}
        <div className="flex items-center justify-between p-7 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
              <FaCar className="text-2xl text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Ufit Ride</h2>
              <p className="text-blue-100 text-base mt-1">
                {currentUser ? `Welcome back, ${currentUser.firstName || currentUser.fullName || 'User'}` : 'Your Ride, Your Way'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 hover:bg-white hover:bg-opacity-20 rounded-xl transition duration-200"
          >
            <FaTimes className="text-2xl" />
          </button>
        </div>

        {/* User Info Section */}
        {currentUser && (
          <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">
                  {(currentUser.firstName || currentUser.fullName || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-bold text-gray-900 truncate">
                  {currentUser.firstName || currentUser.fullName || 'User'}
                </p>
                <p className="text-sm text-gray-600 truncate mt-1">
                  {currentUser.email}
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <div className="flex items-center space-x-1 bg-green-100 px-2 py-1 rounded-full">
                    <FaStar className="text-green-600 text-xs" />
                    <span className="text-green-700 text-xs font-semibold">Verified Rider</span>
                  </div>
                  <div className="flex items-center space-x-1 bg-blue-100 px-2 py-1 rounded-full">
                    <span className="text-blue-700 text-xs font-semibold">Premium</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider px-3 py-3 bg-gray-50 rounded-xl">
            Quick Navigation
          </h3>

          <button
            onClick={handleBooking}
            className="w-full flex items-center justify-between p-4 text-gray-800 hover:bg-blue-50 hover:text-blue-700 rounded-2xl transition duration-200 group border border-gray-100 hover:border-blue-200"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition duration-200 shadow-sm">
                <FaCar className="text-blue-600 text-xl" />
              </div>
              <div className="text-left">
                <span className="font-semibold text-lg">Book a Ride</span>
                <p className="text-sm text-gray-500 mt-1">Quick & easy booking</p>
              </div>
            </div>
            <FaArrowRight className="text-gray-400 group-hover:text-blue-600 text-base mr-2" />
          </button>

          <button
            onClick={handleServices}
            className="w-full flex items-center justify-between p-4 text-gray-800 hover:bg-green-50 hover:text-green-700 rounded-2xl transition duration-200 group border border-gray-100 hover:border-green-200"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition duration-200 shadow-sm">
                <FaCog className="text-green-600 text-xl" />
              </div>
              <div className="text-left">
                <span className="font-semibold text-lg">Our Services</span>
                <p className="text-sm text-gray-500 mt-1">Explore all options</p>
              </div>
            </div>
            <FaArrowRight className="text-gray-400 group-hover:text-green-600 text-base mr-2" />
          </button>

          <button
            onClick={handleTestimonials}
            className="w-full flex items-center justify-between p-4 text-gray-800 hover:bg-purple-50 hover:text-purple-700 rounded-2xl transition duration-200 group border border-gray-100 hover:border-purple-200"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition duration-200 shadow-sm">
                <FaComments className="text-purple-600 text-xl" />
              </div>
              <div className="text-left">
                <span className="font-semibold text-lg">Testimonials</span>
                <p className="text-sm text-gray-500 mt-1">What riders say</p>
              </div>
            </div>
            <FaArrowRight className="text-gray-400 group-hover:text-purple-600 text-base mr-2" />
          </button>

          {currentUser && (
            <button
              onClick={handleHistory}
              className="w-full flex items-center justify-between p-4 text-gray-800 hover:bg-orange-50 hover:text-orange-700 rounded-2xl transition duration-200 group border border-gray-100 hover:border-orange-200"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center group-hover:bg-orange-200 transition duration-200 shadow-sm">
                  <FaHistory className="text-orange-600 text-xl" />
                </div>
                <div className="text-left">
                  <span className="font-semibold text-lg">Ride History</span>
                  <p className="text-sm text-gray-500 mt-1">Your past journeys</p>
                </div>
              </div>
              <FaArrowRight className="text-gray-400 group-hover:text-orange-600 text-base mr-2" />
            </button>
          )}

          {/* Additional Quick Actions */}
          <div className="pt-4">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider px-3 py-3 bg-gray-50 rounded-xl">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <button className="p-3 bg-gray-50 hover:bg-blue-50 rounded-xl transition duration-200 text-center group">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto group-hover:bg-blue-200">
                  <FaHome className="text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-700 mt-2 block">Home</span>
              </button>
              <button className="p-3 bg-gray-50 hover:bg-green-50 rounded-xl transition duration-200 text-center group">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto group-hover:bg-green-200">
                  <FaStar className="text-green-600" />
                </div>
                <span className="text-sm font-medium text-gray-700 mt-2 block">Rate Us</span>
              </button>
            </div>
          </div>
        </div>

        {/* Authentication Section */}
        <div className="p-5 border-t border-gray-200 bg-white">
          {currentUser ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl border border-gray-200">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-md">
                  <span className="text-white font-bold text-lg">
                    {(currentUser.firstName || currentUser.fullName || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-gray-900 truncate">
                    {currentUser.firstName || currentUser.fullName}
                  </p>
                  <p className="text-sm text-gray-600 truncate mt-1">
                    {currentUser.email}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center space-x-3 p-4 text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-2xl transition duration-200 font-semibold shadow-lg hover:shadow-xl"
              >
                <FaSignOutAlt className="text-base" />
                <span className="text-base">Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={handleLogin}
                className="w-full flex items-center justify-center space-x-3 p-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white hover:from-blue-700 hover:to-indigo-800 rounded-2xl transition duration-200 font-semibold shadow-lg hover:shadow-xl"
              >
                <FaUser className="text-base" />
                <span className="text-base">Login </span>
              </button>
              
              <button
                onClick={handleRegister}
                className="w-full flex items-center justify-center space-x-3 p-4 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 rounded-2xl transition duration-200 font-semibold"
              >
                <FaUserPlus className="text-base" />
                <span className="text-base">Create Account</span>
              </button>

              {/* Guest Info */}
              <div className="text-center pt-2">
                <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-xl">
                  Continue as guest to explore our amazing ride services
                </p>
              </div>
            </div>
          )}
        </div>

        {/* App Version */}
        <div className="pb-6 px-5">
          <div className="text-center bg-gray-50 p-3 rounded-xl">
            <p className="text-sm text-gray-500 font-medium">
              Ufit Ride v2.0 • Secure & Reliable
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Your trusted ride-sharing partner
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;