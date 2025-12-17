// components/LocationInput.jsx
import React, { useState, useRef, useEffect } from 'react';
import { 
  FaMapMarkerAlt, 
  FaTimes, 
  FaExclamationTriangle, 
  FaSearch,
  FaSpinner,
  FaMapPin,
  FaCheckCircle,
  FaHistory,
  FaRoute
} from 'react-icons/fa';
import { useLocationSearch, useLocation } from '../contexts/LocationContext';

const LocationInput = ({ 
  label, 
  value, 
  onChange,
  onSuggestionSelect,
  placeholder, 
  icon: Icon, 
  error,
  className = '',
  disabled = false,
  required = false,
  type = 'search', // 'pickup', 'dropoff', or 'search'
  showHistory = true,
}) => {
  const { searchResults, isSearching, searchError, usingMockData, searchHistory } = useLocation();
  const { search, cancelSearch } = useLocationSearch();
  
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [localValue, setLocalValue] = useState(value || '');
  
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Update local value when prop changes
  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange(newValue);
    
    // Trigger search
    search(newValue);
  };

  const handleSuggestionClick = (suggestion) => {
    const displayText = suggestion.text || suggestion.display_name || suggestion.name;
    setLocalValue(displayText);
    onChange(displayText);
    
    if (onSuggestionSelect) {
      onSuggestionSelect(suggestion);
    }
    
    setShowSuggestions(false);
    cancelSearch();
  };

  const handleFocus = () => {
    setInputFocused(true);
    setShowSuggestions(true);
    
    // Trigger search for current value
    if (localValue) {
      search(localValue);
    }
  };

  const handleBlur = () => {
    setInputFocused(false);
    setTimeout(() => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(document.activeElement)) {
        setShowSuggestions(false);
      }
    }, 200);
  };

  const handleClear = () => {
    setLocalValue('');
    onChange('');
    cancelSearch();
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
      cancelSearch();
    }
    if (e.key === 'Enter' && searchResults.length > 0 && showSuggestions) {
      handleSuggestionClick(searchResults[0]);
    }
  };

  // Get display text for suggestion
  const getSuggestionText = (suggestion) => {
    if (typeof suggestion === 'string') return suggestion;
    
    return suggestion.text || 
           suggestion.display_name || 
           suggestion.name || 
           suggestion.address || 
           suggestion.properties?.name ||
           'Unnamed location';
  };

  // Check if suggestion is mock data
  const isMockSuggestion = (suggestion) => {
    return suggestion.isMock === true || 
           suggestion.id?.includes('mock') ||
           !suggestion.id;
  };

  // Render suggestion item
  const renderSuggestion = (suggestion, index, isHistory = false) => {
    const isMock = isMockSuggestion(suggestion);
    
    return (
      <div
        key={suggestion.id || `suggestion-${index}`}
        onClick={() => handleSuggestionClick(suggestion)}
        className={`px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors duration-150 border-b border-gray-100 last:border-b-0 ${
          isMock ? 'bg-gray-50/50' : ''
        } ${isHistory ? 'bg-blue-50/30' : ''}`}
      >
        <div className="flex items-start">
          <div className="mr-3 mt-1">
            {isHistory ? (
              <FaHistory className="text-blue-400" />
            ) : isMock ? (
              <FaMapPin className="text-gray-400" />
            ) : (
              <FaMapMarkerAlt className="text-blue-500" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-gray-800 font-medium truncate">
              {getSuggestionText(suggestion)}
            </div>
            <div className="flex items-center mt-1 text-xs text-gray-500">
              {suggestion.type && !isHistory && (
                <span className="bg-gray-100 px-2 py-1 rounded mr-2 capitalize">
                  {suggestion.type.replace('_', ' ')}
                </span>
              )}
              {isMock && !isHistory && (
                <span className="text-gray-400">
                  Local suggestion
                </span>
              )}
              {isHistory && (
                <span className="text-blue-400">
                  Recent search
                </span>
              )}
            </div>
          </div>
          {!isMock && !isHistory && (
            <FaCheckCircle className="text-green-500 ml-2 mt-1" />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="text-sm font-semibold text-gray-700 mb-3 block">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
          <Icon className={`text-lg ${error ? 'text-red-500' : 'text-blue-600'}`} />
        </div>
        
        <input
          ref={inputRef}
          value={localValue}
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
                  : inputFocused
                    ? 'border-blue-500 focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
                    : 'border-gray-200 hover:border-blue-300'
          }`}
        />
        
        {localValue && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1 rounded-full hover:bg-gray-100"
            aria-label="Clear input"
          >
            <FaTimes />
          </button>
        )}
        
        {isSearching && (
          <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
            <FaSpinner className="animate-spin text-blue-600" />
          </div>
        )}
      </div>

      {/* Network Status Indicator */}
      {usingMockData && (
        <div className="mt-2 flex items-center text-xs text-yellow-600">
          <FaExclamationTriangle className="mr-1" />
          <span>Using local data. Real-time suggestions unavailable.</span>
        </div>
      )}

      {/* Suggestions Dropdown */}
      {showSuggestions && (searchResults.length > 0 || (showHistory && searchHistory.length > 0)) && (
        <div 
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-72 overflow-y-auto"
          style={{ 
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            minHeight: '100px'
          }}
        >
          {/* Recent Searches Section */}
          {showHistory && searchHistory.length > 0 && localValue.length === 0 && (
            <>
              <div className="px-4 py-3 border-b border-gray-100 bg-blue-50">
                <div className="text-sm font-semibold text-blue-700">
                  Recent Searches
                </div>
              </div>
              {searchHistory.map((item, index) => renderSuggestion(item, index, true))}
            </>
          )}
          
          {/* Search Results Section */}
          {searchResults.length > 0 && (
            <>
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                <div className="text-sm font-semibold text-gray-700">
                  {searchResults.length} location{searchResults.length !== 1 ? 's' : ''} found
                  {usingMockData && ' (local data)'}
                </div>
              </div>
              {searchResults.map((suggestion, index) => renderSuggestion(suggestion, index))}
            </>
          )}
        </div>
      )}

      {/* No Results Found */}
      {showSuggestions && !isSearching && searchResults.length === 0 && localValue.length >= 2 && !searchError && (
        <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg p-4">
          <div className="text-center text-gray-500">
            <FaSearch className="mx-auto mb-2 text-gray-400 text-xl" />
            <div className="font-medium">No locations found for "{localValue}"</div>
            <div className="text-sm text-gray-400 mt-1">
              Try a different search term
            </div>
          </div>
        </div>
      )}

      {/* Error Messages */}
      {searchError && (
        <div className="mt-2 bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center">
            <FaExclamationTriangle className="text-red-500 mr-2 flex-shrink-0" />
            <div className="text-red-700 text-sm">
              {searchError.message || 'Search failed'}
              <div className="text-xs mt-1">
                Please try again or check your connection.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form Validation Error */}
      {error && !searchError && (
        <div className="mt-2 bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center">
            <FaExclamationTriangle className="text-red-500 mr-2" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationInput;