import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  FaMapMarkerAlt, 
  FaTimes, 
  FaExclamationTriangle, 
  FaSearch,
  FaSpinner,
  FaMapPin,
  FaCheckCircle,
  FaHistory,
  FaRoute,
  FaStar,
  FaClock,
  FaCar,
  FaLocationArrow,
  FaCity,
  FaFlag,
  FaInfoCircle
} from 'react-icons/fa';
import { locationService, locationUtils } from '../../api/locationService';

const LocationInput = ({ 
  label, 
  value, 
  onChange,
  onLocationSelect, // New: For API location data
  placeholder, 
  icon: Icon, 
  error,
  className = '',
  disabled = false,
  required = false,
  type = 'pickup', // 'pickup', 'dropoff', or 'search'
  showHistory = true,
  autoFocus = false,
  showClearButton = true,
  suggestionsLimit = 10,
  enableCoordinates = true, // Allow coordinate input
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [usingMockData, setUsingMockData] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [locationDetails, setLocationDetails] = useState(null);
  const [searchMode, setSearchMode] = useState('address'); // 'address' or 'coordinates'

  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const abortRef = useRef(null);
  const debounceRef = useRef(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recent_location_searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse recent searches:', e);
      }
    }
  }, []);

  // Save to recent searches
  const saveToRecentSearches = useCallback((location) => {
    if (!location) return;
    
    const searchText = typeof location === 'string' 
      ? location 
      : location.text || location.name || location.display_name || 'Unknown';
    
    const newSearch = {
      id: `recent-${Date.now()}`,
      text: searchText,
      timestamp: new Date().toISOString(),
      type: 'recent'
    };

    setRecentSearches(prev => {
      // Remove duplicates and keep only last 10
      const filtered = prev.filter(item => 
        item.text.toLowerCase() !== searchText.toLowerCase()
      );
      const updated = [newSearch, ...filtered].slice(0, 10);
      localStorage.setItem('recent_location_searches', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Fetch suggestions
  const fetchSuggestions = useCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      setSearchError(null);
      return;
    }

    // Cancel previous request
    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();

    setIsLoading(true);
    setSearchError(null);
    setUsingMockData(false);

    try {
      console.log(`Fetching suggestions for: "${query}"`);
      
      // Check if input is coordinates
      if (enableCoordinates && locationUtils.isCoordinate(query)) {
        const coord = locationUtils.parseCoordinate(query);
        if (coord) {
          const result = await locationService.getLocationByCoordinates(
            coord.lat,
            coord.lng,
            abortRef.current.signal
          );
          
          if (result) {
            const coordinateSuggestion = {
              id: `coord-${Date.now()}`,
              text: `${coord.lat.toFixed(6)}, ${coord.lng.toFixed(6)}`,
              name: result.name || result.address || 'Location',
              address: result.address || 'Coordinates',
              city: result.city || 'Unknown',
              country: result.country || 'Unknown',
              coordinates: result.coordinates || coord,
              type: 'coordinates',
              isCoordinates: true,
              details: result,
              isMock: result.isMock || false
            };
            
            setSuggestions([coordinateSuggestion]);
            setShowSuggestions(true);
            setUsingMockData(result.isMock || false);
          }
        }
      } else {
        // Regular address search
        const data = await locationService.getSuggestions(
          query, 
          abortRef.current.signal
        );
        
        console.log('Suggestions received:', data);
        
        // Enhance suggestions with additional data
        const enhancedSuggestions = data.map((suggestion, index) => ({
          ...suggestion,
          id: suggestion.id || `suggestion-${Date.now()}-${index}`,
          text: suggestion.text || suggestion.name || suggestion.display_name || '',
          city: suggestion.city || suggestion.town || suggestion.village || '',
          country: suggestion.country || 'Rwanda',
          type: suggestion.type || 'location',
          isMock: suggestion.isMock || false,
          hasMagicKey: !!(suggestion.magicKey || suggestion.magic_key),
          importance: suggestion.importance || 0,
          coordinates: suggestion.coordinates
        }));

        // Sort by importance/type
        const sortedSuggestions = enhancedSuggestions.sort((a, b) => {
          // Priority: has coordinates > has magic key > higher importance
          if (a.coordinates && !b.coordinates) return -1;
          if (!a.coordinates && b.coordinates) return 1;
          if (a.hasMagicKey && !b.hasMagicKey) return -1;
          if (!a.hasMagicKey && b.hasMagicKey) return 1;
          return (b.importance || 0) - (a.importance || 0);
        });

        setSuggestions(sortedSuggestions.slice(0, suggestionsLimit));
        setShowSuggestions(true);
        setUsingMockData(enhancedSuggestions.some(s => s.isMock));
      }
    } catch (err) {
      if (err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError' || err?.name === 'AbortError') {
        // Request was cancelled, ignore
        return;
      }
      
      console.error('Suggestion API error:', err);
      setSearchError({
        message: 'Failed to load suggestions',
        details: err.message,
        isNetworkError: !err.response,
      });
      
      // Fallback to mock suggestions
      try {
        const mockSuggestions = await locationService._getMockSuggestions(query);
        setSuggestions(mockSuggestions.slice(0, suggestionsLimit));
        setShowSuggestions(true);
        setUsingMockData(true);
      } catch (mockErr) {
        setSuggestions([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [enableCoordinates, suggestionsLimit]);

  // Debounced search
  const debouncedSearch = useCallback((query) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(query);
    }, 300);
  }, [fetchSuggestions]);

  // Handle input change
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);
    setSelectedSuggestion(null);
    setLocationDetails(null);
    setSearchError(null);
    
    debouncedSearch(newValue);
  };

  // Fetch location details for selected suggestion
  const fetchLocationDetails = useCallback(async (suggestion) => {
    if (!suggestion) return null;
    
    setIsLoading(true);
    
    try {
      let details = null;
      
      // If suggestion has magic key, get details
      if (suggestion.magicKey || suggestion.magic_key) {
        details = await locationService.getLocationDetails(
          suggestion.magicKey || suggestion.magic_key
        );
      } 
      // If suggestion has coordinates, get reverse geocode
      else if (suggestion.coordinates) {
        const { lat, lng } = suggestion.coordinates;
        details = await locationService.getLocationByCoordinates(lat, lng);
      }
      // Otherwise, search for the location
      else if (suggestion.text) {
        const searchResults = await locationService.searchLocations(
          suggestion.text, 
          { limit: 1, countrycodes: 'rw' }
        );
        if (searchResults.length > 0) {
          details = searchResults[0];
        }
      }
      
      if (details) {
        console.log('Location details fetched:', details);
        return details;
      }
    } catch (err) {
      console.error('Failed to fetch location details:', err);
    } finally {
      setIsLoading(false);
    }
    
    return null;
  }, []);

  // Handle suggestion click
  const handleSuggestionClick = async (suggestion) => {
    const displayText = suggestion.text || suggestion.name || suggestion.display_name;
    
    // Update input value
    onChange(displayText);
    setSelectedSuggestion(suggestion);
    setShowSuggestions(false);
    saveToRecentSearches(suggestion);
    
    // Fetch detailed location info
    const details = await fetchLocationDetails(suggestion);
    setLocationDetails(details);
    
    // Pass location data to parent
    if (onLocationSelect) {
      onLocationSelect({
        text: displayText,
        suggestion: suggestion,
        details: details,
        coordinates: details?.coordinates || suggestion.coordinates,
        magicKey: suggestion.magicKey || suggestion.magic_key
      });
    }
  };

  // Handle recent search click
  const handleRecentSearchClick = (searchItem) => {
    onChange(searchItem.text);
    setShowSuggestions(false);
    
    if (onLocationSelect) {
      onLocationSelect({
        text: searchItem.text,
        isRecentSearch: true
      });
    }
  };

  // Handle focus
  const handleFocus = () => {
    setShowSuggestions(true);
    if (value && value.length >= 2) {
      debouncedSearch(value);
    }
  };

  // Handle blur
  const handleBlur = () => {
    setTimeout(() => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(document.activeElement)) {
        setShowSuggestions(false);
      }
    }, 200);
  };

  // Handle clear
  const handleClear = () => {
    onChange('');
    setSelectedSuggestion(null);
    setLocationDetails(null);
    setSuggestions([]);
    setShowSuggestions(false);
    setSearchError(null);
    
    if (abortRef.current) {
      abortRef.current.abort();
    }
    
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Handle key down
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
      if (abortRef.current) {
        abortRef.current.abort();
      }
    }
    if (e.key === 'Enter' && suggestions.length > 0 && showSuggestions) {
      handleSuggestionClick(suggestions[0]);
    }
    if (e.key === 'Tab' && showSuggestions) {
      setShowSuggestions(false);
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Auto-focus
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Render suggestion with enhanced UI
  const renderSuggestion = (suggestion, index, isRecent = false) => {
    const text = suggestion.text || suggestion.name || suggestion.display_name;
    const city = suggestion.city || suggestion.town || suggestion.village;
    const country = suggestion.country;
    const type = suggestion.type || 'location';
    const isMock = suggestion.isMock;
    const hasMagicKey = suggestion.hasMagicKey || suggestion.magicKey || suggestion.magic_key;
    const isCoordinates = suggestion.isCoordinates || suggestion.type === 'coordinates';
    
    return (
      <div
        key={suggestion.id || `suggestion-${index}`}
        onClick={() => isRecent ? handleRecentSearchClick(suggestion) : handleSuggestionClick(suggestion)}
        className={`px-4 py-3 hover:bg-blue-50 cursor-pointer transition-all duration-150 border-b border-gray-100 last:border-b-0 group ${
          isMock ? 'bg-gray-50/50' : ''
        } ${isRecent ? 'bg-blue-50/30' : ''} ${isCoordinates ? 'bg-purple-50/30' : ''}`}
      >
        <div className="flex items-start">
          <div className="mr-3 mt-1">
            {isRecent ? (
              <FaHistory className="text-blue-400 group-hover:text-blue-500" />
            ) : isCoordinates ? (
              <FaLocationArrow className="text-purple-500" />
            ) : isMock ? (
              <FaMapPin className="text-gray-400 group-hover:text-gray-500" />
            ) : hasMagicKey ? (
              <FaMapMarkerAlt className="text-green-500 group-hover:text-green-600" />
            ) : (
              <FaMapMarkerAlt className="text-blue-500 group-hover:text-blue-600" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="text-gray-800 font-medium truncate">
                {text}
              </div>
              {hasMagicKey && !isMock && !isCoordinates && (
                <span className="ml-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  Verified
                </span>
              )}
            </div>
            
            <div className="mt-1 text-sm text-gray-600 flex items-center flex-wrap gap-2">
              {city && (
                <span className="inline-flex items-center">
                  <FaCity className="mr-1" size={12} />
                  {city}
                </span>
              )}
              
              {country && country !== 'Rwanda' && (
                <span className="inline-flex items-center">
                  <FaFlag className="mr-1" size={12} />
                  {country}
                </span>
              )}
              
              {type && !isRecent && !isCoordinates && (
                <span className="capitalize text-gray-500">
                  {type.replace('_', ' ')}
                </span>
              )}
              
              {isCoordinates && (
                <span className="text-purple-600 font-mono text-xs">
                  {suggestion.coordinates?.lat?.toFixed(4)}, {suggestion.coordinates?.lng?.toFixed(4)}
                </span>
              )}
            </div>
            
            {suggestion.importance && suggestion.importance > 0.5 && (
              <div className="mt-1 flex items-center">
                <FaStar className="text-yellow-400 mr-1" size={12} />
                <span className="text-xs text-gray-500">Popular location</span>
              </div>
            )}
          </div>
          
          {!isMock && !isRecent && hasMagicKey && (
            <FaCheckCircle className="text-green-500 ml-2 mt-1" />
          )}
        </div>
      </div>
    );
  };

  // Location details preview
  const renderLocationDetails = () => {
    if (!locationDetails && !selectedSuggestion) return null;
    
    const details = locationDetails || selectedSuggestion;
    
    return (
      <div className="mt-4 bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-800 flex items-center">
            <FaInfoCircle className="mr-2 text-blue-600" />
            Location Details
          </h3>
          {details.isMock && (
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
              Mock Data
            </span>
          )}
        </div>
        
        <div className="space-y-3">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-3 rounded-lg border border-blue-100">
              <div className="flex items-center text-sm text-gray-600 mb-1">
                <FaMapMarkerAlt className="mr-2 text-blue-500" />
                Name
              </div>
              <div className="font-medium text-gray-800 truncate">
                {details.name || details.text}
              </div>
            </div>
            
            <div className="bg-white p-3 rounded-lg border border-green-100">
              <div className="flex items-center text-sm text-gray-600 mb-1">
                <FaCity className="mr-2 text-green-500" />
                City
              </div>
              <div className="font-medium text-gray-800">
                {details.city || 'Kigali'}
              </div>
            </div>
          </div>
          
          {/* Address */}
          {(details.address || details.display_name) && (
            <div className="bg-white p-3 rounded-lg border border-gray-100">
              <div className="text-sm text-gray-600 mb-1">Address</div>
              <div className="font-medium text-gray-800">
                {details.address || details.display_name}
              </div>
            </div>
          )}
          
          {/* Coordinates */}
          {details.coordinates && (
            <div className="bg-white p-3 rounded-lg border border-purple-100">
              <div className="flex items-center text-sm text-gray-600 mb-1">
                <FaLocationArrow className="mr-2 text-purple-500" />
                Coordinates
              </div>
              <div className="font-mono text-sm text-gray-800">
                {details.coordinates.lat.toFixed(6)}, {details.coordinates.lng.toFixed(6)}
              </div>
            </div>
          )}
          
          {/* Metadata */}
          <div className="pt-3 border-t border-gray-200 text-xs text-gray-500">
            <div className="flex justify-between">
              <span>Type: {details.type || 'location'}</span>
              <span>Source: {details.isMock ? 'Local Data' : 'API'}</span>
            </div>
            {details.magicKey && (
              <div className="mt-1 truncate">
                Magic Key: {details.magicKey.substring(0, 20)}...
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`relative ${className}`}>
      {/* Label */}
      {label && (
        <label className="text-sm font-semibold text-gray-700 mb-3 block">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      {/* Input Container */}
      <div className="relative">
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
          <Icon className={`text-lg ${error ? 'text-red-500' : 'text-blue-600'}`} />
        </div>
        
        {/* Input Field */}
        <input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          className={`pl-12 pr-10 h-14 bg-white rounded-xl text-base w-full transition-all duration-200 border-2 ${
            disabled 
              ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed' 
              : searchError 
                ? 'border-yellow-300 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-100 hover:border-yellow-400' 
                : error
                  ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 hover:border-red-400'
                  : 'border-gray-200 hover:border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
          }`}
        />
        
        {/* Clear Button */}
        {value && showClearButton && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1 rounded-full hover:bg-gray-100"
            aria-label="Clear input"
          >
            <FaTimes />
          </button>
        )}
        
        {/* Loading Indicator */}
        {isLoading && (
          <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
            <FaSpinner className="animate-spin text-blue-600" />
          </div>
        )}
      </div>

      {/* Network Status */}
      {usingMockData && !isLoading && (
        <div className="mt-2 flex items-center text-xs text-yellow-600 bg-yellow-50 px-3 py-2 rounded-lg">
          <FaExclamationTriangle className="mr-2 flex-shrink-0" />
          <span>Using local data. Real-time suggestions may be limited.</span>
        </div>
      )}

      {/* Suggestions Dropdown */}
      {showSuggestions && (suggestions.length > 0 || (showHistory && recentSearches.length > 0 && !value)) && (
        <div 
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-80 overflow-y-auto"
          style={{ 
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
          }}
        >
          {/* Recent Searches Section */}
          {showHistory && recentSearches.length > 0 && !value && (
            <>
              <div className="px-4 py-3 border-b border-gray-100 bg-blue-50 sticky top-0">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-blue-700 flex items-center">
                    <FaHistory className="mr-2" />
                    Recent Searches
                  </div>
                  <button
                    onClick={() => {
                      localStorage.removeItem('recent_location_searches');
                      setRecentSearches([]);
                    }}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Clear All
                  </button>
                </div>
              </div>
              {recentSearches.map((item, index) => renderSuggestion(item, index, true))}
            </>
          )}
          
          {/* Current Search Results */}
          {suggestions.length > 0 && (
            <>
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 sticky top-0">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-gray-700 flex items-center">
                    <FaSearch className="mr-2" />
                    {suggestions.length} result{suggestions.length !== 1 ? 's' : ''}
                    {usingMockData && ' (local data)'}
                  </div>
                  <div className="text-xs text-gray-500">
                    Press Enter to select first
                  </div>
                </div>
              </div>
              {suggestions.map((suggestion, index) => renderSuggestion(suggestion, index))}
            </>
          )}
          
          {/* No Results Found */}
          {suggestions.length === 0 && value.length >= 2 && !isLoading && (
            <div className="p-6 text-center">
              <FaSearch className="mx-auto mb-3 text-gray-300 text-3xl" />
              <div className="font-medium text-gray-500">No locations found</div>
              <div className="text-sm text-gray-400 mt-1">
                Try a different search term or use coordinates
              </div>
              {enableCoordinates && (
                <div className="mt-3 text-xs text-gray-500">
                  Tip: You can search using coordinates like: <code className="bg-gray-100 px-2 py-1 rounded">-1.9441, 30.0619</code>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Location Details Preview */}
      {(locationDetails || selectedSuggestion) && renderLocationDetails()}

      {/* Error Display */}
      {searchError && (
        <div className="mt-2 bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-start">
            <FaExclamationTriangle className="text-red-500 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-red-700 font-medium">Search Error</div>
              <div className="text-red-600 text-sm mt-1">
                {searchError.message}
                {searchError.isNetworkError && ' - Check your connection'}
              </div>
              <button
                onClick={() => fetchSuggestions(value)}
                className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Validation Error */}
      {error && !searchError && (
        <div className="mt-2 bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center">
            <FaExclamationTriangle className="text-red-500 mr-2" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Coordinate Format Hint */}
      {enableCoordinates && (
        <div className="mt-2 text-xs text-gray-500">
          <FaInfoCircle className="inline mr-1" />
          You can also enter coordinates: <code className="bg-gray-100 px-1 py-0.5 rounded">latitude, longitude</code>
        </div>
      )}
    </div>
  );
};

// PropTypes for better documentation (optional)
LocationInput.defaultProps = {
  placeholder: 'Enter location or coordinates',
  type: 'pickup',
  showHistory: true,
  autoFocus: false,
  showClearButton: true,
  suggestionsLimit: 10,
  enableCoordinates: true,
};

export default LocationInput;