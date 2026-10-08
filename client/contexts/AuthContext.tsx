'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { authApi, resumeApi } from '@/lib/api';
import { isSafeReturnPath, isAuthPage } from '@/lib/canonical';
import { optimizeAvatar } from '@/lib/avatar';
import type { User, LoginCredentials } from '@/types';

// Guest resume localStorage utilities
const GUEST_RESUME_KEY = 'resume-builder-guest-draft';

function loadGuestResume() {
  try {
    const data = localStorage.getItem(GUEST_RESUME_KEY);
    if (!data) return null;
    return JSON.parse(data);
  } catch {
    return null;
  }
}

function clearGuestResume() {
  localStorage.removeItem(GUEST_RESUME_KEY);
}

// Warm the browser cache for the avatar so the navbar shows the user's
// picture instantly on mount instead of after a slow fetch.
function preloadAvatar(url?: string) {
  const src = optimizeAvatar(url);
  if (!src) return;
  const img = new Image();
  img.referrerPolicy = 'no-referrer';
  img.src = src;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials, redirectTo?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updatedUser: User) => void;
  migrateGuestResume: () => Promise<string | null>;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Remember the last page a logged-out visitor was on, so the login page can
  // send them back there after signing in. Auth pages are never recorded — a
  // logged-in user sent back to a login page causes redirect loops.
  useEffect(() => {
    if (!loading && !user && pathname && !isAuthPage(pathname)) {
      try {
        sessionStorage.setItem('returnTo', pathname);
      } catch {
        // sessionStorage unavailable — redirect just falls back to homepage
      }
    }
  }, [loading, user, pathname]);

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          setUser(parsed);
          preloadAvatar(parsed.picture);
          // Optionally verify token with backend
          const response = await authApi.getCurrentUser();
          if (response.success && response.user) {
            setUser(response.user);
            localStorage.setItem('user', JSON.stringify(response.user));
          }
        } catch (error) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const login = async (credentials: LoginCredentials, redirectTo?: string) => {
    try {
      const response = await authApi.login(credentials);

      if (response.success && response.token && response.user) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        setUser(response.user);

        // Redirect based on role — staff accounts (admins, super admins, SRT
        // and custom-role holders) go to the admin console
        if (
          response.user.role === 'admin' ||
          response.user.role === 'super-admin' ||
          response.user.role === 'srt' ||
          response.user.role === 'staff'
        ) {
          router.push('/admin/dashboard');
        } else {
          router.push(redirectTo || '/');
        }
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      throw new Error(err.response?.data?.message || 'Login failed');
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      // Silent error handling
    } finally {
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/admin/login');
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const migrateGuestResume = async (): Promise<string | null> => {
    try {
      const guestResume = loadGuestResume();
      if (!guestResume) return null;

      const response = await resumeApi.create(guestResume);
      if (response.data) {
        clearGuestResume();
        return response.data._id;
      }
      return null;
    } catch (error) {
      console.error('Failed to migrate guest resume:', error);
      return null;
    }
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'super-admin';
  const isSuperAdmin = user?.role === 'super-admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        updateUser,
        migrateGuestResume,
        isAdmin,
        isSuperAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
