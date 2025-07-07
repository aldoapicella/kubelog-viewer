import axios from 'axios';

// Create axios instance for Kubernetes API calls
export const k8s = axios.create({ 
  baseURL: '/api',
  timeout: 15000 
});

// Add request interceptor for debugging
k8s.interceptors.request.use(
  (config) => {
    // Log API calls in development
    if (import.meta.env.DEV) {
      console.log(`[K8S API] ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
k8s.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      console.error(`[K8S API Error] ${status}:`, data);
      
      if (status === 401) {
        throw new Error('Authentication failed. Please check your credentials.');
      } else if (status === 403) {
        throw new Error('Permission denied. You do not have access to this resource.');
      } else if (status === 404) {
        throw new Error('Resource not found.');
      } else if (status >= 500) {
        throw new Error('Server error. Please try again later.');
      }
    } else if (error.request) {
      // Network error
      console.error('[K8S API Network Error]:', error.message);
      throw new Error('Network error. Please check your connection.');
    }
    
    // Re-throw the original error if we don't handle it specifically
    throw error;
  }
);
