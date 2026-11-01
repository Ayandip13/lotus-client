import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Partner, LoginCredentials, AuthContextType } from '../types/auth.types';
import { loginPartner, logoutPartner, fetchCurrentSession } from '../services/auth.service';

const AUTH_TOKEN_KEY = 'lotus_auth_token';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(AUTH_TOKEN_KEY));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Logout handler
  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setToken(null);
    setUser(null);
    setPartner(null);
    logoutPartner();
  }, []);

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
        }
      } catch (err) {
        console.warn('Session restoration failed or token expired. Logging out.');
        if (isMounted) {
          localStorage.removeItem(AUTH_TOKEN_KEY);
          setToken(null);
          setUser(null);
          setPartner(null);
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
  }, []);

  // Login handler
  const login = async (credentials: LoginCredentials): Promise<void> => {
    const data = await loginPartner(credentials);
    localStorage.setItem(AUTH_TOKEN_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
    setPartner(data.partner);
  };

  const value: AuthContextType = {
    user,
    partner,
    token,
    isAuthenticated: Boolean(token && user && partner),
    isLoading,
    login,
    logout,
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
