// locationService.jsx (Refactored)
import axios from 'axios';

// Use environment variable for base URL with fallback
const BASE_URL = import.meta.env.VITE_GEO_SERVICE_URL || 'https://geoservice-e7rc.onrender.com';

// Check if we're in development and need CORS proxy
const isDevelopment = import.meta.env.DEV;

// Create axios instance with better defaults
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for development CORS handling
apiClient.interceptors.request.use(
  (config) => {
    // Add timestamp to prevent caching
    config.params = {
      ...config.params,
      _t: Date.now(),
    };
    
    // If in development, we might need different handling
    if (isDevelopment) {
      // You could add development-specific headers here
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isCancel(error)) {
      return Promise.reject({ isCanceled: true });
    }
    
    // Enhanced error object
    const enhancedError = {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      data: error.response?.data,
      isNetworkError: !error.response,
      isTimeout: error.code === 'ECONNABORTED',
    };
    
    return Promise.reject(enhancedError);
  }
);

export const locationService = {
  /**
   * Get place suggestions with improved CORS handling
   */
  async getSuggestions(q, signal) {
    if (!q || q.length < 1) return [];
    
    try {
      // Try direct API call first
      const res = await apiClient.get('/placename/suggest', {
        params: { q },
        signal,
      });

      return this._normalizeSuggestions(res.data);
    } catch (error) {
      if (error.isCanceled) {
        throw error;
      }
      
      // If CORS error in development, try proxy approach
      if (isDevelopment && (error.isNetworkError || error.code === 'ERR_NETWORK')) {
        console.warn('Direct API failed, trying CORS proxy...');
        return this._getSuggestionsViaProxy(q, signal);
      }
      
      // Fallback mock data if API fails
      console.error('Suggestion API error:', error);
      return this._getMockSuggestions(q);
    }
  },

  /**
   * Get location details by magic key
   */
  async getLocationDetails(magicKey, signal) {
    if (!magicKey) {
      console.warn('No magic key provided for location details');
      return this._getMockLocationDetails(magicKey);
    }
    
    try {
      const res = await apiClient.get('/placename/details', {
        params: { 
          magicKey,
          fields: 'name,address,city,country,lat,lng,postcode,type,importance'
        },
        signal,
      });
      
      return this._normalizeLocationDetails(res.data);
    } catch (error) {
      if (error.isCanceled) {
        throw error;
      }
      
      // If CORS error in development, try proxy approach
      if (isDevelopment && (error.isNetworkError || error.code === 'ERR_NETWORK')) {
        console.warn('Direct API failed, trying CORS proxy for location details...');
        return this._getLocationDetailsViaProxy(magicKey, signal);
      }
      
      console.error('Location details API error:', error);
      return this._getMockLocationDetails(magicKey);
    }
  },

  /**
   * Get location details by coordinates (reverse geocoding)
   */
  async getLocationByCoordinates(lat, lng, signal) {
    if (!lat || !lng) {
      console.warn('Invalid coordinates provided');
      return this._getMockLocationDetails();
    }
    
    try {
      const res = await apiClient.get('/placename/reverse', {
        params: { 
          lat,
          lng,
          format: 'json'
        },
        signal,
      });
      
      return this._normalizeLocationDetails(res.data);
    } catch (error) {
      console.error('Reverse geocoding API error:', error);
      return this._getMockLocationDetails();
    }
  },

  /**
   * Search locations by query (more comprehensive than suggestions)
   */
  async searchLocations(query, options = {}, signal) {
    if (!query || query.length < 1) return [];
    
    const defaultOptions = {
      limit: 10,
      viewbox: null,
      bounded: false,
      countrycodes: 'rw', // Rwanda by default
      addressdetails: true
    };
    
    const mergedOptions = { ...defaultOptions, ...options };
    
    try {
      const res = await apiClient.get('/placename/search', {
        params: {
          q: query,
          ...mergedOptions
        },
        signal,
      });
      
      return this._normalizeSearchResults(res.data);
    } catch (error) {
      console.error('Search API error:', error);
      return this._getMockSearchResults(query);
    }
  },

  /**
   * Enhanced search with better filtering and ranking
   */
  async enhancedSearch(query, options = {}, signal) {
    if (!query || query.length < 1) return [];
    
    const defaultOptions = {
      limit: 20,
      countrycodes: 'rw',
      addressdetails: true,
      deduplicate: true,
      rankBy: ['importance', 'relevance'],
      language: 'en'
    };
    
    const mergedOptions = { ...defaultOptions, ...options };
    
    try {
      const [suggestions, searchResults] = await Promise.all([
        this.getSuggestions(query, signal),
        this.searchLocations(query, mergedOptions, signal)
      ]);
      
      // Combine and deduplicate results
      const allResults = [...suggestions, ...searchResults];
      const uniqueResults = this._deduplicateResults(allResults);
      
      // Sort by relevance
      return this._rankResults(uniqueResults, query);
    } catch (error) {
      console.error('Enhanced search error:', error);
      return this._getMockSuggestions(query);
    }
  },

  /**
   * Get popular locations in Rwanda
   */
  async getPopularLocations(signal) {
    const popularLocations = [
      { 
        text: 'Kigali International Airport (KGL)', 
        city: 'Kigali', 
        type: 'airport', 
        importance: 0.9,
        address: 'Kigali International Airport, Kanombe, Kigali, Rwanda',
        coordinates: { lat: -1.9686, lng: 30.1395 }
      },
      { 
        text: 'Kigali Convention Center', 
        city: 'Kigali', 
        type: 'convention_center', 
        importance: 0.8,
        address: 'KG 2 Roundabout, Kigali, Rwanda',
        coordinates: { lat: -1.9519, lng: 30.0938 }
      },
      { 
        text: 'Nyabugogo Bus Station', 
        city: 'Kigali', 
        type: 'bus_station', 
        importance: 0.7,
        address: 'Nyabugogo, Kigali, Rwanda',
        coordinates: { lat: -1.9321, lng: 30.0514 }
      },
      { 
        text: 'Kimironko Market', 
        city: 'Kigali', 
        type: 'market', 
        importance: 0.6,
        address: 'Kimironko, Kigali, Rwanda',
        coordinates: { lat: -1.9250, lng: 30.0881 }
      },
      { 
        text: 'Remera Stadium', 
        city: 'Kigali', 
        type: 'stadium', 
        importance: 0.5,
        address: 'Remera, Kigali, Rwanda',
        coordinates: { lat: -1.9597, lng: 30.1056 }
      },
    ];
    
    // Add mock magic keys for consistency
    return popularLocations.map((loc, index) => ({
      ...loc,
      id: `popular-${index}`,
      magicKey: `popular-${index}`,
      isMock: true
    }));
  },

  /**
   * Get suggestions via CORS proxy for development
   */
  async _getSuggestionsViaProxy(q, signal) {
    try {
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(
        `${BASE_URL}/placename/suggest?q=${q}`
      )}`;
      
      const res = await axios.get(proxyUrl, { signal, timeout: 10000 });
      return this._normalizeSuggestions(res.data);
    } catch (proxyError) {
      console.error('Proxy also failed, using mock data');
      return this._getMockSuggestions(q);
    }
  },

  /**
   * Get location details via CORS proxy
   */
  async _getLocationDetailsViaProxy(magicKey, signal) {
    try {
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(
        `${BASE_URL}/placename/details?magicKey=${magicKey}`
      )}`;
      
      const res = await axios.get(proxyUrl, { signal, timeout: 10000 });
      return this._normalizeLocationDetails(res.data);
    } catch (proxyError) {
      console.error('Proxy also failed, using mock data');
      return this._getMockLocationDetails(magicKey);
    }
  },

  /**
   * Normalize suggestions from different response formats
   */
  _normalizeSuggestions(data) {
    if (!data) return [];
    
    if (Array.isArray(data)) {
      // If it's an array of strings, convert to objects
      if (typeof data[0] === 'string') {
        return data.map((text, index) => ({
          id: `suggestion-${index}`,
          text,
          type: 'location',
        }));
      }
      // If it's already an array of objects, ensure they have required fields
      return data.map((item, index) => ({
        id: item.id || `suggestion-${index}`,
        text: item.text || item.name || item.display_name || '',
        magicKey: item.magicKey || item.magic_key || null,
        type: item.type || 'location',
        ...item
      }));
    }
    
    if (data?.suggestions && Array.isArray(data.suggestions)) {
      return data.suggestions.map((suggestion, index) => ({
        id: suggestion.id || `suggestion-${index}`,
        text: suggestion.text || suggestion.name || suggestion.display_name || '',
        magicKey: suggestion.magicKey || suggestion.magic_key || null,
        type: suggestion.type || 'location',
        ...suggestion
      }));
    }
    
    if (data?.results && Array.isArray(data.results)) {
      return data.results.map((result, index) => ({
        id: result.id || `result-${index}`,
        text: result.text || result.name || result.display_name || '',
        magicKey: result.magicKey || result.magic_key || null,
        type: result.type || 'location',
        ...result
      }));
    }
    
    if (data?.features && Array.isArray(data.features)) {
      return data.features.map((feature, index) => ({
        id: feature.id || `feature-${index}`,
        text: feature.properties?.name || feature.properties?.display_name || '',
        magicKey: feature.properties?.magicKey || feature.properties?.magic_key || null,
        type: feature.properties?.type || 'location',
        coordinates: feature.geometry?.coordinates,
        ...feature.properties
      }));
    }
    
    return [];
  },

  /**
   * Normalize location details
   */
  _normalizeLocationDetails(data) {
    if (!data) return null;
    
    // Handle different response formats
    const details = data.properties || data.address || data;
    
    return {
      id: data.id || details.id || `location-${Date.now()}`,
      name: details.name || details.display_name || '',
      address: details.address || details.display_name || '',
      street: details.street || details.road || '',
      city: details.city || details.town || details.village || details.county || '',
      country: details.country || 'Rwanda',
      countryCode: details.country_code || 'rw',
      postcode: details.postcode || '',
      coordinates: {
        lat: parseFloat(data.lat || details.lat || (data.geometry?.coordinates?.[1]) || -1.9441),
        lng: parseFloat(data.lon || details.lon || (data.geometry?.coordinates?.[0]) || 30.0619)
      },
      type: details.type || details.category || 'location',
      importance: details.importance || details.rank || 0,
      boundingBox: data.boundingbox || details.boundingbox,
      magicKey: data.magicKey || details.magicKey || details.magic_key,
      isMock: false,
      fetchedAt: new Date().toISOString()
    };
  },

  /**
   * Normalize search results
   */
  _normalizeSearchResults(data) {
    if (!data) return [];
    
    let results = [];
    
    if (Array.isArray(data)) {
      results = data;
    } else if (data?.results && Array.isArray(data.results)) {
      results = data.results;
    } else if (data?.features && Array.isArray(data.features)) {
      results = data.features;
    }
    
    return results.map((item, index) => {
      const properties = item.properties || item.address || item;
      const geometry = item.geometry || {};
      
      return {
        id: item.id || `search-${index}`,
        text: properties.name || properties.display_name || '',
        address: properties.display_name || '',
        coordinates: {
          lat: parseFloat(item.lat || properties.lat || geometry.coordinates?.[1] || -1.9441 + Math.random() * 0.1),
          lng: parseFloat(item.lon || properties.lon || geometry.coordinates?.[0] || 30.0619 + Math.random() * 0.1)
        },
        city: properties.city || properties.town || properties.village || '',
        country: properties.country || 'Rwanda',
        type: properties.type || properties.category || 'location',
        importance: properties.importance || properties.rank || 0,
        magicKey: properties.magicKey || properties.magic_key,
        boundingBox: item.boundingbox || properties.boundingbox,
        isMock: false
      };
    });
  },

  /**
   * Deduplicate results by name/address
   */
  _deduplicateResults(results) {
    const seen = new Set();
    return results.filter(item => {
      const key = item.text || item.name || item.display_name || '';
      const normalizedKey = key.toLowerCase().trim();
      
      if (seen.has(normalizedKey)) {
        return false;
      }
      
      seen.add(normalizedKey);
      return true;
    });
  },

  /**
   * Rank results by relevance to query
   */
  _rankResults(results, query) {
    const queryLower = query.toLowerCase();
    
    return results.sort((a, b) => {
      // Score each result
      const scoreA = this._calculateRelevanceScore(a, queryLower);
      const scoreB = this._calculateRelevanceScore(b, queryLower);
      
      // Higher score first
      return scoreB - scoreA;
    });
  },

  /**
   * Calculate relevance score for a result
   */
  _calculateRelevanceScore(result, queryLower) {
    let score = 0;
    const text = (result.text || result.name || result.display_name || '').toLowerCase();
    const city = (result.city || result.town || result.village || '').toLowerCase();
    const address = (result.address || '').toLowerCase();
    
    // Exact match
    if (text === queryLower) score += 100;
    
    // Starts with query
    if (text.startsWith(queryLower)) score += 50;
    
    // Contains query
    if (text.includes(queryLower)) score += 30;
    
    // City/address contains query
    if (city.includes(queryLower)) score += 20;
    if (address.includes(queryLower)) score += 15;
    
    // Has magic key (more reliable)
    if (result.magicKey || result.magic_key) score += 25;
    
    // Has coordinates
    if (result.coordinates) score += 10;
    
    // Higher importance
    score += (result.importance || 0) * 10;
    
    // Not mock data
    if (!result.isMock) score += 5;
    
    return score;
  },

  /**
   * Mock suggestions for fallback
   */
  _getMockSuggestions(query) {
    const rwandaLocations = [
      { 
        text: 'Kigali International Airport (KGL)', 
        magicKey: 'mock-kgl-001', 
        city: 'Kigali',
        type: 'airport',
        importance: 0.9
      },
      { 
        text: 'Kigali Convention Center', 
        magicKey: 'mock-kcc-002', 
        city: 'Kigali',
        type: 'convention_center',
        importance: 0.8
      },
      { 
        text: 'Kigali Heights', 
        magicKey: 'mock-kh-003', 
        city: 'Kigali',
        type: 'shopping_mall',
        importance: 0.7
      },
      { 
        text: 'Kigali City Tower', 
        magicKey: 'mock-kct-004', 
        city: 'Kigali',
        type: 'office',
        importance: 0.7
      },
      { 
        text: 'Kigali Business Center', 
        magicKey: 'mock-kbc-005', 
        city: 'Kigali',
        type: 'office',
        importance: 0.6
      },
      { 
        text: 'Nyabugogo Bus Station', 
        magicKey: 'mock-nbs-006', 
        city: 'Kigali',
        type: 'bus_station',
        importance: 0.8
      },
      { 
        text: 'Kimironko Market', 
        magicKey: 'mock-km-007', 
        city: 'Kigali',
        type: 'market',
        importance: 0.6
      },
      { 
        text: 'Remera, Kigali', 
        magicKey: 'mock-rem-008', 
        city: 'Kigali',
        type: 'suburb',
        importance: 0.5
      },
      { 
        text: 'Gikondo, Kigali', 
        magicKey: 'mock-gik-009', 
        city: 'Kigali',
        type: 'suburb',
        importance: 0.5
      },
      { 
        text: 'Nyarutarama, Kigali', 
        magicKey: 'mock-nyt-010', 
        city: 'Kigali',
        type: 'suburb',
        importance: 0.6
      },
      { 
        text: 'Kacyiru, Kigali', 
        magicKey: 'mock-kac-011', 
        city: 'Kigali',
        type: 'suburb',
        importance: 0.6
      },
      { 
        text: 'Kanombe, Kigali', 
        magicKey: 'mock-kan-012', 
        city: 'Kigali',
        type: 'suburb',
        importance: 0.5
      },
    ];
    
    return rwandaLocations
      .filter(loc => 
        loc.text.toLowerCase().includes(query.toLowerCase()) ||
        query.toLowerCase().includes(loc.text.toLowerCase().split(' ')[0])
      )
      .map((loc, index) => ({
        id: `mock-${index}`,
        text: loc.text,
        magicKey: loc.magicKey,
        type: loc.type,
        city: loc.city,
        importance: loc.importance,
        coordinates: {
          lat: -1.9441 + (Math.random() * 0.1),
          lng: 30.0619 + (Math.random() * 0.1)
        },
        isMock: true
      }));
  },

  /**
   * Mock location details for fallback
   */
  _getMockLocationDetails(magicKey = null) {
    const mockLocations = {
      'mock-kgl-001': {
        name: 'Kigali International Airport',
        address: 'Kigali International Airport, Kanombe, Kigali, Rwanda',
        city: 'Kigali',
        country: 'Rwanda',
        countryCode: 'rw',
        coordinates: { lat: -1.9686, lng: 30.1395 },
        type: 'airport',
        importance: 0.9,
        postcode: 'KGL 001'
      },
      'mock-kcc-002': {
        name: 'Kigali Convention Center',
        address: 'KG 2 Roundabout, Kigali, Rwanda',
        city: 'Kigali',
        country: 'Rwanda',
        countryCode: 'rw',
        coordinates: { lat: -1.9519, lng: 30.0938 },
        type: 'convention_center',
        importance: 0.8,
        postcode: 'KGL 002'
      },
      'mock-nbs-006': {
        name: 'Nyabugogo Bus Station',
        address: 'Nyabugogo, Kigali, Rwanda',
        city: 'Kigali',
        country: 'Rwanda',
        countryCode: 'rw',
        coordinates: { lat: -1.9321, lng: 30.0514 },
        type: 'bus_station',
        importance: 0.8,
        postcode: 'KGL 003'
      },
      'default': {
        name: 'Location in Kigali',
        address: 'Kigali, Rwanda',
        city: 'Kigali',
        country: 'Rwanda',
        countryCode: 'rw',
        coordinates: { 
          lat: -1.9441 + Math.random() * 0.1,
          lng: 30.0619 + Math.random() * 0.1
        },
        type: 'location',
        importance: 0.5,
        postcode: 'KGL 000'
      }
    };
    
    const location = mockLocations[magicKey] || mockLocations.default;
    
    return {
      ...location,
      id: magicKey || `mock-${Date.now()}`,
      magicKey,
      isMock: true,
      fetchedAt: new Date().toISOString()
    };
  },

  /**
   * Mock search results for fallback
   */
  _getMockSearchResults(query) {
    return this._getMockSuggestions(query).map(suggestion => ({
      ...suggestion,
      address: suggestion.text,
      countryCode: 'rw',
      isMock: true
    }));
  },

  /**
   * Get route info between two locations
   */
  async getRouteInfo(origin, destination, signal) {
    try {
      const res = await apiClient.get('/route', {
        params: { origin, destination },
        signal,
      });
      return res.data;
    } catch (error) {
      console.error('Route API error:', error);
      
      // Mock route info
      return {
        distance: Math.floor(Math.random() * 30) + 5,
        time: Math.floor(Math.random() * 60) + 15,
        polyline: '',
        isMock: true,
      };
    }
  },

  /**
   * Calculate fare
   */
  async calculateFare(distance, rideType, signal) {
    try {
      const res = await apiClient.post(
        '/fare/calculate',
        { distance, rideType },
        { signal }
      );
      return res.data;
    } catch (error) {
      console.error('Fare API error:', error);
      
      // Mock fare calculation
      const baseFares = {
        economy: 1500,
        premium: 2500,
        suv: 3000,
      };
      
      const baseFare = baseFares[rideType] || 2000;
      const total = Math.round(baseFare * (distance || 10) * 100) / 100;
      
      return {
        amount: total,
        currency: 'RWF',
        isMock: true,
        breakdown: {
          baseFare,
          distanceFare: baseFare * (distance || 10),
          total,
        }
      };
    }
  },

  /**
   * Validate location
   */
  async validateLocation(location, signal) {
    try {
      const res = await apiClient.get('/location/validate', {
        params: { location },
        signal,
      });
      return res.data;
    } catch (error) {
      console.error('Validation API error:', error);
      return { valid: true, isMock: true };
    }
  },

  /**
   * Health check
   */
  async healthCheck(signal) {
    try {
      const res = await apiClient.get('/health', { signal });
      return { healthy: true, ...res.data };
    } catch (error) {
      return { 
        healthy: false, 
        error: error.message,
        isDevelopment,
        timestamp: new Date().toISOString()
      };
    }
  },
};

