import axios from 'axios';

// ✅ Use relative path so proxy or serverless proxy works
// - Dev: Vite proxy forwards /api -> https://geoservice-e7rc.onrender.com
// - Prod: can be replaced by your hosted domain later
const BASE = '/api';


export const locationService = {
  /**
   * Get place suggestions
   */
  async getSuggestions(q, signal) {
    if (!q || q.length < 2) return [];
    try {
      const res = await axios.get(`${BASE}/placename/suggest`, {
        params: { q, _t: Date.now() },
        signal,
      });

      const data = res.data;
      if (Array.isArray(data)) return data;
      if (Array.isArray(data?.suggestions)) return data.suggestions;
      if (Array.isArray(data?.results)) return data.results;
      return data?.suggestions || data?.results || [];
    } catch (err) {
      if (axios.isCancel(err) || err?.name === 'CanceledError' || err?.name === 'AbortError') {
        throw err;
      }
      throw new Error(err.response?.data?.message || err.message || 'Failed to fetch suggestions');
    }
  },

  /**
   * Get route info between two locations
   */
  async getRouteInfo(origin, destination, signal) {
    try {
      const res = await axios.get(`${BASE}/route`, {
        params: { origin, destination, _t: Date.now() },
        signal,
      });
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to fetch route info');
    }
  },

  /**
   * Calculate fare
   */
  async calculateFare(distance, rideType, signal) {
    try {
      const res = await axios.post(
        `${BASE}/fare/calculate`,
        { distance, rideType },
        { signal }
      );
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to calculate fare');
    }
  },

  /**
   * Validate location
   */
  async validateLocation(location, signal) {
    try {
      const res = await axios.get(`${BASE}/location/validate`, {
        params: { location, _t: Date.now() },
        signal,
      });
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to validate location');
    }
  },

  /**
   * Get distance matrix
   */
  async getDistanceMatrix(origins, destinations, signal) {
    try {
      const res = await axios.get(`${BASE}/distance-matrix`, {
        params: {
          origins: Array.isArray(origins) ? origins.join('|') : origins,
          destinations: Array.isArray(destinations) ? destinations.join('|') : destinations,
          _t: Date.now(),
        },
        signal,
      });
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to fetch distance matrix');
    }
  },

  /**
   * Reverse geocode
   */
  async reverseGeocode(lat, lng, signal) {
    try {
      const res = await axios.get(`${BASE}/reverse-geocode`, {
        params: { lat, lng, _t: Date.now() },
        signal,
      });
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to reverse geocode');
    }
  },

  /**
   * Get place details
   */
  async getPlaceDetails(placeId, signal) {
    try {
      const res = await axios.get(`${BASE}/place/details`, {
        params: { placeId, _t: Date.now() },
        signal,
      });
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to fetch place details');
    }
  },

  /**
   * Health check
   */
  async healthCheck(signal) {
    try {
      const res = await axios.get(`${BASE}/health`, { signal });
      return res.data;
    } catch (err) {
      throw new Error('Health check failed');
    }
  },
};

/**
 * Utility helpers
 */
export const locationUtils = {
  formatAddress(address) {
    return address?.trim() || '';
  },

  extractCity(address) {
    if (!address) return '';
    const parts = address.split(',');
    return parts.length > 1 ? parts[parts.length - 2]?.trim() : address;
  },

  isCoordinate(str) {
    return /^-?\d+\.?\d*,\s*-?\d+\.?\d*$/.test(str);
  },

  parseCoordinate(coordString) {
    if (!coordString) return null;
    const [lat, lng] = coordString.split(',').map((v) => parseFloat(v.trim()));
    return { lat, lng };
  },

  calculateDistance(coord1, coord2) {
    const R = 6371; // km
    const dLat = ((coord2.lat - coord1.lat) * Math.PI) / 180;
    const dLng = ((coord2.lng - coord1.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(coord1.lat * Math.PI / 180) *
        Math.cos(coord2.lat * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  },
};

export default locationService;