import axios from 'axios';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'https://geoservice-e7rc.onrender.com',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add timestamp to avoid cached requests
    config.params = {
      ...config.params,
      _t: Date.now()
    };
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Enhanced error handling
    if (axios.isCancel(error)) {
      console.log('Request canceled:', error.message);
      return Promise.reject({ ...error, name: 'CanceledError' });
    }

    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const message = error.response.data?.message || `Server error: ${status}`;
      
      console.error('API Error Response:', {
        status,
        message,
        url: error.config?.url,
        data: error.response.data
      });
      
      switch (status) {
        case 400:
          error.message = 'Bad request. Please check your input.';
          break;
        case 401:
          error.message = 'Unauthorized access. Please login again.';
          break;
        case 403:
          error.message = 'Access forbidden.';
          break;
        case 404:
          error.message = 'Service not found.';
          break;
        case 429:
          error.message = 'Too many requests. Please slow down.';
          break;
        case 500:
          error.message = 'Internal server error. Please try again later.';
          break;
        case 502:
          error.message = 'Bad gateway. Service temporarily unavailable.';
          break;
        case 503:
          error.message = 'Service temporarily unavailable.';
          break;
        default:
          error.message = message;
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error('Network Error:', error.request);
      error.message = 'Network error. Please check your internet connection.';
    } else {
      // Something else happened
      console.error('Error:', error.message);
      error.message = error.message || 'An unexpected error occurred.';
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;