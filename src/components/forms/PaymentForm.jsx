import React, { useState, useRef } from 'react';
import { 
  FaTimes, FaClock, FaShieldAlt, FaDollarSign, FaMapMarkerAlt, 
  FaCar, FaStar, FaRoad, FaDownload, FaCheckCircle, FaPrint 
} from 'react-icons/fa';
import jsPDF from 'jspdf';
import { QRCodeCanvas } from 'qrcode.react';

function PaymentForm({ order, onPaymentSubmit, onClose, onPaymentSuccess }) {
  const [formData, setFormData] = useState({
    fullName: '', phone: '', nationalId: '', gender: 'male',
    paymentMethod: 'mtn', mobilePaymentNumber: '', cardNumber: '',
    cardExpiry: '', cardCvv: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMobilePaymentMessage, setShowMobilePaymentMessage] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const billRef = useRef();

  const handleChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === 'phone' || name === 'mobilePaymentNumber') {
      formattedValue = value.replace(/\D/g, '').slice(0, 10);
      if (formattedValue.length > 3 && formattedValue.length <= 6) 
        formattedValue = `${formattedValue.slice(0,3)} ${formattedValue.slice(3)}`;
      else if (formattedValue.length > 6) 
        formattedValue = `${formattedValue.slice(0,3)} ${formattedValue.slice(3,6)} ${formattedValue.slice(6)}`;
    } else if (name === 'nationalId') formattedValue = value.replace(/\D/g, '').slice(0, 16);
    else if (name === 'fullName') formattedValue = value.replace(/[^a-zA-Z\s]/g, '');
    else if (name === 'cardNumber') {
      formattedValue = value.replace(/\D/g, '').slice(0,16);
      if (formattedValue.length > 4 && formattedValue.length <= 8)
        formattedValue = `${formattedValue.slice(0,4)} ${formattedValue.slice(4)}`;
      else if (formattedValue.length > 8 && formattedValue.length <= 12)
        formattedValue = `${formattedValue.slice(0,4)} ${formattedValue.slice(4,8)} ${formattedValue.slice(8)}`;
      else if (formattedValue.length > 12)
        formattedValue = `${formattedValue.slice(0,4)} ${formattedValue.slice(4,8)} ${formattedValue.slice(8,12)} ${formattedValue.slice(12)}`;
    } else if (name === 'cardExpiry') {
      formattedValue = value.replace(/\D/g, '');
      if (formattedValue.length > 2) formattedValue = `${formattedValue.slice(0,2)}/${formattedValue.slice(2,4)}`;
    } else if (name === 'cardCvv') formattedValue = value.replace(/\D/g, '').slice(0,4);

    setFormData({ ...formData, [name]: formattedValue });
    if (errors[name]) setErrors({ ...errors, [name]: '' });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    else if (!/^[a-zA-Z\s]+$/.test(formData.fullName)) newErrors.fullName = 'Full name should contain only letters';
    
    const cleanPhone = formData.phone.replace(/\s/g,'');
    if (!cleanPhone) newErrors.phone = 'Phone number is required';
    else if (!/^07\d{8}$/.test(cleanPhone)) newErrors.phone = 'Invalid Rwandan phone number';
    
    if (!formData.nationalId) newErrors.nationalId = 'National ID is required';
    else if (formData.nationalId.length !== 16) newErrors.nationalId = 'National ID must be 16 digits';
    
    if (formData.paymentMethod === 'mtn' || formData.paymentMethod === 'airtel') {
      const cleanMobile = formData.mobilePaymentNumber.replace(/\s/g,'');
      if (!cleanMobile) newErrors.mobilePaymentNumber = 'Payment number required';
      else if (!/^07\d{8}$/.test(cleanMobile)) newErrors.mobilePaymentNumber = 'Invalid phone number';
    }

    if (formData.paymentMethod === 'card') {
      const cleanCard = formData.cardNumber.replace(/\s/g,'');
      if (!cleanCard) newErrors.cardNumber = 'Card number required';
      else if (cleanCard.length !== 16) newErrors.cardNumber = 'Card number must be 16 digits';
      if (!formData.cardExpiry) newErrors.cardExpiry = 'Expiry date required';
      else if (!/^\d{2}\/\d{2}$/.test(formData.cardExpiry)) newErrors.cardExpiry = 'Use MM/YY format';
      if (!formData.cardCvv) newErrors.cardCvv = 'CVV required';
      else if (formData.cardCvv.length < 3 || formData.cardCvv.length > 4) newErrors.cardCvv = 'CVV must be 3 or 4 digits';
    }

    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setIsSubmitting(true);
    const delay = formData.paymentMethod === 'card' ? 2000 : 3000;
    if (formData.paymentMethod !== 'card') setShowMobilePaymentMessage(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setPaymentSuccess(true);
      if (onPaymentSubmit) onPaymentSubmit(formData);
      if (onPaymentSuccess) onPaymentSuccess(order);
    }, delay);
  };

  const downloadBill = () => {
    // Note: html2canvas import is commented out in original code
    // You'll need to install and import it if needed
    console.log('Download bill functionality');
  };

  const printBill = () => {
    const printContent = billRef.current.innerHTML;
    const originalContent = document.body.innerHTML;
    document.body.innerHTML = printContent;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload();
  };

  const getRideIcon = type => {
    switch(type) {
      case 'Economy': return <FaCar className="text-blue-500" />;
      case 'Premium': return <FaStar className="text-yellow-500" />;
      case 'SUV': return <FaRoad className="text-green-500" />;
      default: return <FaCar className="text-blue-500" />;
    }
  };

  const BillReceipt = () => {
    const transactionId = `TRX-${Math.floor(100000 + Math.random() * 900000)}`;
    const paymentDate = new Date().toLocaleString();

    return (
      <div className="bg-white p-6 rounded-xl shadow-lg" ref={billRef}>
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <FaCheckCircle className="text-green-500 text-3xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful!</h2>
          <p className="text-gray-600">Thank you for your payment</p>
        </div>

        <div className="border border-gray-200 rounded-lg p-5 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="font-bold text-gray-800 text-lg">Ride Receipt</h3>
              <p className="text-gray-500 text-sm">Transaction ID: {transactionId}</p>
            </div>
            <div className="text-right text-gray-500 text-sm">Date: {paymentDate}</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">Trip Details</h4>
              <div className="space-y-2">
                <div className="flex"><span className="text-gray-600 w-32">Ride Type:</span> <span className="font-medium">{order.type}</span></div>
                <div className="flex"><span className="text-gray-600 w-32">From:</span> <span className="font-medium">{order.pickup}</span></div>
                <div className="flex"><span className="text-gray-600 w-32">To:</span> <span className="font-medium">{order.dropoff}</span></div>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <h4 className="font-semibold text-gray-700 mb-3">QR Code</h4>
              <QRCodeCanvas
                value={`Ride:${order.type}, From:${order.pickup}, To:${order.dropoff}, Paid:${order.price}, ID:${transactionId}`}
                size={128} bgColor="#ffffff" fgColor="#000000" level="H" includeMargin={true}
              />
              <p className="text-gray-500 text-sm mt-2">Scan to verify</p>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Paid</span>
              <span className="text-xl font-bold text-green-600">{order.price}</span>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-100 flex items-center">
          <FaShieldAlt className="text-blue-500 mr-2" />
          <span className="text-sm text-blue-700">Your payment was processed securely</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={downloadBill} className="flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition">
            <FaDownload className="mr-2" /> Download Receipt
          </button>
          <button onClick={printBill} className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">
            <FaPrint className="mr-2" /> Print Receipt
          </button>
        </div>
      </div>
    );
  };

  if (paymentSuccess) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl w-full max-w-2xl mx-auto overflow-hidden shadow-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-800">Payment Confirmation</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><FaTimes /></button>
          </div>
          <BillReceipt />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900 bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl mx-auto overflow-hidden shadow-xl">
        <div className="flex flex-col md:flex-row">
          {/* Order Summary Sidebar */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white p-6 md:w-2/5">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Order Summary</h3>
              <button 
                onClick={onClose} 
                className="text-blue-200 hover:text-white transition"
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="mb-6">
              <div className="flex items-center mb-4">
                <div className="text-2xl mr-3">
                  {getRideIcon(order.type)}
                </div>
                <h4 className="font-bold">{order.type} Ride</h4>
              </div>
              
              <div className="flex items-start mb-3">
                <FaMapMarkerAlt className="text-blue-200 mt-1 mr-2" />
                <div>
                  <div className="text-sm text-blue-200">From</div>
                  <div className="font-medium">{order.pickup}</div>
                </div>
              </div>
              
              <div className="flex items-start mb-4">
                <FaMapMarkerAlt className="text-blue-200 mt-1 mr-2" />
                <div>
                  <div className="text-sm text-blue-200">To</div>
                  <div className="font-medium">{order.dropoff}</div>
                </div>
              </div>
              
              <div className="border-t border-blue-500 pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-blue-200">Total Amount</span>
                  <span className="font-bold text-xl">{order.price}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-blue-200">
                  <span>Date</span>
                  <span>{order.date}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-700 rounded-lg p-4">
              <div className="flex items-center">
                <FaShieldAlt className="text-blue-200 mr-2" />
                <span className="text-sm text-blue-200">Secure payment encrypted</span>
              </div>
            </div>
          </div>
          
          {/* Payment Form */}
          <div className="p-6 md:w-3/5">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Complete Payment</h3>
            <p className="text-gray-600 mb-6">Enter your details to complete the transaction</p>
            
            <form onSubmit={handleSubmit}>
              {/* Personal Information */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Personal Information</h4>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-medium mb-2">Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border ${
                      errors.fullName ? 'border-red-500' : 'border-gray-200'
                    }`}
                    placeholder="Enter your full name"
                  />
                  {errors.fullName && (
                    <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border ${
                        errors.phone ? 'border-red-500' : 'border-gray-200'
                      }`}
                      placeholder="07X XXX XXXX"
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">National ID</label>
                    <input
                      type="text"
                      name="nationalId"
                      value={formData.nationalId}
                      onChange={handleChange}
                      maxLength={16}
                      className={`w-full px-4 py-2 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border ${
                        errors.nationalId ? 'border-red-500' : 'border-gray-200'
                      }`}
                      placeholder="16-digit ID number"
                    />
                    {errors.nationalId && (
                      <p className="text-red-500 text-xs mt-1">{errors.nationalId}</p>
                    )}
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-medium mb-2">Gender</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="gender"
                        value="male"
                        checked={formData.gender === 'male'}
                        onChange={handleChange}
                        className="mr-2 text-blue-500"
                      />
                      Male
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="gender"
                        value="female"
                        checked={formData.gender === 'female'}
                        onChange={handleChange}
                        className="mr-2 text-blue-500"
                      />
                      Female
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="gender"
                        value="other"
                        checked={formData.gender === 'other'}
                        onChange={handleChange}
                        className="mr-2 text-blue-500"
                      />
                      Other
                    </label>
                  </div>
                </div>
              </div>
              
              {/* Payment Method Selection */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Payment Method</h4>
                
                <div className="space-y-3">
                  <label className={`flex items-center bg-gray-50 p-3 rounded-lg cursor-pointer transition-all ${
                    formData.paymentMethod === 'mtn' ? 'ring-2 ring-blue-500 shadow-md' : 'border border-gray-200'
                  }`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="mtn"
                      checked={formData.paymentMethod === 'mtn'}
                      onChange={handleChange}
                      className="mr-3 text-blue-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center">
                        <div className="bg-yellow-500 w-6 h-6 rounded-full flex items-center justify-center mr-3">
                          <span className="font-bold text-black text-xs">M</span>
                        </div>
                        <div>
                          <div className="font-medium text-sm">MTN Mobile Money</div>
                          <div className="text-xs text-gray-500">Pay with your MTN account</div>
                        </div>
                      </div>
                    </div>
                  </label>
                  
                  <label className={`flex items-center bg-gray-50 p-3 rounded-lg cursor-pointer transition-all ${
                    formData.paymentMethod === 'airtel' ? 'ring-2 ring-blue-500 shadow-md' : 'border border-gray-200'
                  }`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="airtel"
                      checked={formData.paymentMethod === 'airtel'}
                      onChange={handleChange}
                      className="mr-3 text-blue-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center">
                        <div className="bg-red-600 w-6 h-6 rounded-full flex items-center justify-center mr-3">
                          <span className="font-bold text-white text-xs">A</span>
                        </div>
                        <div>
                          <div className="font-medium text-sm">Airtel Money</div>
                          <div className="text-xs text-gray-500">Pay with your Airtel account</div>
                        </div>
                      </div>
                    </div>
                  </label>
                  
                  <label className={`flex items-center bg-gray-50 p-3 rounded-lg cursor-pointer transition-all ${
                    formData.paymentMethod === 'card' ? 'ring-2 ring-blue-500 shadow-md' : 'border border-gray-200'
                  }`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={formData.paymentMethod === 'card'}
                      onChange={handleChange}
                      className="mr-3 text-blue-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center">
                        <div className="bg-blue-600 w-6 h-6 rounded-lg flex items-center justify-center mr-3">
                          <FaDollarSign className="text-white text-xs" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">Credit/Debit Card</div>
                          <div className="text-xs text-gray-500">Pay with Visa or Mastercard</div>
                        </div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
              
              {/* Payment Method Specific Fields */}
              {formData.paymentMethod === 'mtn' || formData.paymentMethod === 'airtel' ? (
                <div className="mb-6 bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <h4 className="text-lg font-medium mb-4 text-gray-800">
                    {formData.paymentMethod === 'mtn' ? 'MTN Mobile Money' : 'Airtel Money'} Payment
                  </h4>
                  
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      {formData.paymentMethod === 'mtn' ? 'MTN' : 'Airtel'} Payment Number
                    </label>
                    <input
                      type="tel"
                      name="mobilePaymentNumber"
                      value={formData.mobilePaymentNumber}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border ${
                        errors.mobilePaymentNumber ? 'border-red-500' : 'border-gray-200'
                      }`}
                      placeholder="07X XXX XXXX"
                    />
                    {errors.mobilePaymentNumber && (
                      <p className="text-red-500 text-xs mt-1">{errors.mobilePaymentNumber}</p>
                    )}
                  </div>
                  
                  {showMobilePaymentMessage && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
                      <div className="flex items-start">
                        <FaClock className="text-yellow-500 mt-1 mr-3 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-yellow-700">Payment Processing</p>
                          <p className="text-yellow-600 text-sm mt-1">
                            Please be patient. Check your phone for payment prompt. 
                            <span className="block mt-1">
                              <span className="font-medium">Kinyarwanda:</span> Ubu buryo bw'ishyura ntiratangira gukora, mube mwihanganye, ubikore no kuri mobile money.
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
              
              {formData.paymentMethod === 'card' && (
                <div className="mb-6 bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <h4 className="text-lg font-medium mb-4 text-gray-800">Card Information</h4>
                  
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-medium mb-2">Card Number</label>
                    <input
                      type="text"
                      name="cardNumber"
                      value={formData.cardNumber}
                      onChange={handleChange}
                      maxLength={19}
                      className={`w-full px-4 py-2 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border ${
                        errors.cardNumber ? 'border-red-500' : 'border-gray-200'
                      }`}
                      placeholder="0000 0000 0000 0000"
                    />
                    {errors.cardNumber && (
                      <p className="text-red-500 text-xs mt-1">{errors.cardNumber}</p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-2">Expiry Date</label>
                      <input
                        type="text"
                        name="cardExpiry"
                        value={formData.cardExpiry}
                        onChange={handleChange}
                        maxLength={5}
                        className={`w-full px-4 py-2 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border ${
                          errors.cardExpiry ? 'border-red-500' : 'border-gray-200'
                        }`}
                        placeholder="MM/YY"
                      />
                      {errors.cardExpiry && (
                        <p className="text-red-500 text-xs mt-1">{errors.cardExpiry}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-2">CVV</label>
                      <input
                        type="text"
                        name="cardCvv"
                        value={formData.cardCvv}
                        onChange={handleChange}
                        maxLength={4}
                        className={`w-full px-4 py-2 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border ${
                          errors.cardCvv ? 'border-red-500' : 'border-gray-200'
                        }`}
                        placeholder="123"
                      />
                      {errors.cardCvv && (
                        <p className="text-red-500 text-xs mt-1">{errors.cardCvv}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-500">
                    <FaShieldAlt className="text-blue-500 mr-2" />
                    <span>Your payment details are securely encrypted</span>
                  </div>
                </div>
              )}
              
              <div className="flex flex-col-reverse md:flex-row gap-4">
                <button
                  type="button"
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium transition duration-300 hover:bg-gray-50"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition duration-300 flex items-center justify-center ${
                    isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {formData.paymentMethod === 'card' 
                        ? 'Processing Payment...' 
                        : formData.paymentMethod === 'mtn' 
                          ? 'Requesting MTN Payment...' 
                          : 'Requesting Airtel Payment...'}
                    </>
                  ) : (
                    `Pay ${order.price}`
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PaymentForm;