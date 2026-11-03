import axios, { AxiosError } from 'axios';
import { ApiResponse } from '../types';

const getApiBaseUrl = (): string => {
  const rawUrl = import.meta.env.VITE_API_BASE_URL || '/api';
  const cleanUrl = rawUrl.trim().replace(/\/+$/, '');
  
  if (cleanUrl === '' || cleanUrl === '/api') {
    return '/api';
  }
  
  return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
};

const API_BASE_URL = getApiBaseUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT bearer token if available
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('lotus_auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Normalize responses, handle local fallback, and extract errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse>) => {
    const config = error.config as any;

    // Resilient local fallback: if remote API returns 404 (e.g. pending deploy on Render)
    // while the developer is testing in browser, retry seamlessly against local backend
    if (
      error.response?.status === 404 &&
      config &&
      !config._retriedLocal &&
      typeof window !== 'undefined' &&
      window.location.hostname === 'localhost' &&
      !config.baseURL?.includes('localhost:5000')
    ) {
      config._retriedLocal = true;
      config.baseURL = 'http://localhost:5000/api';
      try {
        return await axios.request(config);
      } catch (retryError) {
        // Continue to standard error handling if local backend is also unavailable
      }
    }

    const errorData = error.response?.data;
    const errorMessage =
      errorData?.message ||
      error.message ||
      'An unexpected network error occurred';

    // Augment error with server message for UI consumers
    const normalizedError = new Error(errorMessage) as Error & {
      statusCode?: number;
      code?: string;
      details?: any[];
    };

    normalizedError.statusCode = error.response?.status;
    normalizedError.code = errorData?.error?.code;
    normalizedError.details = errorData?.error?.details;

    return Promise.reject(normalizedError);
  }
);

// Health check service helper
export const checkSystemHealth = async () => {
  const response = await apiClient.get<ApiResponse<import('../types').HealthCheckResponse>>('/health');
  return response.data;
};
