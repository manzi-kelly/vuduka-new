import axios from 'axios';

// Central axios client to apply CORS-friendly defaults and interceptors
const PROD_BASE_URL = import.meta.env.VITE_GEO_SERVICE_URL || 'https://geoservice-e7rc.onrender.com';
// In development use the vite dev-server proxy (`/api`) to avoid CORS.
const BASE_URL = import.meta.env.DEV ? '/api' : PROD_BASE_URL;
const CORS_PROXY = import.meta.env.VITE_CORS_PROXY || '';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  },
  // Attempt to include credentials for cross-site requests when supported
  withCredentials: true,
});

// Request interceptor: ensure headers and mark the request start
apiClient.interceptors.request.use((config) => {
  config.headers = config.headers || {};
  if (!config.headers['X-Requested-With']) {
    config.headers['X-Requested-With'] = 'XMLHttpRequest';
  }
  return config;
}, (err) => Promise.reject(err));

// Helper to build absolute URL from axios config
function _buildFullUrl(config) {
  try {
    if (config.baseURL && !/^https?:\/\//i.test(config.url)) {
      return `${config.baseURL.replace(/\/$/, '')}/${String(config.url).replace(/^\//, '')}`;
    }
    return config.url;
  } catch (e) {
    return config.url;
  }
}

// Response interceptor: detect network / CORS style failures and optionally retry via proxy
apiClient.interceptors.response.use(
  (resp) => resp,
  async (error) => {
    // If we have a response, it's not a CORS/network issue
    if (error.response) return Promise.reject(error);

    // No response => network error / possible CORS
    const config = error.config || {};
    const fullUrl = _buildFullUrl(config);

    // If a CORS proxy is configured and we haven't retried, attempt a single proxy retry
    if (CORS_PROXY && !config.__cors_retried) {
      try {
        config.__cors_retried = true;

        let proxiedUrl;
        const proxyPrefix = String(CORS_PROXY);

        if (/url=/.test(proxyPrefix)) {
          proxiedUrl = `${proxyPrefix}${encodeURIComponent(fullUrl)}`;
        } else {
          proxiedUrl = `${proxyPrefix.replace(/\/$/, '')}/${fullUrl.replace(/^https?:\/\//, '')}`;
        }

        // Use the raw axios instance to hit the proxy (so baseURL is not applied)
        const proxiedResponse = await axios.request({
          url: proxiedUrl,
          method: config.method || 'get',
          headers: config.headers,
          params: config.params,
          data: config.data,
          timeout: config.timeout || 15000,
          signal: config.signal
        });

        return proxiedResponse;
      } catch (proxyErr) {
        // fall through to reject below
        proxyErr.isCORS = true;
        proxyErr.message = `Network/CORS error (proxy retry failed): ${proxyErr.message}`;
        return Promise.reject(proxyErr);
      }
    }

    // annotate error so callers can surface a helpful message
    error.isCORS = true;
    error.message = `Network error or CORS blocked the request: ${error.message}`;
    return Promise.reject(error);
  }
);

export default apiClient;
export { apiClient };
