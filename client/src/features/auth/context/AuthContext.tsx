import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { User, Partner, LoginCredentials, AuthContextType } from '../types/auth.types';
import { loginPartner, logoutPartner, fetchCurrentSession, updateCurrentPartnerProfile } from '../services/auth.service';
import { queryKeys } from '../../../lib/queryKeys';

const AUTH_TOKEN_KEY = 'lotus_auth_token';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(AUTH_TOKEN_KEY));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Logout handler - clears session, wipes local storage, and completely clears query cache
  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setToken(null);
    setUser(null);
    setPartner(null);
    // Securely clear all cached sensitive financial, booking, and partner queries to prevent cross-session leakage
    queryClient.clear();
    logoutPartner();
  }, [queryClient]);

  // Restore authenticated session on initial mount
  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);

      if (!storedToken) {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      try {
        const session = await fetchCurrentSession();
        if (isMounted) {
          setUser(session.user);
          setPartner(session.partner);
          setToken(storedToken);
          // Set in query cache for any consumers
          queryClient.setQueryData(queryKeys.auth.session(), session);
        }
      } catch (err) {
        console.warn('Session restoration failed or token expired. Logging out.');
        if (isMounted) {
          localStorage.removeItem(AUTH_TOKEN_KEY);
          setToken(null);
          setUser(null);
          setPartner(null);
          queryClient.clear();
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, [queryClient]);

  // Login handler
  const login = async (credentials: LoginCredentials): Promise<void> => {
    // Clear any previous session queries before populating new user session
    queryClient.clear();
    const data = await loginPartner(credentials);
    localStorage.setItem(AUTH_TOKEN_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
    setPartner(data.partner);
    queryClient.setQueryData(queryKeys.auth.session(), { user: data.user, partner: data.partner });
  };

  // Update authenticated partner profile
  const updatePartnerProfile = async (data: { phone: string; email?: string }): Promise<Partner> => {
    const updated = await updateCurrentPartnerProfile(data);
    setPartner(updated);
    if (user) {
      queryClient.setQueryData(queryKeys.auth.session(), { user, partner: updated });
    }
    // Invalidate partner summaries and accounts across the application
    queryClient.invalidateQueries({ queryKey: queryKeys.accounts.partners() });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.overview() });
    queryClient.invalidateQueries({ queryKey: queryKeys.cashCustody.all });
    return updated;
  };

  const value: AuthContextType = {
    user,
    partner,
    token,
    isAuthenticated: Boolean(token && user && partner),
    isLoading,
    login,
    logout,
    updatePartnerProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
