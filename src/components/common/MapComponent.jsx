import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { FaMapMarkerAlt, FaSearch, FaTimes, FaRoute, FaRoad, FaLocationArrow, FaExclamationTriangle } from 'react-icons/fa';

// Custom Hook for API Calls
const useLocationAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const geocodeAddress = useCallback(async (address) => {
    if (!address) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      // Try OpenStreetMap Nominatim first
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address + ', Rwanda')}&limit=1&countrycodes=rw`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          return {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon),
            address: data[0].display_name,
            confidence: data[0].importance || 0.5
          };
        }
      }
      throw new Error('Geocoding failed');
    } catch (err) {
      console.warn('Geocoding failed:', err);
      // Fallback to predefined coordinates
      return getFallbackCoordinates(address);
    } finally {
      setLoading(false);
    }
  }, []);

  const calculateRoute = useCallback(async (startCoords, endCoords) => {
    if (!startCoords || !endCoords) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${startCoords.lng},${startCoords.lat};${endCoords.lng},${endCoords.lat}?overview=full&geometries=geojson`
      );
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.code === 'Ok' && data.routes?.length > 0) {
          const route = data.routes[0];
          return {
            geometry: route.geometry,
            distance: (route.distance / 1000).toFixed(1),
            duration: Math.round(route.duration / 60),
            isAccurate: true
          };
        }
      }
      throw new Error('Routing failed');
    } catch (err) {
      console.warn('Routing failed, using fallback:', err);
      return calculateFallbackRoute(startCoords, endCoords);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    geocodeAddress,
    calculateRoute,
    loading,
    error,
    setError
  };
};

// Custom Hook for Map State Management
const useMapState = (pickupLocation, dropoffLocation, onRouteCalculate) => {
  const [map, setMap] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [routeInfo, setRouteInfo] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [routeLine, setRouteLine] = useState(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);

  const { geocodeAddress, calculateRoute, loading: apiLoading, error: apiError, setError } = useLocationAPI();

  // Clear map elements
  const clearMapElements = useCallback(() => {
    markers.forEach(marker => marker.remove());
    setMarkers([]);
    
    if (routeLine) {
      routeLine.remove();
      setRouteLine(null);
    }
  }, [markers, routeLine]);

  // Add marker to map
  const addMarker = useCallback((latlng, popupContent, color = 'blue') => {
    if (!map) return null;

    const L = window.L;
    const icon = L.divIcon({
      className: `custom-marker-${color}`,
      html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });

    const marker = L.marker(latlng, { icon })
      .addTo(map)
      .bindPopup(popupContent);

    setMarkers(prev => [...prev, marker]);
    return marker;
  }, [map]);

  // Draw route line
  const drawRoute = useCallback((geometry) => {
    if (!map) return null;

    const L = window.L;
    const route = L.geoJSON(geometry, {
      style: {
        color: '#3b82f6',
        weight: 6,
        opacity: 0.8,
        lineCap: 'round',
        lineJoin: 'round'
      }
    }).addTo(map);

    setRouteLine(route);
    return route;
  }, [map]);

  // Fit map to bounds
  const fitMapToBounds = useCallback((items) => {
    if (!map || !items.length) return;

    const L = window.L;
    const group = new L.FeatureGroup(items);
    const bounds = group.getBounds();
    
    if (bounds.isValid()) {
      map.fitBounds(bounds.pad(0.1));
    }
  }, [map]);

  // Calculate route between points
  const calculateAndDisplayRoute = useCallback(async (pickupCoords, dropoffCoords) => {
    if (!pickupCoords || !dropoffCoords) return;

    setIsCalculatingRoute(true);
    setError(null);

    try {
      const routeData = await calculateRoute(pickupCoords, dropoffCoords);
      
      if (routeData) {
        drawRoute(routeData.geometry);
        
        const newRouteInfo = {
          distance: routeData.distance,
          time: routeData.duration,
          isAccurate: routeData.isAccurate || false
        };
        
        setRouteInfo(newRouteInfo);
        
        if (onRouteCalculate) {
          onRouteCalculate(newRouteInfo);
        }
      }
    } catch (err) {
      setError('Failed to calculate route');
      console.error('Route calculation error:', err);
    } finally {
      setIsCalculatingRoute(false);
    }
  }, [calculateRoute, drawRoute, onRouteCalculate, setError]);

  // Update map when locations change
  useEffect(() => {
    if (!map || !mapLoaded || !pickupLocation || !dropoffLocation) return;

    const updateMap = async () => {
      clearMapElements();
      setRouteInfo(null);

      try {
        // Geocode both locations in parallel
        const [pickupData, dropoffData] = await Promise.all([
          geocodeAddress(pickupLocation),
          geocodeAddress(dropoffLocation)
        ]);

        if (!pickupData || !dropoffData) {
          throw new Error('Could not find locations');
        }

        // Add markers
        const pickupMarker = addMarker(
          [pickupData.lat, pickupData.lng],
          `<div class="p-2 min-w-[200px]">
            <strong class="text-green-600">🚗 Pickup</strong><br/>
            <span class="text-sm">${pickupLocation}</span>
          </div>`,
          '#10b981'
        );

        const dropoffMarker = addMarker(
          [dropoffData.lat, dropoffData.lng],
          `<div class="p-2 min-w-[200px]">
            <strong class="text-red-600">🎯 Dropoff</strong><br/>
            <span class="text-sm">${dropoffLocation}</span>
          </div>`,
          '#ef4444'
        );

        // Calculate route
        await calculateAndDisplayRoute(pickupData, dropoffData);

        // Fit map to show all elements
        const mapItems = [pickupMarker, dropoffMarker];
        if (routeLine) mapItems.push(routeLine);
        fitMapToBounds(mapItems);

      } catch (err) {
        setError('Failed to update map with locations');
        console.error('Map update error:', err);
      }
    };

    const timeoutId = setTimeout(updateMap, 500);
    return () => clearTimeout(timeoutId);
  }, [
    map, mapLoaded, pickupLocation, dropoffLocation,
    geocodeAddress, addMarker, calculateAndDisplayRoute,
    fitMapToBounds, clearMapElements, routeLine
  ]);

  return {
    map,
    setMap,
    mapLoaded,
    setMapLoaded,
    routeInfo,
    markers,
    routeLine,
    isCalculatingRoute,
    apiLoading,
    apiError,
    clearMapElements,
    addMarker,
    drawRoute,
    fitMapToBounds
  };
};

