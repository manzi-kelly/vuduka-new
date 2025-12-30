// src/components/BookingForm.jsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import apiClient from '../../api/axiosClient';
import { 
  FaCar, FaStar, FaRoad, FaUsers, FaSuitcase, FaShieldAlt, 
  FaCheckCircle, FaClock, FaCalendarAlt, FaMapMarkerAlt, FaTimes,
  FaArrowLeft, FaUser, FaPhone, FaCreditCard, FaRoute,
  FaMap, FaExclamationTriangle, FaPhoneAlt, FaIdCard,
  FaMapPin, FaSpinner, FaInfoCircle, FaLocationArrow, FaCity, FaFlag
} from 'react-icons/fa';

import MapComponent from '../common/MapComponent';
import PaymentForm from './PaymentForm';
import { locationService, locationUtils } from '../../api/locationService';

/* ---------- Custom Hook for Location State Management ---------- */
const useLocationState = () => {
  const [locations, setLocations] = useState({
    pickup: {
      text: '',
      magicKey: null,
      details: null,
      coordinates: null,
      loading: false,
      error: null
    },
    dropoff: {
      text: '',
      magicKey: null,
      details: null,
      coordinates: null,
      loading: false,
      error: null
    }
  });

  const updateLocation = useCallback((type, updates) => {
    setLocations(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        ...updates
      }
    }));
  }, []);

  const clearLocation = useCallback((type) => {
    setLocations(prev => ({
      ...prev,
      [type]: {
        text: '',
        magicKey: null,
        details: null,
        coordinates: null,
        loading: false,
        error: null
      }
    }));
  }, []);

  const fetchLocationDetails = useCallback(async (type, locationData) => {
    if (!locationData) return;
    
    updateLocation(type, { loading: true, error: null });
    
    try {
      let details = null;
      
      // If we have magic key, fetch details from API
      if (locationData.magicKey) {
        console.log(`Fetching details for ${type} with magic key:`, locationData.magicKey);
        details = await locationService.getLocationDetails(locationData.magicKey);
        console.log(`API Response for ${type}:`, details);
      } 
      // If we have coordinates, use reverse geocoding
      else if (locationData.coordinates) {
        const { lat, lng } = locationData.coordinates;
        details = await locationService.getLocationByCoordinates(lat, lng);
      }
      // Otherwise, search for the location text
      else if (locationData.text) {
        console.log(`Searching for location: ${locationData.text}`);
        const searchResults = await locationService.searchLocations(locationData.text, { 
          limit: 1,
          countrycodes: 'rw'
        });
        if (searchResults.length > 0) {
          details = searchResults[0];
        }
      }
      
      if (details) {
        console.log(`Location details fetched for ${type}:`, details);
        
        // Process and store the API data (do not synthesize mock coordinates)
        const processedDetails = {
          id: details.id,
          name: details.name || details.text || locationData.text,
          address: details.address || details.name || locationData.text,
          city: details.city || 'Kigali',
          country: details.country || 'Rwanda',
          countryCode: details.countryCode || 'rw',
          postcode: details.postcode || '',
          type: details.type || 'location',
          importance: details.importance || 0,
          magicKey: details.magicKey || locationData.magicKey,
          // Only use coordinates returned by the API
          coordinates: details.location || null,
          boundingBox: details.boundingBox,
          isMock: !!details.isMock,
          fetchedAt: new Date().toISOString()
        };

        updateLocation(type, {
          details: processedDetails,
          coordinates: processedDetails.coordinates,
          loading: false,
          error: processedDetails.coordinates ? null : 'Location details returned without coordinates'
        });

        return processedDetails;
      } else {
        // No details found — do not create mock data. Set error and leave coordinates null.
        updateLocation(type, {
          details: null,
          coordinates: null,
          loading: false,
          error: 'No location details found for the provided input'
        });
        return null;
      }
      
    } catch (err) {
      console.error(`Error fetching ${type} location details:`, err);
      
      console.error(`Error fetching ${type} location details:`, err);
      updateLocation(type, {
        details: null,
        coordinates: null,
        loading: false,
        error: `Failed to fetch location details: ${err.message}`
      });
      return null;
    }
  }, [updateLocation]);

  return {
    locations,
    updateLocation,
    clearLocation,
    fetchLocationDetails
  };
};

