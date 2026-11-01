import { apiClient } from '../../../services/api';
import { ApiResponse } from '../../../types';
import { LoginCredentials, AuthSessionData, User, Partner } from '../types/auth.types';

export const loginPartner = async (credentials: LoginCredentials): Promise<AuthSessionData> => {
  const response = await apiClient.post<ApiResponse<AuthSessionData>>('/auth/login', credentials);
  if (!response.data.data) {
    throw new Error('Malformed authentication response received from server');
  }
  return response.data.data;
};

export const logoutPartner = async (): Promise<void> => {
  try {
    await apiClient.post<ApiResponse<{ loggedOut: boolean }>>('/auth/logout');
  } catch (err) {
    console.warn('Backend logout notification skipped or timed out:', err);
  }
};

export const fetchCurrentSession = async (): Promise<{ user: User; partner: Partner }> => {
  const response = await apiClient.get<ApiResponse<{ user: User; partner: Partner }>>('/auth/me');
  if (!response.data.data) {
    throw new Error('Failed to resolve authenticated partner session');
  }
  return response.data.data;
};
