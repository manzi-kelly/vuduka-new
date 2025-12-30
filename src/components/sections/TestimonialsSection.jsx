import React from 'react';
import { FaStar } from 'react-icons/fa';

function TestimonialsSection() {
  return (
    <section id="testimonials" className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">What Our Riders Say</h2>
            <div className="w-24 h-1 bg-blue-600 mx-auto mb-6"></div>
            <p className="text-gray-600 max-w-2xl mx-auto">Don't just take our word for it - hear from our satisfied customers</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 border border-gray-200 rounded-lg">
              <div className="flex items-center mb-6">
                <div className="bg-gray-200 rounded-xl w-16 h-16 mr-4" />
                <div>
                  <h4 className="font-bold">Manzi Kelly</h4>
                  <div className="flex text-yellow-400">
                    <FaStar />
                    <FaStar />
                    <FaStar />
                    <FaStar />
                    <FaStar />
                  </div>
                </div>
              </div>
              <p className="text-gray-600 italic">
                "Vuduka has transformed my daily commute. The drivers are always on time and the app is so easy to use. Highly recommend!"
              </p>
            </div>
            
            <div className="p-8 border border-gray-200 rounded-lg">
              <div className="flex items-center mb-6">
                <div className="bg-gray-200 rounded-xl w-16 h-16 mr-4" />
                <div>
                  <h4 className="font-bold">Ishimwe Prience</h4>
                  <div className="flex text-yellow-400">
                    <FaStar />
                    <FaStar />
                    <FaStar />
                    <FaStar />
                    <FaStar />
                  </div>
                </div>
              </div>
              <p className="text-gray-600 italic">
                "I've tried many ride services, but Vuduka stands out with their professional drivers and clean vehicles. Worth every penny!"
              </p>
            </div>
            
            <div className="p-8 border border-gray-200 rounded-lg">
              <div className="flex items-center mb-6">
                <div className="bg-gray-200 rounded-xl w-16 h-16 mr-4" />
                <div>
                  <h4 className="font-bold">Emmanuel Nkurunziza</h4>
                  <div className="flex text-yellow-400">
                    <FaStar />
                    <FaStar />
                    <FaStar />
                    <FaStar />
                    <FaStar />
                  </div>
                </div>
              </div>
              <p className="text-gray-600 italic">
                "Booking with Vuduka is always a pleasure. The app is intuitive and the customer support team is incredibly responsive."
              </p>
            </div>
          </div>
        </section>
  );
}

export default TestimonialsSection;