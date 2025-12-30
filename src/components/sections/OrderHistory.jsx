import React, { useState } from 'react';
import { FaTimes, FaHistory, FaCar, FaMapMarkerAlt, FaMoneyBillWave, FaCalendarAlt, FaStar } from 'react-icons/fa';

function OrderHistory({ orders, isOpen, onClose }) {
  const [filter, setFilter] = useState('all'); // 'all', 'completed', 'cancelled'
  
  if (!isOpen) return null;

  // Filter orders based on selected filter
  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
        </div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                <FaHistory className="text-blue-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">Your Ride History</h3>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                <FaTimes />
              </button>
            </div>
            
            {/* Filter Tabs */}
            <div className="flex border-b border-gray-200 mb-4">
              <button
                className={`py-2 px-4 font-medium text-sm ${filter === 'all' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                onClick={() => setFilter('all')}
              >
                All Rides
              </button>
              <button
                className={`py-2 px-4 font-medium text-sm ${filter === 'completed' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                onClick={() => setFilter('completed')}
              >
                Completed
              </button>
              <button
                className={`py-2 px-4 font-medium text-sm ${filter === 'cancelled' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                onClick={() => setFilter('cancelled')}
              >
                Cancelled
              </button>
            </div>
            
            {filteredOrders.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No orders found</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {filteredOrders.map((order) => (
                  <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <FaCar className="text-blue-600 mr-2" />
                          <h4 className="font-medium text-gray-800">
                            {order.pickup} → {order.dropoff}
                          </h4>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                          <div className="flex items-center">
                            <FaMoneyBillWave className="mr-1 text-green-500" />
                            <span>{order.price}</span>
                          </div>
                          <div className="flex items-center">
                            <FaCalendarAlt className="mr-1 text-purple-500" />
                            <span>{order.date} • {order.time}</span>
                          </div>
                          <div className="flex items-center">
                            <FaMapMarkerAlt className="mr-1 text-red-500" />
                            <span>{order.type}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="mr-1">Driver:</span>
                            <span className="font-medium">{order.driver}</span>
                          </div>
                        </div>
                        
                        {order.status === 'completed' && (
                          <div className="flex items-center mt-2">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <FaStar 
                                  key={i} 
                                  className={i < Math.floor(order.rating) ? "text-yellow-400" : "text-gray-300"} 
                                  size={14}
                                />
                              ))}
                              <span className="ml-1 text-sm text-gray-600">({order.rating})</span>
                            </div>
                            <span className="mx-2 text-gray-300">|</span>
                            <span className="text-sm text-gray-600">{order.duration}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="ml-4">
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                          order.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {order.status === 'completed' ? 'Completed' : 'Cancelled'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderHistory;