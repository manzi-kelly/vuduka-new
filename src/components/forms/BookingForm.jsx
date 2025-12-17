// src/components/BookingForm.jsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import axios from 'axios';
import { 
  FaCar, FaStar, FaRoad, FaUsers, FaSuitcase, FaShieldAlt, 
  FaCheckCircle, FaClock, FaCalendarAlt, FaMapMarkerAlt, FaTimes,
  FaArrowLeft, FaUser, FaPhone, FaCreditCard, FaRoute,
  FaMap, FaExclamationTriangle, FaPhoneAlt, FaIdCard,
  FaMapPin, FaSpinner
} from 'react-icons/fa';

import MapComponent from '../common/MapComponent';
import PaymentForm from './PaymentForm';
import { locationService } from '../../api/locationService';

/* ---------- Custom Hook for Location Management ---------- */
const useLocationDetails = () => {
  const [locationDetails, setLocationDetails] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLocationDetails = useCallback(async (location, type) => {
    if (!location) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call to get location details
      // In a real app, you would use the actual API endpoint
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Mock location details based on your API structure
      const mockDetails = {
        coordinates: {
          lat: -1.9441 + Math.random() * 0.1,
          lng: 30.0619 + Math.random() * 0.1
        },
        address: location,
        city: "Kigali",
        country: "Rwanda"
      };
      
      setLocationDetails(prev => ({
        ...prev,
        [type]: mockDetails
      }));
      
    } catch (err) {
      setError(`Failed to fetch ${type} location details`);
      console.error('Location details error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { locationDetails, loading, error, fetchLocationDetails };
};

/* ---------- Custom Hook for Drivers Management ---------- */
const useDrivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNearbyDrivers = useCallback(async (pickupCoords, rideType) => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call to get nearby drivers
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // Mock drivers data with realistic Rwandan information
      const mockDrivers = [
        {
          id: 1,
          name: "Jean Claude",
          carModel: "Toyota RAV4",
          licensePlate: "RAA 123A",
          phone: "+250 788 123 456",
          rating: 4.9,
          trips: 247,
          eta: 5,
          coordinates: {
            lat: (pickupCoords?.lat || -1.9441) + (Math.random() * 0.02 - 0.01),
            lng: (pickupCoords?.lng || 30.0619) + (Math.random() * 0.02 - 0.01)
          },
          online: true,
          carColor: "White",
          carYear: "2022"
        },
        {
          id: 2,
          name: "Marie Aimee",
          carModel: "Honda CR-V",
          licensePlate: "RAB 456B",
          phone: "+250 788 234 567",
          rating: 4.8,
          trips: 189,
          eta: 7,
          coordinates: {
            lat: (pickupCoords?.lat || -1.9441) + (Math.random() * 0.02 - 0.01),
            lng: (pickupCoords?.lng || 30.0619) + (Math.random() * 0.02 - 0.01)
          },
          online: true,
          carColor: "Black",
          carYear: "2021"
        },
        {
          id: 3,
          name: "Patrick N.",
          carModel: "Toyota Prado",
          licensePlate: "RAC 789C",
          phone: "+250 788 345 678",
          rating: 4.7,
          trips: 312,
          eta: 9,
          coordinates: {
            lat: (pickupCoords?.lat || -1.9441) + (Math.random() * 0.02 - 0.01),
            lng: (pickupCoords?.lng || 30.0619) + (Math.random() * 0.02 - 0.01)
          },
          online: true,
          carColor: "Gray",
          carYear: "2020"
        },
        {
          id: 4,
          name: "Alice M.",
          carModel: "Mazda CX-5",
          licensePlate: "RAD 012D",
          phone: "+250 788 456 789",
          rating: 4.9,
          trips: 156,
          eta: 4,
          coordinates: {
            lat: (pickupCoords?.lat || -1.9441) + (Math.random() * 0.02 - 0.01),
            lng: (pickupCoords?.lng || 30.0619) + (Math.random() * 0.02 - 0.01)
          },
          online: true,
          carColor: "Red",
          carYear: "2023"
        }
      ];
      
      setDrivers(mockDrivers);
    } catch (err) {
      setError('Failed to fetch nearby drivers');
      console.error('Drivers fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { drivers, loading, error, fetchNearbyDrivers };
};

/* ---------- LocationInput component ---------- */
const LocationInput = ({ label, value, onChange, placeholder, icon: Icon, error }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  const abortRef = useRef(null);
  const debounceRef = useRef(null);
  

  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const fetchSuggestions = async (q) => {
    if (!q || q.length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      setApiError(null);
      return;
    }

    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();

    setIsLoading(true);
    setApiError(null);

    try {
      const data = await locationService.getSuggestions(q, abortRef.current.signal);
      setSuggestions(Array.isArray(data) ? data : []);
      setShowSuggestions(true);
    } catch (err) {
      if (err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError' || err?.name === 'AbortError') {
      } else {
        console.error('Suggestion API error', err);
        setApiError('Failed to load suggestions. Try again.');
        setSuggestions([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    onChange(val);
    setApiError(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(val);
    }, 350);
  };

  const handleSuggestionClick = (s) => {
    const value = typeof s === 'string' ? s : (s && s.text) ? s.text : String(s);
    onChange(value);
    setShowSuggestions(false);
    setSuggestions([]);
    setApiError(null);
  };

  const handleClear = () => {
    onChange('');
    setSuggestions([]);
    setShowSuggestions(false);
    setApiError(null);
    if (abortRef.current) abortRef.current.abort();
  };

  return (
    <div className="relative">
      <label className="text-sm font-semibold text-gray-700 mb-3 block">{label}</label>
      <div className="relative">
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
          <Icon className="text-blue-600 text-lg" />
        </div>
        <input
          placeholder={placeholder}
          value={value}
          onChange={handleInputChange}
          onFocus={() => value.length >= 2 && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 180)}
          className="pl-12 pr-10 h-14 border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 bg-white rounded-xl text-base w-full hover:border-blue-300 transition-all duration-200"
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <FaTimes />
          </button>
        )}
      </div>

      {isLoading && (
        <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
          <FaSpinner className="animate-spin text-blue-600" />
        </div>
      )}

      {apiError && (
        <div className="absolute z-20 w-full mt-1 bg-yellow-50 border border-yellow-200 rounded-xl shadow-lg p-3">
          <div className="flex items-center">
            <FaExclamationTriangle className="text-yellow-500 mr-2" />
            <span className="text-yellow-700 text-sm">{apiError}</span>
          </div>
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((s, i) => {
            const text = typeof s === 'string' ? s : (s && s.text) ? s.text : String(s);
            return (
              <div
                key={i}
                onClick={() => handleSuggestionClick(s)}
                className="px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors duration-150 border-b border-gray-100 last:border-b-0"
              >
                <div className="flex items-center">
                  <FaMapMarkerAlt className="text-blue-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-800 font-medium">{text}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {error && <p className="text-red-500 text-sm mt-2 font-medium">{error}</p>}
    </div>
  );
};

/* ---------- DateTimePicker Component ---------- */
const DateTimePicker = ({ selectedDateTime, onDateTimeChange, error }) => {
  const [selectedDate, setSelectedDate] = useState(selectedDateTime?.split('T')[0] || '');
  const [selectedTime, setSelectedTime] = useState(selectedDateTime?.split('T')[1] || '');

  const handleDateChange = (e) => {
    const date = e.target.value;
    setSelectedDate(date);
    if (date && selectedTime) {
      onDateTimeChange(`${date}T${selectedTime}`);
    }
  };

  const handleTimeChange = (e) => {
    const time = e.target.value;
    setSelectedTime(time);
    if (selectedDate && time) {
      onDateTimeChange(`${selectedDate}T${time}`);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-semibold text-gray-700 mb-3 block">Select Date</label>
        <div className="relative">
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
            <FaCalendarAlt className="text-blue-600 text-lg" />
          </div>
          <input
            type="date"
            min={new Date().toISOString().split('T')[0]}
            value={selectedDate}
            onChange={handleDateChange}
            className="pl-12 pr-4 h-14 border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 bg-white rounded-xl text-base w-full hover:border-blue-300 transition-all duration-200"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-semibold text-gray-700 mb-3 block">Select Time</label>
        <div className="relative">
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
            <FaClock className="text-blue-600 text-lg" />
          </div>
          <input
            type="time"
            min={selectedDate === new Date().toISOString().split('T')[0] ? new Date().toISOString().slice(11, 16) : '00:00'}
            value={selectedTime}
            onChange={handleTimeChange}
            className="pl-12 pr-4 h-14 border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 bg-white rounded-xl text-base w-full hover:border-blue-300 transition-all duration-200"
          />
        </div>
      </div>

      {error && <p className="text-red-500 text-sm mt-2 font-medium">{error}</p>}

      {selectedDate && selectedTime && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center text-blue-700">
            <FaCalendarAlt className="mr-3" />
            <span className="font-semibold">
              Scheduled for: {new Date(`${selectedDate}T${selectedTime}`).toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

/* ---------- Driver Card Component ---------- */
const DriverCard = ({ driver, isSelected, onSelect, onCall }) => {
  return (
    <div
      className={`border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 ${
        isSelected
          ? 'border-blue-500 bg-blue-50 shadow-md'
          : 'border-gray-200 hover:border-blue-300 hover:shadow-lg'
      }`}
      onClick={() => onSelect(driver)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold mr-4">
            {driver.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <h3 className="font-bold text-gray-800">{driver.name}</h3>
            <div className="flex items-center text-sm text-gray-600">
              <FaCar className="mr-2" />
              <span>{driver.carModel} • {driver.licensePlate}</span>
            </div>
            <div className="flex items-center text-sm text-gray-600 mt-1">
              <FaStar className="text-yellow-400 mr-1" />
              <span>{driver.rating} • {driver.trips} trips</span>
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <div className="flex items-center justify-end text-sm text-gray-600 mb-2">
            <FaMapPin className="text-green-500 mr-1" />
            <span>{driver.eta} min away</span>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onCall(driver);
            }}
            className="bg-green-500 hover:bg-green-600 text-white py-2 px-3 rounded-lg font-semibold transition-colors duration-200 flex items-center text-sm"
          >
            <FaPhoneAlt className="mr-1" />
            Call
          </button>
        </div>
      </div>

      {isSelected && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center">
              <FaIdCard className="text-gray-500 mr-2" />
              <span className="font-medium">License:</span>
              <span className="ml-2 font-mono">{driver.licensePlate}</span>
            </div>
            <div className="flex items-center">
              <FaPhoneAlt className="text-gray-500 mr-2" />
              <span className="font-medium">Phone:</span>
              <span className="ml-2">{driver.phone}</span>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            <span className="inline-flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
              Online • {driver.carColor} • {driver.carYear}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

/* ---------- BookingForm ---------- */
export default function BookingForm() {
  const [currentStep, setCurrentStep] = useState('booking'); // 'booking', 'drivers', 'confirmation'
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [selectedRide, setSelectedRide] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [order, setOrder] = useState(null);
  const [errors, setErrors] = useState({});
  const [rideTimeOption, setRideTimeOption] = useState('now');
  const [scheduledDateTime, setScheduledDateTime] = useState('');
  const [routeInfo, setRouteInfo] = useState(null);
  const [calculatedPrice, setCalculatedPrice] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  // Custom hooks for state management
  const { locationDetails, fetchLocationDetails } = useLocationDetails();
  const { drivers, loading: driversLoading, error: driversError, fetchNearbyDrivers } = useDrivers();

  const rideTypes = [
    { id: 'economy', name: 'Economy', icon: FaCar, basePrice: 1500, time: '5 min', description: 'Affordable everyday rides', features: [{ text: 'AC' }, { text: 'Standard Comfort' }, { text: 'Safe Ride' }] },
    { id: 'premium', name: 'Premium', icon: FaStar, basePrice: 2500, time: '7 min', description: 'Luxury comfort rides', features: [{ text: 'Premium Car' }, { text: 'Top Rated Driver' }, { text: 'Luxury Interior' }] },
    { id: 'suv', name: 'SUV', icon: FaRoad, basePrice: 3000, time: '10 min', description: 'Spacious for groups', features: [{ text: '6-8 Seats' }, { text: 'Extra Luggage Space' }, { text: 'Family Friendly' }] },
  ];

  const calculatePrice = useCallback((distance, rideType) => {
    const ride = rideTypes.find(r => r.id === rideType);
    if (!ride || !distance) return null;
    const baseFare = 2000;
    const distanceFare = distance * ride.basePrice;
    const total = baseFare + distanceFare;
    return Math.round(total / 500) * 500;
  }, [rideTypes]);

  const handleRouteCalculate = (routeData) => {
    setRouteInfo(routeData);
    if (selectedRide && routeData) {
      const price = calculatePrice(routeData.distance, selectedRide);
      setCalculatedPrice(price);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!pickupLocation.trim()) newErrors.pickupLocation = 'Pickup location is required';
    if (!dropoffLocation.trim()) newErrors.dropoffLocation = 'Dropoff location is required';
    if (!selectedRide) newErrors.ride = 'Please select a ride type';
    
    if (rideTimeOption === 'schedule') {
      if (!scheduledDateTime) {
        newErrors.scheduledDateTime = 'Please select date and time for your ride';
      } else {
        const selectedDate = new Date(scheduledDateTime);
        const now = new Date();
        if (selectedDate <= now) {
          newErrors.scheduledDateTime = 'Please select a future date and time';
        }
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // Fetch location details for both pickup and dropoff
      await Promise.all([
        fetchLocationDetails(pickupLocation, 'pickup'),
        fetchLocationDetails(dropoffLocation, 'dropoff')
      ]);

      // Fetch nearby drivers based on pickup location
      const pickupCoords = locationDetails.pickup?.coordinates;
      await fetchNearbyDrivers(pickupCoords, selectedRide);

      // Move to drivers selection step
      setCurrentStep('drivers');
    } catch (error) {
      console.error('Booking error:', error);
      alert('Error creating booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDriverSelect = (driver) => {
    setSelectedDriver(driver);
  };

  const handleCallDriver = (driver) => {
    console.log(`Calling driver: ${driver.name} at ${driver.phone}`);
    alert(`Calling ${driver.name} at ${driver.phone}`);
  };

  const handleConfirmDriver = async () => {
    if (!selectedDriver) return;
    
    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const ride = rideTypes.find(r => r.id === selectedRide);
      const isImmediate = rideTimeOption === 'now';
      const displayDate = isImmediate 
        ? new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : new Date(scheduledDateTime).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      const displayTime = isImmediate
        ? new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
        : new Date(scheduledDateTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      
      const price = calculatedPrice ? `${calculatedPrice.toLocaleString()} RWF` : 'Price Unavailable';
      
      const newOrder = {
        id: Date.now().toString(),
        pickup: pickupLocation,
        dropoff: dropoffLocation,
        type: ride ? ride.name : selectedRide,
        price,
        date: displayDate,
        time: displayTime,
        immediate: isImmediate,
        scheduledDateTime: isImmediate ? null : scheduledDateTime,
        distance: routeInfo?.distance,
        duration: routeInfo?.time,
        timestamp: new Date().toISOString(),
        status: isImmediate ? 'confirmed' : 'scheduled',
        driver: selectedDriver,
        locationDetails: locationDetails
      };
      
      setOrder(newOrder);
      setCurrentStep('confirmation');
    } catch (err) {
      console.error('driver confirmation error', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBookNow = () => setShowPaymentForm(true);
  
  const handleBackToBooking = () => { 
    setCurrentStep('booking');
    setShowPaymentForm(false);
    setSelectedDriver(null);
  };

  const handleBackToDrivers = () => {
    setCurrentStep('drivers');
  };

  const handleNewBooking = () => {
    setCurrentStep('booking');
    setPickupLocation('');
    setDropoffLocation('');
    setSelectedRide(null);
    setSelectedDriver(null);
    setRideTimeOption('now');
    setScheduledDateTime('');
    setRouteInfo(null);
    setCalculatedPrice(null);
    setOrder(null);
    setShowPaymentForm(false);
  };

  const handlePaymentSubmit = async (paymentData) => {
    setIsSubmitting(true);
    try {
      await new Promise(res => setTimeout(res, 1200));
      
      // Reset form after successful payment
      setCurrentStep('booking');
      setPickupLocation('');
      setDropoffLocation('');
      setSelectedRide(null);
      setSelectedDriver(null);
      setRideTimeOption('now');
      setScheduledDateTime('');
      setRouteInfo(null);
      setCalculatedPrice(null);
      setOrder(null);
      setShowPaymentForm(false);
      
      console.log('Payment success', paymentData);
      alert('Booking confirmed! Your driver will arrive shortly.');
    } catch (err) {
      console.error('payment failed', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const showMap = pickupLocation && dropoffLocation && selectedRide;

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl mb-6 shadow-lg">
            <FaCar className="text-white w-10 h-10" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {currentStep === 'booking' ? 'Book Your Ride' : 
             currentStep === 'drivers' ? 'Choose Your Driver' : 'Booking Confirmed'}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            {currentStep === 'booking' 
              ? 'Experience premium transportation with our reliable and comfortable ride service across Rwanda'
              : currentStep === 'drivers'
              ? 'Select from available drivers near your location'
              : 'Your ride has been successfully booked!'
            }
          </p>
        </div>

        <div className="space-y-8">
          {/* BOOKING FORM */}
          {currentStep === 'booking' && !showPaymentForm && (
            <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-200 shadow-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <LocationInput 
                  label="Pickup Location" 
                  value={pickupLocation} 
                  onChange={setPickupLocation} 
                  placeholder="Enter pickup location in Rwanda" 
                  icon={FaMapMarkerAlt} 
                  error={errors.pickupLocation} 
                />
                <LocationInput 
                  label="Dropoff Location" 
                  value={dropoffLocation} 
                  onChange={setDropoffLocation} 
                  placeholder="Enter dropoff location in Rwanda" 
                  icon={FaMapMarkerAlt} 
                  error={errors.dropoffLocation} 
                />
              </div>

              <div className="mb-8">
                <label className="text-sm font-semibold text-gray-700 mb-4 block">When do you need the ride?</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className={`flex items-center justify-center p-5 border-2 rounded-xl cursor-pointer transition-all duration-200 ${rideTimeOption === 'now' ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'}`}>
                    <input 
                      type="radio" 
                      name="rideTime" 
                      value="now" 
                      checked={rideTimeOption === 'now'} 
                      onChange={() => setRideTimeOption('now')} 
                      className="mr-3 text-blue-500 focus:ring-blue-500" 
                    />
                    <FaClock className="mr-3 text-blue-600 text-lg" />
                    <span className="font-medium">Right Now</span>
                  </label>
                  <label className={`flex items-center justify-center p-5 border-2 rounded-xl cursor-pointer transition-all duration-200 ${rideTimeOption === 'schedule' ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'}`}>
                    <input 
                      type="radio" 
                      name="rideTime" 
                      value="schedule" 
                      checked={rideTimeOption === 'schedule'} 
                      onChange={() => setRideTimeOption('schedule')} 
                      className="mr-3 text-blue-500 focus:ring-blue-500" 
                    />
                    <FaCalendarAlt className="mr-3 text-blue-600 text-lg" />
                    <span className="font-medium">Schedule Later</span>
                  </label>
                </div>
              </div>

              {rideTimeOption === 'schedule' && (
                <div className="mb-8">
                  <DateTimePicker 
                    selectedDateTime={scheduledDateTime}
                    onDateTimeChange={setScheduledDateTime}
                    error={errors.scheduledDateTime}
                  />
                </div>
              )}

              <div className="mb-8">
                <label className="text-xl font-bold text-gray-900 mb-6 block">Choose Your Ride</label>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {rideTypes.map((ride) => {
                    const Icon = ride.icon;
                    const isSelected = selectedRide === ride.id;
                    const price = calculatedPrice && isSelected ? `${calculatedPrice.toLocaleString()} RWF` : ride.basePrice < 2000 ? '15,000-20,000 RWF' : '25,000-35,000 RWF';
                    return (
                      <div 
                        key={ride.id} 
                        onClick={() => setSelectedRide(ride.id)} 
                        className={`cursor-pointer border-2 rounded-xl p-6 transition-all duration-300 ${isSelected ? 'border-blue-500 bg-blue-50 shadow-lg' : 'border-gray-200 hover:border-blue-300 hover:shadow-lg'}`}
                      >
                        <div className="flex items-center mb-4">
                          <div className={`w-12 h-12 flex items-center justify-center rounded-xl mr-4 ${isSelected ? 'bg-blue-600' : 'bg-blue-100'}`}>
                            <Icon className={`text-lg ${isSelected ? 'text-white' : 'text-blue-600'}`} />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-800 text-lg">{ride.name}</h3>
                            <p className="text-gray-600 text-sm">{ride.description}</p>
                          </div>
                        </div>
                        <div className="space-y-2 mb-4">
                          {ride.features.map((f, i) => (
                            <div key={i} className="flex items-center space-x-3">
                              <FaCheckCircle className="w-4 h-4 text-blue-600" />
                              <span className="text-sm text-gray-700">{f.text}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-gray-900 font-bold text-lg">{price}</div>
                          <div className="flex items-center text-blue-600 text-sm font-medium">
                            <FaClock className="w-4 h-4 mr-2" /> {ride.time} ETA
                          </div>
                        </div>
                        {routeInfo && isSelected && (
                          <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-600">
                            <div className="flex justify-between"><span>Distance:</span><span className="font-medium">{routeInfo.distance} km</span></div>
                            <div className="flex justify-between"><span>Est. Time:</span><span className="font-medium">{routeInfo.time} min</span></div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {errors.ride && <p className="text-red-500 text-sm mt-4 font-medium">{errors.ride}</p>}
              </div>

              <div className="flex justify-center">
                <button 
                  onClick={handleSubmit} 
                  disabled={!showMap || isSubmitting || (rideTimeOption === 'schedule' && !scheduledDateTime)}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 sm:px-12 py-4 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <FaSpinner className="animate-spin mr-3" />
                      Finding Drivers...
                    </div>
                  ) : (
                    'Find Available Drivers'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* DRIVERS SELECTION STEP */}
          {currentStep === 'drivers' && (
            <div className="space-y-8">
              <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <button
                      onClick={handleBackToBooking}
                      className="flex items-center text-blue-600 hover:text-blue-700 mr-4 transition-colors duration-200"
                    >
                      <FaArrowLeft className="mr-2" />
                      Back
                    </button>
                    <h2 className="text-2xl font-bold text-gray-800">Available Drivers</h2>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Route</div>
                    <div className="font-semibold text-gray-800">{pickupLocation} → {dropoffLocation}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Drivers List */}
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                      <div className="flex items-center">
                        <FaUser className="text-green-600 mr-3" />
                        <div>
                          <h3 className="font-semibold text-green-800">{drivers.length} Drivers Available</h3>
                          <p className="text-green-600 text-sm">Select a driver to see their details and contact information</p>
                        </div>
                      </div>
                    </div>

                    {driversLoading ? (
                      <div className="flex justify-center items-center py-12">
                        <FaSpinner className="animate-spin text-blue-600 text-2xl mr-3" />
                        <span className="text-gray-600">Loading available drivers...</span>
                      </div>
                    ) : driversError ? (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                        <FaExclamationTriangle className="text-red-500 text-xl mx-auto mb-2" />
                        <p className="text-red-700">{driversError}</p>
                      </div>
                    ) : (
                      drivers.map((driver) => (
                        <DriverCard
                          key={driver.id}
                          driver={driver}
                          isSelected={selectedDriver?.id === driver.id}
                          onSelect={handleDriverSelect}
                          onCall={handleCallDriver}
                        />
                      ))
                    )}
                  </div>

                  {/* Map with Drivers */}
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                      <FaMap className="mr-2 text-blue-600" />
                      Live Driver Locations
                    </h3>
                    <div className="h-96 bg-white rounded-lg border border-gray-300 overflow-hidden">
                      {locationDetails.pickup && locationDetails.dropoff ? (
                        <MapComponent
                          pickupLocation={pickupLocation}
                          dropoffLocation={dropoffLocation}
                          routeInfo={routeInfo}
                          onRouteCalculate={handleRouteCalculate}
                          drivers={drivers}
                          selectedDriver={selectedDriver}
                          pickupCoords={locationDetails.pickup.coordinates}
                          dropoffCoords={locationDetails.dropoff.coordinates}
                        />
                      ) : (
                        <div className="h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
                          <div className="text-center">
                            <FaMap className="text-blue-500 text-4xl mx-auto mb-4" />
                            <p className="text-gray-600 font-medium">Loading map with drivers...</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {selectedDriver && (
                      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-blue-800">Selected Driver</div>
                            <div className="text-sm text-blue-600">{selectedDriver.name} • {selectedDriver.carModel}</div>
                          </div>
                          <button
                            onClick={handleConfirmDriver}
                            disabled={isSubmitting}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors duration-200 disabled:opacity-50"
                          >
                            {isSubmitting ? (
                              <div className="flex items-center">
                                <FaSpinner className="animate-spin mr-2" />
                                Confirming...
                              </div>
                            ) : (
                              'Confirm Driver'
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CONFIRMATION PAGE */}
          {currentStep === 'confirmation' && order && !showPaymentForm && (
            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-lg">
              <div className="text-center mb-8">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FaCheckCircle className="text-green-500 text-4xl" />
                </div>
                <h2 className="text-3xl font-bold text-gray-800 mb-3">
                  Ride {order.immediate ? 'Confirmed!' : 'Scheduled!'}
                </h2>
                <p className="text-gray-600 text-lg">
                  {order.immediate 
                    ? 'Your driver is on the way to pick you up' 
                    : `Your ride is scheduled for ${order.date} at ${order.time}`
                  }
                </p>
              </div>

              {/* Driver Information Card */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
                <h3 className="font-semibold text-gray-800 mb-4 text-lg flex items-center">
                  <FaUser className="mr-2 text-blue-600" />
                  Your Driver
                </h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl mr-4">
                      {order.driver.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 text-lg">{order.driver.name}</h4>
                      <div className="flex items-center text-sm text-gray-600">
                        <FaCar className="mr-2" />
                        <span>{order.driver.carModel} • {order.driver.licensePlate}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <FaStar className="text-yellow-400 mr-1" />
                        <span>{order.driver.rating} • {order.driver.trips} trips</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm text-gray-600 mb-2">
                      <FaMapPin className="text-green-500 inline mr-1" />
                      <span>{order.driver.eta} min away</span>
                    </div>
                    <button 
                      onClick={() => handleCallDriver(order.driver)}
                      className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg font-semibold transition-colors duration-200 flex items-center"
                    >
                      <FaPhoneAlt className="mr-2" />
                      Call Driver
                    </button>
                  </div>
                </div>
              </div>

              {/* Trip Details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                  <h3 className="font-semibold text-gray-800 mb-4 text-lg">Trip Details</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                        Pickup Location
                      </div>
                      <div className="font-medium text-gray-800 ml-6">{order.pickup}</div>
                    </div>
                    <div>
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                        Drop-off Location
                      </div>
                      <div className="font-medium text-gray-800 ml-6">{order.dropoff}</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                      <div><div className="text-sm text-gray-600">Ride Type</div><div className="font-medium text-gray-800">{order.type}</div></div>
                      <div><div className="text-sm text-gray-600">Date</div><div className="font-medium text-gray-800">{order.date}</div></div>
                      <div><div className="text-sm text-gray-600">Time</div><div className="font-medium text-gray-800">{order.time}</div></div>
                      <div><div className="text-sm text-gray-600">Total Fare</div><div className="font-medium text-blue-600 text-lg">{order.price}</div></div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                  <h3 className="font-semibold text-gray-800 mb-4 text-lg">Route Information</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between"><span className="text-gray-600">Distance:</span><span className="font-medium">{order.distance || 'N/A'} km</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Estimated Time:</span><span className="font-medium">{order.duration || 'N/A'} minutes</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Ride Type:</span><span className="font-medium">{order.type}</span></div>
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total Amount:</span>
                        <span className="text-blue-600">{order.price}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={handleNewBooking} 
                  className="flex-1 border-2 border-gray-300 text-gray-700 py-4 rounded-xl font-semibold flex items-center justify-center hover:bg-gray-50 transition-all duration-200"
                >
                  <FaCar className="mr-3" /> Book Another Ride
                </button>
                <button 
                  onClick={handleBookNow} 
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center"
                >
                  <FaCreditCard className="mr-3" /> Proceed to Payment
                </button>
              </div>
            </div>
          )}

          {/* PAYMENT FORM */}
          {showPaymentForm && order && (
            <PaymentForm 
              order={order} 
              onPaymentSubmit={handlePaymentSubmit} 
              onClose={() => setShowPaymentForm(false)} 
              onPaymentSuccess={() => {}} 
              isSubmitting={isSubmitting} 
            />
          )}

          {/* Route Preview - Only show in booking step */}
          {currentStep === 'booking' && showMap && !showPaymentForm && (
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">Route Preview</h3>
                {routeInfo && calculatedPrice && (
                  <div className="bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
                    <div className="text-sm text-blue-700 font-semibold">Estimated: {calculatedPrice.toLocaleString()} RWF</div>
                  </div>
                )}
              </div>

              <div className="h-64 bg-gradient-to-br from-blue-50 to-green-50 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <FaRoute className="text-blue-500 text-4xl mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">Complete booking to see detailed map</p>
                  <p className="text-gray-500 text-sm mt-2">Route: {pickupLocation} → {dropoffLocation}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}