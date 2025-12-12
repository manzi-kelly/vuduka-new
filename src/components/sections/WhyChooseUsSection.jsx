import React from 'react';
import { FaClock, FaShieldAlt, FaDollarSign, FaThumbsUp } from 'react-icons/fa';

function WhyChooseUsSection() {
  return (
   <section id="why" className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Why Choose Vuduka</h2>
            <div className="w-24 h-1 bg-blue-600 mx-auto mb-6"></div>
            <p className="text-gray-600 max-w-2xl mx-auto">Experience the difference with our premium ride service</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 border border-gray-200 rounded-lg">
              <div className="flex items-start mb-6">
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mr-4">
                  <FaClock className="text-blue-600 text-xl" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Fast Arrival</h3>
                  <p className="text-gray-600">Average pickup time under 5 minutes in metro areas</p>
                </div>
              </div>
            </div>
            
            <div className="p-8 border border-gray-200 rounded-lg">
              <div className="flex items-start mb-6">
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mr-4">
                  <FaShieldAlt className="text-blue-600 text-xl" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Safety First</h3>
                  <p className="text-gray-600">All drivers background checked and vehicles inspected</p>
                </div>
              </div>
            </div>
            
            <div className="p-8 border border-gray-200 rounded-lg">
              <div className="flex items-start mb-6">
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mr-4">
                  <FaDollarSign className="text-blue-600 text-xl" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Best Prices</h3>
                  <p className="text-gray-600">Competitive pricing with no surprise fees</p>
                </div>
              </div>
            </div>
            
            <div className="p-8 border border-gray-200 rounded-lg">
              <div className="flex items-start mb-6">
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mr-4">
                  <FaThumbsUp className="text-blue-600 text-xl" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Rider Guarantee</h3>
                  <p className="text-gray-600">24/7 support and satisfaction guarantee</p>
                </div>
              </div>
            </div>
          </div>
        </section>

  );
}

export default WhyChooseUsSection;