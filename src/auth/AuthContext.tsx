/* eslint-disable react-refresh/only-export-components */
/* eslint-disable react-hooks/set-state-in-effect */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import rolesApi from '@/services/rolesApi';

export interface User {
  id: string | number;
  email: string;
  tenantId: number;
  tenantCode: string;
  isPlatformAdmin: boolean;
  role?: string;
}

interface AuthContextValue {
  token: string | null;
  user: User | null;
  permissions: string[];
  modules: string[];
  loading: boolean;
  login: (newToken: string, newPermissions: string[], newModules: string[], newTenantCode?: string, newRole?: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const parseToken = (jwtToken: string | null): User | null => {
  if (!jwtToken) return null;
  try {
    const payload = JSON.parse(atob(jwtToken.split('.')[1]));
    const storedRole = typeof window !== 'undefined' ? localStorage.getItem('role') : null;
    const role = storedRole || payload.role || payload.roleName || 'STAFF';
    const normalizedRole = String(role).toUpperCase().replace(/[^A-Z0-9]+/g, '_');
    const isPlatformRole = ['SUPER_ADMIN', 'SUPERADMIN', 'PLATFORM_ADMIN', 'SYSTEM_ADMIN'].includes(normalizedRole);
    
    return {
      id: payload.id || payload.userId,
      email: payload.sub,
      tenantId: payload.tenantId,
      tenantCode: payload.tenantCode,
      isPlatformAdmin: payload.tenantCode === 'SYS' || isPlatformRole,
      role,
    };
  } catch {
    return null;
  }
};

const clearStorage = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('permissions');
  localStorage.removeItem('modules');
  localStorage.removeItem('tenantCode');
  localStorage.removeItem('role');
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const storedToken = localStorage.getItem('token');
    if (storedToken && !parseToken(storedToken)) {
      clearStorage();
      return null;
    }
    return storedToken;
  });

  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null;
    const storedToken = localStorage.getItem('token');
    return parseToken(storedToken);
  });

  const [permissions, setPermissions] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    const storedToken = localStorage.getItem('token');
    const parsedUser = storedToken ? parseToken(storedToken) : null;
    if (!storedToken || !parsedUser) return [];


    const storedPermissions = localStorage.getItem('permissions');
    try {
      return JSON.parse(storedPermissions || '[]');
    } catch {
      return [];
    }
  });

  const [modules, setModules] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    const storedToken = localStorage.getItem('token');
    const parsedUser = storedToken ? parseToken(storedToken) : null;
    if (!storedToken || !parsedUser) return [];


    const storedModules = localStorage.getItem('modules');
    try {
      return JSON.parse(storedModules || '[]');
    } catch {
      return [];
    }
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const syncCurrentUser = async () => {
      if (!token) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const res = await rolesApi.get<{ id: string | number; email?: string; role?: string; permissions?: string[] }>('/users/me/');
        if (!isMounted) return;

        const nextPermissions = Array.isArray(res.data?.permissions) ? res.data.permissions : [];
        setPermissions(nextPermissions);
        localStorage.setItem('permissions', JSON.stringify(nextPermissions));

        if (res.data?.role) {
          localStorage.setItem('role', res.data.role);
          setUser((prev) => (prev ? { ...prev, role: res.data.role } : prev));
        }
      } catch {
        // Keep the permissions loaded from the token/localStorage when the
        // profile sync is temporarily unavailable.
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    syncCurrentUser();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const login = (newToken: string, newPermissions: string[], newModules: string[], newTenantCode?: string, newRole?: string) => {
    let finalPermissions = newPermissions;
    let finalModules = newModules;
    const parsedUser = parseToken(newToken);
    localStorage.setItem('token', newToken);
    localStorage.setItem('permissions', JSON.stringify(finalPermissions));
    localStorage.setItem('modules', JSON.stringify(finalModules));
    
    const tenantCode = newTenantCode || parsedUser?.tenantCode;
    
    if (tenantCode) {
      localStorage.setItem('tenantCode', tenantCode.toUpperCase());
    } else {
      localStorage.removeItem('tenantCode');
    }
    if (newRole) {
      localStorage.setItem('role', newRole);
    } else {
      localStorage.removeItem('role');
    }

    setToken(newToken);
    setUser(parsedUser);
    setPermissions(finalPermissions);
    setModules(finalModules);
  };

  const logout = () => {
    clearStorage();
    setToken(null);
    setUser(null);
    setPermissions([]);
    setModules([]);
  };

  const value: AuthContextValue = {
    token,
    user,
    permissions,
    modules,
    loading,
    login,
    logout,
    isAuthenticated: !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
