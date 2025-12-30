// locationService.jsx
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_GEO_SERVICE_URL || 'https://geoservice-e7rc.onrender.com';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

export const locationService = {
  /**
   * Get place suggestions
   * Tries the real API first, falls back to mock data if it fails
   */
  async getSuggestions(q, signal) {
    if (!q || q.length < 1) return [];

    try {
      const res = await apiClient.get('/placename/suggest', {
        params: { q },
        signal,
      });

      // Normalize API response
      return this._normalizeSuggestions(res.data);
    } catch (error) {
      console.warn('API call failed, using mock suggestions', error);
      return this._getMockSuggestions(q);
    }
  },

  /**
   * Normalize different response formats
   */
  _normalizeSuggestions(data) {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.suggestions)) return data.suggestions;
    if (Array.isArray(data?.results)) return data.results;
    if (Array.isArray(data?.features)) {
      return data.features.map((feature) => ({
        text: feature.properties?.name || feature.properties?.display_name,
        ...feature.properties,
      }));
    }
    return [];
  },

  /**
   * Mock suggestions for fallback
   */
  _getMockSuggestions(query) {
    const rwandaLocations = [
    
    ];

    return rwandaLocations
      .filter(
        (loc) =>
          loc.toLowerCase().includes(query.toLowerCase()) ||
          query.toLowerCase().includes(loc.toLowerCase().split(' ')[0])
      )
      .map((loc, index) => ({
        id: `mock-${index}`,
        text: loc,
        type: 'location',
        isMock: true,
      }));
  },

  /**
   * Utility functions (coordinates, distance, etc.)
   */
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
    if (!coord1 || !coord2 || !coord1.lat || !coord1.lng || !coord2.lat || !coord2.lng) return 0;
    const R = 6371; // km
    const dLat = ((coord2.lat - coord1.lat) * Math.PI) / 180;
    const dLng = ((coord2.lng - coord1.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((coord1.lat * Math.PI) / 180) *
        Math.cos((coord2.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(distance * 100) / 100;
  },
};

export default locationService;
