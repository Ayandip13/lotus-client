import axios, { AxiosError } from 'axios';
import { ApiResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

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

// Response Interceptor: Normalize responses and extract errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse>) => {
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