// Custom Hook for Map Controls
const useMapControls = (mapState) => {
  const { map, addMarker, fitMapToBounds } = mapState;

  const handleSearch = useCallback(async () => {
    if (!map) return;

    const searchTerm = prompt('Enter location to search in Rwanda:');
    if (!searchTerm) return;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchTerm + ', Rwanda')}&limit=1&countrycodes=rw`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const location = data[0];
          const latlng = [parseFloat(location.lat), parseFloat(location.lon)];
          
          // Add search marker
          addMarker(
            latlng,
            `<div class="p-2">
              <strong class="text-purple-600">🔍 ${searchTerm}</strong><br/>
              <span class="text-sm">${location.display_name}</span>
            </div>`,
            '#8b5cf6'
          );

          // Center map
          map.setView(latlng, 14);
        } else {
          alert('Location not found');
        }
      }
    } catch (err) {
      alert('Search failed. Please try again.');
    }
  }, [map, addMarker]);

  const handleCurrentLocation = useCallback(() => {
    if (!map || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const latlng = [latitude, longitude];
        
        // Add location marker
        addMarker(
          latlng,
          `<div class="p-2">
            <strong class="text-yellow-600">📍 My Location</strong><br/>
            <span class="text-sm">Your current position</span>
          </div>`,
          '#f59e0b'
        );

        // Center map
        map.setView(latlng, 14);
      },
      (error) => {
        alert('Unable to get your location. Please check permissions.');
      }
    );
  }, [map, addMarker]);

  return {
    handleSearch,
    handleCurrentLocation
  };
};

// Helper Functions
const getFallbackCoordinates = (address) => {
  const locations = {
    'kigali': { lat: -1.9441, lng: 30.0588, name: 'Kigali, Rwanda' },
    'kigali airport': { lat: -1.9686, lng: 30.1394, name: 'Kigali International Airport' },
    'kigali convention': { lat: -1.9514, lng: 30.0931, name: 'Kigali Convention Centre' },
    'butare': { lat: -2.5967, lng: 29.7394, name: 'Butare, Rwanda' },
    'rubavu': { lat: -1.7028, lng: 29.2561, name: 'Rubavu, Rwanda' },
    'musanze': { lat: -1.4998, lng: 29.6344, name: 'Musanze, Rwanda' }
  };

  const lowerAddress = address.toLowerCase();
  for (const [key, coords] of Object.entries(locations)) {
    if (lowerAddress.includes(key)) {
      return { ...coords, address: coords.name, confidence: 0.3 };
    }
  }

  return { 
    lat: -1.9441, 
    lng: 30.0588, 
    address: 'Kigali, Rwanda',
    confidence: 0.1 
  };
};

const calculateFallbackRoute = (startCoords, endCoords) => {
  const distance = calculateDistance(startCoords, endCoords);
  const duration = Math.max(Math.round(distance * 2.5), 10);
  
  return {
    geometry: {
      type: 'LineString',
      coordinates: [
        [startCoords.lng, startCoords.lat],
        [endCoords.lng, endCoords.lat]
      ]
    },
    distance: distance.toFixed(1),
    duration: duration,
    isAccurate: false
  };
};

const calculateDistance = (coords1, coords2) => {
  const R = 6371;
  const dLat = deg2rad(coords2.lat - coords1.lat);
  const dLng = deg2rad(coords2.lng - coords1.lng);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(coords1.lat)) * Math.cos(deg2rad(coords2.lat)) * 
    Math.sin(dLng/2) * Math.sin(dLng/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c;
};

const deg2rad = (deg) => deg * (Math.PI/180);

// Main Map Component
const MapComponent = ({ 
  pickupLocation, 
  dropoffLocation, 
  routeInfo: externalRouteInfo,
  onRouteCalculate 
}) => {
  const mapRef = useRef(null);
  
  // Use custom hooks for state management
  const mapState = useMapState(pickupLocation, dropoffLocation, onRouteCalculate);
  const mapControls = useMapControls(mapState);
  
  const { 
    map, setMap, mapLoaded, setMapLoaded, 
    isCalculatingRoute, apiLoading, apiError,
    routeInfo: internalRouteInfo
  } = mapState;
  
  const { handleSearch, handleCurrentLocation } = mapControls;

  // Display route info from props or internal state
  const displayRouteInfo = externalRouteInfo || internalRouteInfo;

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapRef.current || mapLoaded) return;

    const initializeMap = async () => {
      try {
        // Dynamically import Leaflet
        const L = await import('leaflet');
        await import('leaflet/dist/leaflet.css');

        // Fix default markers
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });

        const leafletMap = L.map(mapRef.current).setView([-1.9441, 30.0588], 12);

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 18,
        }).addTo(leafletMap);

        setMap(leafletMap);
        setMapLoaded(true);
      } catch (error) {
        console.error('Map initialization failed:', error);
      }
    };

    initializeMap();

    return () => {
      if (map) {
        map.remove();
      }
    };
  }, [mapLoaded]);

  // Show loading state
  const isLoading = apiLoading || isCalculatingRoute;

  // Show placeholder if no locations selected
  if (!pickupLocation || !dropoffLocation) {
    return (
      <div className="h-64 md:h-96 bg-gray-100 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300">
        <div className="text-center p-8">
          <FaRoute className="text-gray-400 text-4xl mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Route Preview</h3>
          <p className="text-gray-500 text-sm max-w-xs">
            Enter both pickup and dropoff locations to see the route
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-96 md:h-[500px] bg-gray-100 rounded-xl overflow-hidden relative shadow-lg border border-gray-200">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
          <div className="bg-white p-4 rounded-lg flex items-center space-x-3 shadow-lg">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-700 font-medium">
              {isCalculatingRoute ? 'Calculating route...' : 'Loading...'}
            </span>
          </div>
        </div>
      )}
      
      {/* Error Display */}
      {apiError && (
        <div className="absolute top-4 left-4 right-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 z-10">
          <div className="flex items-center">
            <FaExclamationTriangle className="text-yellow-600 mr-3 flex-shrink-0" />
            <span className="text-yellow-700 text-sm font-medium">{apiError}</span>
          </div>
        </div>
      )}
      
      {/* Map Container */}
      <div ref={mapRef} className="w-full h-full" />
      
      {/* Map Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-5">
        <button 
          onClick={handleSearch}
          disabled={isLoading}
          className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors duration-200 border border-gray-200 disabled:opacity-50"
          title="Search location"
        >
          <FaSearch className="text-gray-600 text-sm" />
        </button>
        <button 
          onClick={handleCurrentLocation}
          disabled={isLoading}
          className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors duration-200 border border-gray-200 disabled:opacity-50"
          title="My location"
        >
          <FaLocationArrow className="text-gray-600 text-sm" />
        </button>
      </div>
      
      {/* Route Information Panel */}
      <div className="absolute bottom-4 left-4 bg-white px-4 py-3 rounded-lg shadow-md border border-gray-200 max-w-xs">
        <div className="text-sm font-medium text-gray-700 mb-2">Route Information</div>
        <div className="space-y-2 text-xs text-gray-600">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2 border border-white"></div>
            <span className="font-medium truncate">{pickupLocation}</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2 border border-white"></div>
            <span className="font-medium truncate">{dropoffLocation}</span>
          </div>
          <div className="flex items-center">
            <div className="w-6 h-2 bg-blue-500 rounded mr-2"></div>
            <span className="font-medium">Route Path</span>
          </div>
          
          {displayRouteInfo && (
            <div className="pt-2 border-t border-gray-200 mt-2">
              <div className="grid grid-cols-2 gap-2 text-green-600 font-medium">
                <div className="flex items-center">
                  <FaRoad className="mr-1 text-xs" />
                  <span>{displayRouteInfo.distance} km</span>
                </div>
                <div className="flex items-center">
                  <FaRoute className="mr-1 text-xs" />
                  <span>{displayRouteInfo.time} min</span>
                </div>
              </div>
              {!displayRouteInfo.isAccurate && (
                <div className="text-xs text-yellow-600 mt-1 flex items-center">
                  <FaExclamationTriangle className="mr-1" />
                  Approximate route
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Route Calculation Status */}
      {pickupLocation && dropoffLocation && !displayRouteInfo && !isLoading && mapLoaded && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white bg-opacity-90 px-6 py-4 rounded-lg shadow-lg text-center max-w-xs border border-gray-200">
          <div className="animate-pulse">
            <FaRoute className="text-blue-500 text-2xl mx-auto mb-2" />
            <p className="text-gray-700 text-sm font-medium">
              Calculating optimal route...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapComponent;