import React from 'react';
import { FaCar, FaCrown, FaShuttleVan } from 'react-icons/fa';

function ServicesSection() {
  return (
    <section id="services" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Services</h2>
          <div className="w-24 h-1 bg-blue-600 mx-auto mb-6"></div>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Choose from our range of premium ride options tailored to your needs
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Economy Rides */}
          <div className="bg-gray-50 rounded-xl p-8 border border-gray-200 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center mb-6">
              <div className="w-16 h-16 rounded-xl bg-blue-100 flex items-center justify-center mr-4">
                <FaCar className="text-blue-600 text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Economy Rides</h3>
            </div>
            <p className="text-gray-600 mb-6">Affordable, reliable rides for everyday travel</p>
            <ul className="space-y-3">
              <li className="flex items-center">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                  <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                </div>
                <span className="text-gray-700">Lowest prices</span>
              </li>
              <li className="flex items-center">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                  <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                </div>
                <span className="text-gray-700">Quick pickups</span>
              </li>
              <li className="flex items-center">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                  <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                </div>
                <span className="text-gray-700">Everyday cars</span>
              </li>
            </ul>
          </div>
          
          {/* Premium Rides */}
          <div className="bg-gray-50 rounded-xl p-8 border border-gray-200 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center mb-6">
              <div className="w-16 h-16 rounded-xl bg-purple-100 flex items-center justify-center mr-4">
                <FaCrown className="text-purple-600 text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Premium Rides</h3>
            </div>
            <p className="text-gray-600 mb-6">Luxury vehicles with professional drivers</p>
            <ul className="space-y-3">
              <li className="flex items-center">
                <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                  <div className="w-2 h-2 rounded-full bg-purple-600"></div>
                </div>
                <span className="text-gray-700">High-end vehicles</span>
              </li>
              <li className="flex items-center">
                <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                  <div className="w-2 h-2 rounded-full bg-purple-600"></div>
                </div>
                <span className="text-gray-700">Top-rated drivers</span>
              </li>
              <li className="flex items-center">
                <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                  <div className="w-2 h-2 rounded-full bg-purple-600"></div>
                </div>
                <span className="text-gray-700">Comfort priority</span>
              </li>
            </ul>
          </div>
          
          {/* Group Rides */}
          <div className="bg-gray-50 rounded-xl p-8 border border-gray-200 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center mb-6">
              <div className="w-16 h-16 rounded-xl bg-green-100 flex items-center justify-center mr-4">
                <FaShuttleVan className="text-green-600 text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Group Rides</h3>
            </div>
            <p className="text-gray-600 mb-6">Spacious vehicles for groups and luggage</p>
            <ul className="space-y-3">
              <li className="flex items-center">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mr-3">
                  <div className="w-2 h-2 rounded-full bg-green-600"></div>
                </div>
                <span className="text-gray-700">SUVs and vans</span>
              </li>
              <li className="flex items-center">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mr-3">
                  <div className="w-2 h-2 rounded-full bg-green-600"></div>
                </div>
                <span className="text-gray-700">Extra luggage space</span>
              </li>
              <li className="flex items-center">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mr-3">
                  <div className="w-2 h-2 rounded-full bg-green-600"></div>
                </div>
                <span className="text-gray-700">Group discounts</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ServicesSection;