/**
 * Utility helpers
 */
export const locationUtils = {
  formatAddress(address) {
    if (!address) return '';
    return address
      .split(',')
      .map(part => part.trim())
      .filter(part => part)
      .join(', ');
  },

  extractCity(address) {
    if (!address) return '';
    const parts = address.split(',');
    return parts.length > 1 ? parts[parts.length - 2]?.trim() : address;
  },

  isCoordinate(str) {
    if (!str) return false;
    return /^-?\d+\.?\d*,\s*-?\d+\.?\d*$/.test(str.trim());
  },

  parseCoordinate(coordString) {
    if (!coordString || !this.isCoordinate(coordString)) return null;
    try {
      const [lat, lng] = coordString.split(',').map((v) => parseFloat(v.trim()));
      return { lat, lng };
    } catch (error) {
      console.error('Error parsing coordinate:', error);
      return null;
    }
  },

  calculateDistance(coord1, coord2) {
    if (!coord1 || !coord2 || !coord1.lat || !coord1.lng || !coord2.lat || !coord2.lng) {
      return 0;
    }

    const R = 6371; // Earth's radius in km
    const dLat = ((coord2.lat - coord1.lat) * Math.PI) / 180;
    const dLng = ((coord2.lng - coord1.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(coord1.lat * Math.PI / 180) *
        Math.cos(coord2.lat * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2;
    const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(distance * 100) / 100;
  },

  // Extract magic key from suggestion
  extractMagicKey(suggestion) {
    if (!suggestion) return null;
    
    if (typeof suggestion === 'string') return null;
    
    return suggestion.magicKey || suggestion.magic_key || null;
  },

  // Create location object from suggestion
  createLocationFromSuggestion(suggestion) {
    if (!suggestion) return null;
    
    if (typeof suggestion === 'string') {
      return {
        text: suggestion,
        address: suggestion,
        magicKey: null,
        isMock: true
      };
    }
    
    return {
      id: suggestion.id,
      text: suggestion.text || suggestion.name || suggestion.display_name,
      address: suggestion.address || suggestion.text || suggestion.name,
      magicKey: suggestion.magicKey || suggestion.magic_key,
      type: suggestion.type || 'location',
      coordinates: suggestion.coordinates,
      city: suggestion.city,
      country: suggestion.country,
      isMock: suggestion.isMock || false
    };
  },

  // Format coordinates for display
  formatCoordinates(coordinates) {
    if (!coordinates || !coordinates.lat || !coordinates.lng) return 'N/A';
    return `${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`;
  },

  // Get location type icon
  getLocationTypeIcon(type) {
    const icons = {
      airport: '✈️',
      bus_station: '🚌',
      train_station: '🚉',
      hotel: '🏨',
      restaurant: '🍽️',
      hospital: '🏥',
      school: '🏫',
      university: '🎓',
      park: '🌳',
      museum: '🏛️',
      shopping_mall: '🛍️',
      supermarket: '🛒',
      bank: '🏦',
      atm: '🏧',
      pharmacy: '💊',
      cinema: '🎬',
      stadium: '🏟️',
      church: '⛪',
      mosque: '🕌',
      temple: '🛕',
      default: '📍'
    };
    
    return icons[type] || icons.default;
  }
};

export default locationService;