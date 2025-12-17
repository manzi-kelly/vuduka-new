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
   * Get suggestions via CORS proxy for development
   */
  async _getSuggestionsViaProxy(q, signal) {
    try {
      // Using a public CORS proxy - replace with your own proxy if needed
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
   * Normalize suggestions from different response formats
   */
  _normalizeSuggestions(data) {
    if (!data) return [];
    
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.suggestions)) return data.suggestions;
    if (Array.isArray(data?.results)) return data.results;
    if (Array.isArray(data?.features)) {
      return data.features.map(feature => ({
        text: feature.properties?.name || feature.properties?.display_name,
        ...feature.properties
      }));
    }
    
    return [];
  },

  /**
   * Mock suggestions for fallback
   */
  _getMockSuggestions(query) {
    const rwandaLocations = [
      'Kigali International Airport (KGL)',
      'Kigali Convention Center',
      'Kigali Heights',
      'Kigali City Tower',
      'Kigali Business Center',
      'Nyabugogo Bus Station',
      'Kimironko Market',
      'Remera, Kigali',
      'Gikondo, Kigali',
      'Nyarutarama, Kigali',
      'Kacyiru, Kigali',
      'Kanombe, Kigali',
    ];
    
    return rwandaLocations
      .filter(loc => 
        loc.toLowerCase().includes(query.toLowerCase()) ||
        query.toLowerCase().includes(loc.toLowerCase().split(' ')[0])
      )
      .map((loc, index) => ({
        id: `mock-${index}`,
        text: loc,
        type: 'location',
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
};

export default locationService;