import React, { useState, useRef } from 'react';
import { FaMapMarkerAlt, FaTimes, FaExclamationTriangle, FaSearch } from 'react-icons/fa';
import { locationService } from '../../api/locationService';

const LocationInput = ({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  icon, 
  error,
  className = '',
  disabled = false
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const timeoutRef = useRef(null);
  const abortControllerRef = useRef(null);

  const fetchSuggestions = async (query) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      setApiError(null);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setApiError(null);

    try {
      const data = await locationService.getSuggestions(query, abortControllerRef.current.signal);
      setSuggestions(data.suggestions || []);
      setShowSuggestions(true);
      
    } catch (error) {
      if (error.name === 'CanceledError' || error.name === 'AbortError') {
        // Request was cancelled, do nothing
        return;
      }
      
      console.error('Failed to fetch suggestions:', error);
      
      // Handle different types of errors
      if (error.response) {
        // Server responded with error status
        switch (error.response.status) {
          case 404:
            setApiError('Location service temporarily unavailable');
            break;
          case 429:
            setApiError('Too many requests. Please slow down.');
            break;
          case 500:
            setApiError('Server error. Please try again later.');
            break;
          default:
            setApiError('Failed to load locations. Please try again.');
        }
      } else if (error.request) {
        // Network error
        setApiError('Network error. Please check your connection.');
      } else {
        // Other errors
        setApiError('Failed to load locations. Please try again.');
      }
      
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);
    setApiError(null);
    
    // Clear previous timeout
    clearTimeout(timeoutRef.current);
    
    // Debounce API calls
    timeoutRef.current = setTimeout(() => {
      fetchSuggestions(newValue);
    }, 300);
  };

  const handleSuggestionClick = (suggestion) => {
    // Use the text property of the suggestion object
    const suggestionText = suggestion.text || suggestion.display_name || suggestion.name || String(suggestion);
    onChange(suggestionText);
    setShowSuggestions(false);
    setSuggestions([]);
    setApiError(null);
  };

  const handleFocus = () => {
    if (value.length >= 2 && suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleBlur = () => {
    setTimeout(() => setShowSuggestions(false), 200);
  };

  const handleClear = () => {
    onChange('');
    setSuggestions([]);
    setShowSuggestions(false);
    setApiError(null);
    
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    clearTimeout(timeoutRef.current);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const getSuggestionText = (suggestion) => {
    // Safely extract text from suggestion object with fallbacks
    console.log('Suggestion object:', suggestion);
    return suggestion.text || suggestion.display_name || suggestion.name || suggestion.address || String(suggestion);
  };

  const Icon = icon;

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="text-sm font-semibold text-gray-700 mb-3 block">{label}</label>
      )}
      
      <div className="relative">
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
          <Icon className="text-blue-600 text-lg" />
        </div>
        
        <input
          placeholder={placeholder}
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={`pl-12 pr-10 h-14 border-2 bg-white rounded-xl text-base w-full transition-all duration-200 ${
            disabled 
              ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed' 
              : apiError 
                ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100 hover:border-red-400' 
                : error
                  ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100 hover:border-red-400'
                  : 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 hover:border-blue-300'
          }`}
        />
        
        {value && !disabled && (
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
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        </div>
      )}

      {apiError && (
        <div className="mt-2 bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center">
            <FaExclamationTriangle className="text-red-500 mr-2 flex-shrink-0" />
            <span className="text-red-700 text-sm">{apiError}</span>
          </div>
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors duration-150 border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-center">
                <FaMapMarkerAlt className="text-blue-500 mr-3 flex-shrink-0" />
                <span className="text-gray-800 font-medium">{getSuggestionText(suggestion)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showSuggestions && !isLoading && suggestions.length === 0 && value.length >= 2 && !apiError && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-4">
          <div className="text-center text-gray-500">
            <FaSearch className="mx-auto mb-2 text-gray-400" />
            <div>No locations found</div>
            <div className="text-sm text-gray-400 mt-1">Try a different search term</div>
          </div>
        </div>
      )}

      {error && !apiError && (
        <p className="text-red-500 text-sm mt-2 font-medium">{error}</p>
      )}
    </div>
  );
};

export default LocationInput;