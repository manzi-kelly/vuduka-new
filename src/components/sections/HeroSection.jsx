import React, { useState } from 'react';
import { 
  FaCar, 
  FaClock, 
  FaTimes, 
  FaUsers, 
  FaShieldAlt, 
  FaMapMarkerAlt,
  FaStar,
  FaHeart
} from 'react-icons/fa';

function HeroSection({ onBookNowClick }) {
  const [showAbout, setShowAbout] = useState(false);

  // Close modal when clicking outside content
  const closeModal = (e) => {
    if (e.target === e.currentTarget) {
      setShowAbout(false);
    }
  };

  return (
    <>
      <section className="flex flex-col md:flex-row items-center justify-between mb-16">
        <div className="md:w-1/2 mb-10 md:mb-0">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 leading-tight">
            Ride with <span className="text-blue-600">confidence</span> and comfort
          </h1>
          <p className="mt-4 text-gray-600 text-lg max-w-lg">
            Book your ride in seconds. Arrive in style. Vuduka connects you with reliable drivers at affordable prices.
          </p>
          <div className="mt-8 flex space-x-4">
            <button 
              onClick={onBookNowClick}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition duration-300 shadow-md hover:shadow-lg"
            >
              Book Now
            </button>
            <button 
              onClick={() => setShowAbout(true)}
              className="bg-white hover:bg-gray-100 text-gray-800 px-6 py-3 rounded-lg font-medium border border-gray-300 transition duration-300 shadow-sm hover:shadow-md"
            >
              Learn More
            </button>
          </div>
        </div>
        <div className="md:w-1/2 relative">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl w-full h-96 flex items-center justify-center overflow-hidden">
            <div className="text-white text-center p-8 relative z-10">
              <FaCar className="text-white text-6xl mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Instant Ride Booking</h2>
              <p className="opacity-90">Your driver arrives in minutes</p>
            </div>
            <div className="absolute inset-0 bg-black opacity-10"></div>
          </div>
          <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-lg border border-gray-200 w-64 shadow-lg">
            <div className="flex items-center">
              <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mr-3">
                <FaClock className="text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Average wait time</p>
                <p className="text-gray-600 text-sm">Under 5 minutes</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Us Modal */}
      {showAbout && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={closeModal}
        >
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white flex justify-between items-center p-6 border-b rounded-t-xl shadow-sm">
              <h2 className="text-2xl font-bold text-gray-800">About Vuduka</h2>
              <button 
                onClick={() => setShowAbout(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                aria-label="Close"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>
            
            <div className="p-6">
              {/* Hero Section */}
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg text-white p-8 mb-8">
                <h1 className="text-3xl font-bold mb-4">Revolutionizing Transportation in Rwanda</h1>
                <p className="text-lg opacity-90">
                  Vuduka is committed to providing safe, reliable, and affordable transportation solutions 
                  that connect people and communities across Rwanda.
                </p>
              </div>

              {/* Stats Section */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <FaUsers className="text-blue-600 text-2xl mx-auto mb-2" />
                  <h3 className="font-bold text-lg">10,000+</h3>
                  <p className="text-gray-600">Happy Customers</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <FaCar className="text-green-600 text-2xl mx-auto mb-2" />
                  <h3 className="font-bold text-lg">500+</h3>
                  <p className="text-gray-600">Verified Drivers</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <FaMapMarkerAlt className="text-purple-600 text-2xl mx-auto mb-2" />
                  <h3 className="font-bold text-lg">15+</h3>
                  <p className="text-gray-600">Cities Covered</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg text-center">
                  <FaStar className="text-orange-600 text-2xl mx-auto mb-2" />
                  <h3 className="font-bold text-lg">4.9/5</h3>
                  <p className="text-gray-600">Customer Rating</p>
                </div>
              </div>

              {/* Mission and Vision */}
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="text-xl font-bold mb-4 text-gray-800">Our Mission</h3>
                  <p className="text-gray-600">
                    To provide safe, reliable, and affordable transportation solutions that empower 
                    communities and drive economic growth across Rwanda. We're committed to creating 
                    opportunities for drivers while offering exceptional service to riders.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-4 text-gray-800">Our Vision</h3>
                  <p className="text-gray-600">
                    To become Rwanda's most trusted transportation platform, known for innovation, 
                    safety, and community impact. We aim to expand access to mobility solutions 
                    while reducing traffic congestion and environmental impact.
                  </p>
                </div>
              </div>

              {/* Values */}
              <div className="mb-8">
                <h3 className="text-xl font-bold mb-4 text-gray-800">Our Values</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <FaShieldAlt className="text-blue-600 text-xl mb-2" />
                    <h4 className="font-semibold mb-2">Safety First</h4>
                    <p className="text-gray-600 text-sm">
                      Every ride undergoes rigorous safety checks and driver verification to ensure 
                      your peace of mind.
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <FaHeart className="text-red-600 text-xl mb-2" />
                    <h4 className="font-semibold mb-2">Customer Focus</h4>
                    <p className="text-gray-600 text-sm">
                      We prioritize your experience with 24/7 support and continuous improvement 
                      based on your feedback.
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <FaStar className="text-yellow-600 text-xl mb-2" />
                    <h4 className="font-semibold mb-2">Excellence</h4>
                    <p className="text-gray-600 text-sm">
                      We strive for excellence in every aspect of our service, from driver training 
                      to app functionality.
                    </p>
                  </div>
                </div>
              </div>

              {/* Story */}
              <div className="bg-blue-50 p-6 rounded-lg mb-8">
                <h3 className="text-xl font-bold mb-4 text-gray-800">Our Story</h3>
                <p className="text-gray-600 mb-4">
                  Founded in 2021, Vuduka began as a small startup with a mission to solve transportation 
                  challenges in Kigali. Today, we've grown to serve communities across Rwanda, connecting 
                  thousands of riders with dependable drivers every day.
                </p>
                <p className="text-gray-600">
                  Our name "Vuduka" means "to move" in Kinyarwanda, reflecting our core purpose of 
                  keeping Rwanda moving forward. We're proud to contribute to our nation's development 
                  by creating jobs and improving mobility.
                </p>
              </div>

              {/* CTA */}
              <div className="text-center">
                <button 
                  onClick={() => {
                    setShowAbout(false);
                    onBookNowClick();
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition duration-300 shadow-md hover:shadow-lg"
                >
                  Book Your First Ride
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default HeroSection;