/* ---------- Custom Hook for Routing ---------- */
const useRouting = () => {
  const [routeInfo, setRouteInfo] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState(null);

  // Function to calculate route using the routing API
  const calculateRoute = useCallback(async (startCoords, endCoords, startTime = 'now') => {
    if (!startCoords || !endCoords) {
      setRouteError('Both start and end coordinates are required');
      return null;
    }

    setRouteLoading(true);
    setRouteError(null);

    try {
     
      // Prepare the request payload
      console.log('Calculating route');
      // Call the routing API via centralized client
      const response = await locationService.findRoute(
        `${startCoords.lat},${startCoords.lng} ; ${endCoords.lat},${endCoords.lng}`,
         startTime
      );
      console.log('Routing API response:', response);

      if (response && response.length > 0) {
        const routeFeature = response[0];
        const attributes = routeFeature.attributes || {};
        const geometry = routeFeature.geometry || {};
        
        // Extract coordinates from geometry.paths (ArcGIS format)
        // paths is an array of arrays, where each path is an array of [lng, lat] coordinates
        let coordinates = [];
        if (geometry.paths && geometry.paths.length > 0) {
          // Flatten all paths and convert [lng, lat] to {lat, lng}
          coordinates = geometry.paths.flat().map(coord => ({
            lat: coord[1],
            lng: coord[0]
          }));
        }

        // Extract route information from ArcGIS response
        const distanceKm = parseFloat((attributes.Total_Kilometers || 0).toFixed(1));
        const timeSeconds = attributes.Total_TravelTime || 0;
        const timeMinutes = Math.ceil(timeSeconds);

        const processedRouteInfo = {
          distance: attributes.Total_Kilometers || 0,
          time: timeSeconds,
          distanceKm: distanceKm,
          timeMinutes: timeMinutes,
          coordinates: coordinates,
          paths: geometry.paths || [],
          routeName: attributes.Name || 'Route',
          stopCount: attributes.StopCount || 2,
          isMock: false,
          apiResponse: routeFeature
        };

        setRouteInfo(processedRouteInfo);
        console.log('Processed route info:', processedRouteInfo);
        return processedRouteInfo;
      } else {
        throw new Error('No route found in API response');
      }
    } catch (error) {
      console.error('Routing API error:', error);
      
      let errorMessage = 'Failed to calculate route';
      if (error.response) {
        errorMessage = `Routing API error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`;
      } else if (error.request) {
        errorMessage = 'No response from routing server. Please check your connection.';
      } else {
        errorMessage = `Routing error: ${error.message}`;
      }

      setRouteError(errorMessage);
      
      // Fallback to mock data if API fails
      const distance = locationUtils?.calculateDistance?.(startCoords, endCoords) || Math.floor(Math.random() * 30) + 5;
      const mockRouteInfo = {
        distance: distance,
        time: Math.floor(distance * 2) + 15,
        distanceKm: distance,
        timeMinutes: Math.floor(distance * 2) + 15,
        coordinates: [],
        paths: [],
        isMock: true,
        error: errorMessage
      };
      
      setRouteInfo(mockRouteInfo);
      return mockRouteInfo;
    } finally {
      setRouteLoading(false);
    }
  }, []);

  // Function to clear route
  const clearRoute = useCallback(() => {
    setRouteInfo(null);
    setRouteError(null);
  }, []);

  return {
    routeInfo,
    routeLoading,
    routeError,
    calculateRoute,
    clearRoute
  };
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
      await new Promise(resolve => setTimeout(resolve, 1200));
      
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

/* ---------- LocationDetailsPanel Component ---------- */
const LocationDetailsPanel = ({ location, type, onClose }) => {
  if (!location || !location.details) return null;

  const details = location.details;
  console.log('Rendering LocationDetailsPanel with details:', details);
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800 flex items-center">
          <FaInfoCircle className="mr-2 text-blue-600" />
          {type === 'pickup' ? 'Pickup Location Details' : 'Dropoff Location Details'}
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FaTimes />
          </button>
        )}
      </div>
      
      <div className="space-y-3">
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center text-sm text-gray-600 mb-1">
              <FaMapMarkerAlt className="mr-2 text-blue-500" />
              Location
            </div>
            <div className="font-medium text-gray-800 truncate">{details.name}</div>
          </div>
          
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="flex items-center text-sm text-gray-600 mb-1">
              <FaCity className="mr-2 text-green-500" />
              City
            </div>
            <div className="font-medium text-gray-800">{details.city}</div>
          </div>
        </div>
        
        {/* Address */}
        {details.address && (
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Full Address</div>
            <div className="font-medium text-gray-800">{details.address}</div>
          </div>
        )}
        
        {/* Coordinates */}
        {details.coordinates && (
          <div className="bg-purple-50 p-3 rounded-lg">
            <div className="flex items-center text-sm text-gray-600 mb-1">
              <FaLocationArrow className="mr-2 text-purple-500" />
              Coordinates
            </div>
            <div className="font-mono text-sm text-gray-800">
              {details.coordinates.lat.toFixed(6)}, {details.coordinates.lng.toFixed(6)}
            </div>
          </div>
        )}
        
        {/* Additional Details */}
        <div className="grid grid-cols-3 gap-2 text-sm">
          {details.country && (
            <div className="flex items-center">
              <FaFlag className="mr-1 text-gray-400" />
              <span className="text-gray-600">{details.country}</span>
            </div>
          )}
          
          {details.type && (
            <div className="text-gray-600">
              Type: <span className="font-medium">{details.type}</span>
            </div>
          )}
          
          {details.postcode && (
            <div className="text-gray-600">
              Postal: <span className="font-medium">{details.postcode}</span>
            </div>
          )}
        </div>
        
        {/* API Metadata */}
        <div className="pt-3 border-t border-gray-200 text-xs text-gray-500">
          <div className="flex justify-between">
            <span>Magic Key: {details.magicKey ? details.magicKey.substring(0, 15) + '...' : 'N/A'}</span>
            <span>Source: {details.isMock ? 'Mock Data' : 'API'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------- LocationInput component ---------- */
const LocationInput = ({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  icon: Icon, 
  error,
  onLocationSelect,
  locationDetails,
  loading: externalLoading
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

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
      console.log(`Fetching suggestions for: "${q}"`);
      const data = await locationService.getSuggestions(q, abortRef.current.signal);
      console.log('Suggestions received:', data);
      setSuggestions(Array.isArray(data) ? data : []);
      setShowSuggestions(true);
    } catch (err) {
      if (err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError' || err?.name === 'AbortError') {
        // Request was cancelled, ignore
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
    setShowDetails(false);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(val);
    }, 350);
  };

  const handleSuggestionClick = async (suggestion) => {
    const text = suggestion.text || suggestion.name || suggestion.display_name || String(suggestion);
    const magicKey = suggestion.magicKey || suggestion.magic_key;
    
    onChange(text);
    setShowSuggestions(false);
    setSuggestions([]);
    setApiError(null);
    setShowDetails(true);
    
    // Call parent handler with the selected suggestion data
    if (onLocationSelect) {
      onLocationSelect({
        text,
        magicKey,
        suggestionData: suggestion,
        coordinates: suggestion.coordinates
      });
    }
  };

  const handleClear = () => {
    onChange('');
    if (onLocationSelect) {
      onLocationSelect(null);
    }
    setSuggestions([]);
    setShowSuggestions(false);
    setApiError(null);
    setShowDetails(false);
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

      {(isLoading || externalLoading) && (
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
          {suggestions.map((suggestion, index) => {
            const text = suggestion.text || suggestion.name || suggestion.display_name || String(suggestion);
            const hasMagicKey = suggestion.magicKey || suggestion.magic_key;
            const city = suggestion.city || suggestion.town || suggestion.village;
            
            return (
              <div
                key={suggestion.id || index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors duration-150 border-b border-gray-100 last:border-b-0"
              >
                <div className="flex items-start">
                  <FaMapMarkerAlt className={`mt-1 mr-3 flex-shrink-0 ${hasMagicKey ? 'text-green-500' : 'text-blue-500'}`} />
                  <div className="flex-1">
                    <div className="flex items-center">
                      <span className="text-gray-800 font-medium">{text}</span>
                      {hasMagicKey && (
                        <span className="ml-2 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
                          Verified
                        </span>
                      )}
                    </div>
                    {city && (
                      <div className="text-sm text-gray-500 mt-1 flex items-center">
                        <FaCity className="mr-1" size={12} />
                        {city}, Rwanda
                      </div>
                    )}
                    {suggestion.type && (
                      <div className="text-xs text-gray-400 mt-1">
                        Type: {suggestion.type}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {error && <p className="text-red-500 text-sm mt-2 font-medium">{error}</p>}
      
      {/* Show details panel when location is selected and has details */}
      {showDetails && locationDetails && (
        <div className="mt-3">
          <LocationDetailsPanel 
            location={{ details: locationDetails }} 
            type={label.toLowerCase().includes('pickup') ? 'pickup' : 'dropoff'}
            onClose={() => setShowDetails(false)}
          />
        </div>
      )}
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

/* ---------- RouteDetails Component ---------- */
const RouteDetails = ({ routeInfo, routeLoading, routeError, onRecalculate }) => {
  if (routeLoading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-4">
        <div className="flex items-center justify-center">
          <FaSpinner className="animate-spin text-blue-600 mr-3" />
          <span className="text-blue-700 font-medium">Calculating optimal route...</span>
        </div>
      </div>
    );
  }

  if (routeError) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-4">
        <div className="flex items-start">
          <FaExclamationTriangle className="text-yellow-500 mr-3 mt-1 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-yellow-800 mb-2">Route Calculation Issue</h3>
            <p className="text-yellow-700 mb-3">{routeError}</p>
            {onRecalculate && (
              <button
                onClick={onRecalculate}
                className="bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-lg font-semibold transition-colors duration-200"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!routeInfo) return null;

  return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800 text-lg flex items-center">
          <FaRoute className="mr-2 text-green-600" />
          Route Details
        </h3>
        {routeInfo.isMock && (
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
            Estimated Route
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-white p-3 rounded-lg border border-green-100">
          <div className="text-sm text-gray-600 mb-1">Distance</div>
          <div className="text-xl font-bold text-gray-800">{routeInfo.distanceKm?.toFixed(1) || routeInfo.distance} km</div>
        </div>
        
        <div className="bg-white p-3 rounded-lg border border-green-100">
          <div className="text-sm text-gray-600 mb-1">Est. Time</div>
          <div className="text-xl font-bold text-gray-800">{routeInfo.timeMinutes || routeInfo.time} min</div>
        </div>
        
        <div className="bg-white p-3 rounded-lg border border-green-100">
          <div className="text-sm text-gray-600 mb-1">Route Type</div>
          <div className="text-lg font-semibold text-gray-800">Optimal</div>
        </div>
        
        <div className="bg-white p-3 rounded-lg border border-green-100">
          <div className="text-sm text-gray-600 mb-1">Status</div>
          <div className="text-lg font-semibold text-green-600">
            {routeInfo.isMock ? 'Estimated' : 'Calculated'}
          </div>
        </div>
      </div>
      
      {routeInfo.summary && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-700 mb-2">Route Summary</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <div className="flex justify-between">
              <span>Roads:</span>
              <span className="font-medium">
                {Object.entries(routeInfo.summary.road_types || {}).map(([type, value]) => (
                  <span key={type} className="ml-2">{type}: {value}</span>
                ))}
              </span>
            </div>
            {routeInfo.summary.instructions && (
              <div className="mt-2">
                <div className="font-medium mb-1">Key Instructions:</div>
                <ul className="list-disc list-inside space-y-1">
                  {routeInfo.summary.instructions.slice(0, 3).map((instruction, idx) => (
                    <li key={idx} className="text-gray-600">{instruction}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="mt-4 text-xs text-gray-500 flex justify-between">
        <span>Route ID: {routeInfo.isMock ? 'MOCK-' + Date.now() : 'API-' + Date.now()}</span>
        <span>Updated: {new Date().toLocaleTimeString()}</span>
      </div>
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
  // Step management
  const [currentStep, setCurrentStep] = useState('booking');
  
  // Location state using custom hook
  const { 
    locations, 
    updateLocation, 
    clearLocation, 
    fetchLocationDetails 
  } = useLocationState();
  
  // Routing state using custom hook
  const { 
    routeInfo, 
    routeLoading, 
    routeError, 
    calculateRoute, 
    clearRoute 
  } = useRouting();
  
  // Other state
  const [selectedRide, setSelectedRide] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [order, setOrder] = useState(null);
  const [errors, setErrors] = useState({});
  const [rideTimeOption, setRideTimeOption] = useState('now');
  const [scheduledDateTime, setScheduledDateTime] = useState('');
  const [calculatedPrice, setCalculatedPrice] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const { drivers, loading: driversLoading, error: driversError, fetchNearbyDrivers } = useDrivers();

  const rideTypes = [
    { id: 'economy', name: 'Economy', icon: FaCar, basePrice: 1500, time: '5 min', description: 'Affordable everyday rides', features: [{ text: 'AC' }, { text: 'Standard Comfort' }, { text: 'Safe Ride' }] },
    { id: 'premium', name: 'Premium', icon: FaStar, basePrice: 2500, time: '7 min', description: 'Luxury comfort rides', features: [{ text: 'Premium Car' }, { text: 'Top Rated Driver' }, { text: 'Luxury Interior' }] },
    { id: 'suv', name: 'SUV', icon: FaRoad, basePrice: 3000, time: '10 min', description: 'Spacious for groups', features: [{ text: '6-8 Seats' }, { text: 'Extra Luggage Space' }, { text: 'Family Friendly' }] },
  ];

  // Handle location selection from input
  const handleLocationSelect = useCallback(async (type, locationData) => {
    if (!locationData) {
      updateLocation(type, {
        text: '',
        magicKey: null,
        details: null,
        coordinates: null
      });
      clearRoute();
      return;
    }

    // Set loading state while we fetch authoritative details
    updateLocation(type, {
      text: locationData.text,
      magicKey: locationData.magicKey,
      loading: true,
      error: null
    });

    // Prefer authoritative API details when magicKey is available
    let details = null;
    try {
      if (locationData.magicKey) {
        // If the suggestion has a magicKey, fetch authoritative details from API
        console.log(`Fetching authoritative details for location with magicKey: ${locationData.magicKey}`);
        details = await locationService.getLocationDetails(locationData.magicKey);
        console.log('Authoritative location details received:', details);
      } 
    } catch (e) {
      console.error('Error fetching selected location details:', e);
      details = null;
    }

    if (details) {
      const finalDetails = {
        id: details.id,
        name: details.name || details.text || locationData.text,
        address: details.address || details.name || locationData.text,
        city: details.city || '',
        country: details.country || '',
        importance: details.importance || 0,
        magicKey: details.magicKey || locationData.magicKey,
        coordinates: details.coordinates || null,
        fetchedAt: new Date().toISOString()
      };

      updateLocation(type, {
        text: finalDetails.name || locationData.text,
        magicKey: finalDetails.magicKey,
        details: finalDetails,
        coordinates: finalDetails.coordinates,
        loading: false,
        error: finalDetails.coordinates ? null : 'Location returned without coordinates'
      });

      // If both locations now have coordinates, calculate route
      const otherType = type === 'pickup' ? 'dropoff' : 'pickup';
      if (finalDetails.coordinates && locations[otherType]?.coordinates) {
        await handleRouteCalculation();
      }
    } else {
      updateLocation(type, {
        loading: false,
        details: null,
        coordinates: null,
        error: 'Failed to retrieve location details from API'
      });
    }
  }, [locations, fetchLocationDetails, updateLocation, clearRoute]);

  // Calculate route using the routing API
  const handleRouteCalculation = useCallback(async () => {
    if (!locations.pickup.coordinates || !locations.dropoff.coordinates) {
      return;
    }

    const startTime = rideTimeOption === 'now' ? 'now' : scheduledDateTime;
    const routeData = await calculateRoute(
      locations.pickup.coordinates,
      locations.dropoff.coordinates,
      startTime
    );

    // Calculate price if ride is selected and route data is available
    if (selectedRide && routeData) {
      const ride = rideTypes.find(r => r.id === selectedRide);
      const baseFare = 2000;
      const distanceFare = (routeData.distanceKm || routeData.distance) * ride.basePrice;
      const total = Math.round((baseFare + distanceFare) / 500) * 500;
      setCalculatedPrice(total);
    }

    return routeData;
  }, [locations, selectedRide, rideTimeOption, scheduledDateTime, calculateRoute, rideTypes]);

  // Recalculate route
  const handleRecalculateRoute = useCallback(async () => {
    await handleRouteCalculation();
  }, [handleRouteCalculation]);

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    if (!locations.pickup.text.trim()) newErrors.pickupLocation = 'Pickup location is required';
    if (!locations.dropoff.text.trim()) newErrors.dropoffLocation = 'Dropoff location is required';
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

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // Ensure we have location details for both pickup and dropoff
      if (!locations.pickup.details && locations.pickup.text) {
        await fetchLocationDetails('pickup', {
          text: locations.pickup.text,
          magicKey: locations.pickup.magicKey
        });
      }
      
      if (!locations.dropoff.details && locations.dropoff.text) {
        await fetchLocationDetails('dropoff', {
          text: locations.dropoff.text,
          magicKey: locations.dropoff.magicKey
        });
      }

      // Calculate route if not already calculated
      if (!routeInfo) {
        await handleRouteCalculation();
      }

      // Fetch nearby drivers based on pickup location
      const pickupCoords = locations.pickup.coordinates;
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
        pickup: {
          text: locations.pickup.text,
          details: locations.pickup.details
        },
        dropoff: {
          text: locations.dropoff.text,
          details: locations.dropoff.details
        },
        type: ride ? ride.name : selectedRide,
        price,
        date: displayDate,
        time: displayTime,
        immediate: isImmediate,
        scheduledDateTime: isImmediate ? null : scheduledDateTime,
        distance: routeInfo?.distanceKm || routeInfo?.distance,
        duration: routeInfo?.timeMinutes || routeInfo?.time,
        routeInfo: routeInfo,
        timestamp: new Date().toISOString(),
        status: isImmediate ? 'confirmed' : 'scheduled',
        driver: selectedDriver,
        coordinates: {
          pickup: locations.pickup.coordinates,
          dropoff: locations.dropoff.coordinates
        }
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
    clearLocation('pickup');
    clearLocation('dropoff');
    clearRoute();
    setSelectedRide(null);
    setSelectedDriver(null);
    setRideTimeOption('now');
    setScheduledDateTime('');
    setCalculatedPrice(null);
    setOrder(null);
    setShowPaymentForm(false);
  };

  const handlePaymentSubmit = async (paymentData) => {
    setIsSubmitting(true);
    try {
      await new Promise(res => setTimeout(res, 1200));
      
      handleNewBooking();
      
      console.log('Payment success', paymentData);
      alert('Booking confirmed! Your driver will arrive shortly.');
    } catch (err) {
      console.error('payment failed', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if we should show the map
  const showMap = locations.pickup.text && locations.dropoff.text && selectedRide;

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
                  value={locations.pickup.text} 
                  onChange={(value) => updateLocation('pickup', { text: value })} 
                  onLocationSelect={(data) => handleLocationSelect('pickup', data)}
                  locationDetails={locations.pickup.details}
                  loading={locations.pickup.loading}
                  placeholder="Enter pickup location in Rwanda" 
                  icon={FaMapMarkerAlt} 
                  error={errors.pickupLocation} 
                />
                <LocationInput 
                  label="Dropoff Location" 
                  value={locations.dropoff.text} 
                  onChange={(value) => updateLocation('dropoff', { text: value })} 
                  onLocationSelect={(data) => handleLocationSelect('dropoff', data)}
                  locationDetails={locations.dropoff.details}
                  loading={locations.dropoff.loading}
                  placeholder="Enter dropoff location in Rwanda" 
                  icon={FaMapMarkerAlt} 
                  error={errors.dropoffLocation} 
                />
              </div>

              {/* Location Details Summary */}
              {(locations.pickup.details || locations.dropoff.details) && (
                <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <h3 className="font-semibold text-gray-800 mb-3">Location Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {locations.pickup.details && (
                      <div className="text-sm">
                        <div className="flex items-center text-gray-600 mb-1">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                          <span className="font-medium">Pickup:</span>
                        </div>
                        <div className="ml-4">
                          <div className="text-gray-800">{locations.pickup.details.name}</div>
                          <div className="text-gray-500 text-xs">
                            {locations.pickup.details.city}, {locations.pickup.details.country}
                            {locations.pickup.details.coordinates && (
                              <span className="ml-2">📍 {locations.pickup.details.coordinates.lat.toFixed(4)}, {locations.pickup.details.coordinates.lng.toFixed(4)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    {locations.dropoff.details && (
                      <div className="text-sm">
                        <div className="flex items-center text-gray-600 mb-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                          <span className="font-medium">Dropoff:</span>
                        </div>
                        <div className="ml-4">
                          <div className="text-gray-800">{locations.dropoff.details.name}</div>
                          <div className="text-gray-500 text-xs">
                            {locations.dropoff.details.city}, {locations.dropoff.details.country}
                            {locations.dropoff.details.coordinates && (
                              <span className="ml-2">📍 {locations.dropoff.details.coordinates.lat.toFixed(4)}, {locations.dropoff.details.coordinates.lng.toFixed(4)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

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
                            <div className="flex justify-between">
                              <span>Distance:</span>
                              <span className="font-medium">{routeInfo.distanceKm?.toFixed(1) || routeInfo.distance} km</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Est. Time:</span>
                              <span className="font-medium">{routeInfo.timeMinutes || routeInfo.time} min</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {errors.ride && <p className="text-red-500 text-sm mt-4 font-medium">{errors.ride}</p>}
              </div>

              {/* Route Details Section */}
              {locations.pickup.coordinates && locations.dropoff.coordinates && (
                <div className="mb-8">
                  <RouteDetails 
                    routeInfo={routeInfo}
                    routeLoading={routeLoading}
                    routeError={routeError}
                    onRecalculate={handleRecalculateRoute}
                  />
                </div>
              )}

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
                    <div className="font-semibold text-gray-800">{locations.pickup.text} → {locations.dropoff.text}</div>
                    {routeInfo && (
                      <div className="text-xs text-gray-500">
                        {routeInfo.distanceKm?.toFixed(1) || routeInfo.distance} km • {routeInfo.timeMinutes || routeInfo.time} min
                      </div>
                    )}
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

                  {/* Map with Drivers and Route */}
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                      <FaMap className="mr-2 text-blue-600" />
                      Live Driver Locations & Route
                    </h3>
                    <div className="h-96 bg-white rounded-lg border border-gray-300 overflow-hidden">
                      {locations.pickup.coordinates && locations.dropoff.coordinates ? (
                        <MapComponent
                          pickupLocation={locations.pickup.text}
                          dropoffLocation={locations.dropoff.text}
                          routeInfo={routeInfo}
                          drivers={drivers}
                          selectedDriver={selectedDriver}
                          pickupCoords={locations.pickup.coordinates}
                          dropoffCoords={locations.dropoff.coordinates}
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
                    
                    {routeInfo && (
                      <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center">
                            <FaRoute className="text-blue-500 mr-2" />
                            <span className="font-medium">Route:</span>
                            <span className="ml-2">{routeInfo.distanceKm?.toFixed(1) || routeInfo.distance} km</span>
                          </div>
                          <div className="flex items-center">
                            <FaClock className="text-green-500 mr-2" />
                            <span className="font-medium">Time:</span>
                            <span className="ml-2">{routeInfo.timeMinutes || routeInfo.time} min</span>
                          </div>
                          {calculatedPrice && (
                            <div className="flex items-center">
                              <FaCreditCard className="text-purple-500 mr-2" />
                              <span className="font-medium">Fare:</span>
                              <span className="ml-2 text-blue-600 font-bold">{calculatedPrice.toLocaleString()} RWF</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
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
                      <div className="font-medium text-gray-800 ml-6">{order.pickup.text}</div>
                      {order.pickup.details?.address && (
                        <div className="text-sm text-gray-500 ml-6 mt-1">{order.pickup.details.address}</div>
                      )}
                      {order.coordinates?.pickup && (
                        <div className="text-xs text-gray-400 ml-6 mt-1">
                          📍 {order.coordinates.pickup.lat.toFixed(6)}, {order.coordinates.pickup.lng.toFixed(6)}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                        Drop-off Location
                      </div>
                      <div className="font-medium text-gray-800 ml-6">{order.dropoff.text}</div>
                      {order.dropoff.details?.address && (
                        <div className="text-sm text-gray-500 ml-6 mt-1">{order.dropoff.details.address}</div>
                      )}
                      {order.coordinates?.dropoff && (
                        <div className="text-xs text-gray-400 ml-6 mt-1">
                          📍 {order.coordinates.dropoff.lat.toFixed(6)}, {order.coordinates.dropoff.lng.toFixed(6)}
                        </div>
                      )}
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
                    {order.routeInfo?.summary && (
                      <div className="pt-3 border-t border-gray-200">
                        <div className="text-sm text-gray-600 mb-2">Route Summary:</div>
                        <div className="text-xs text-gray-500">
                          {order.routeInfo.isMock ? 'Estimated route' : 'Calculated by routing service'}
                        </div>
                      </div>
                    )}
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
        </div>
      </div>
    </section>
  );
}