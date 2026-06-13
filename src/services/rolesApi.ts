import axios, { InternalAxiosRequestConfig } from 'axios';

declare module 'axios' {
  export interface AxiosRequestConfig {
    ignore403?: boolean;
  }
}

const ROLES_API_BASE = import.meta.env.VITE_ROLES_API_BASE || import.meta.env.VITE_API_BASE || '/api';
const LAP_API_BASE = import.meta.env.VITE_LAP_API_BASE || import.meta.env.VITE_API_BASE || '/api';

const rolesApi = axios.create({
  baseURL: ROLES_API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach JWT token and X-Tenant header dynamically
rolesApi.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Determine the base URL dynamically based on the URL path
    const url = config.url || '';
    const isLapRoute = 
      url.startsWith('/attendance') ||
      url.startsWith('/leave') ||
      url.startsWith('/payroll') ||
      url.startsWith('/reports') ||
      url.startsWith('/self-reports') ||
      url.startsWith('/employees') ||
      url.startsWith('/departments') ||
      url.startsWith('/notifications') ||
      url.startsWith('/system-settings') ||
      url.startsWith('/tasks') ||
      url.startsWith('/affiliate') ||
      url.startsWith('/leads') ||
      url.startsWith('/tickets') ||
      url.startsWith('/support') ||
      url.startsWith('/revenue');

    config.baseURL = isLapRoute ? LAP_API_BASE : ROLES_API_BASE;

    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    const tenantCode = localStorage.getItem('tenantCode');
    if (tenantCode && config.headers) {
      config.headers['X-Tenant'] = tenantCode;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to catch 401/403 responses globally
rolesApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('permissions');
        localStorage.removeItem('modules');
        localStorage.removeItem('tenantCode');
        window.location.href = '/login';
      } else if (error.response.status === 403) {
        // DEV ONLY - remove before production: Disable global 403 redirects in development mode to allow UI testing
        if (!import.meta.env.DEV && !error.config?.ignore403 && window.location.pathname !== '/unauthorized') {
          window.location.href = '/unauthorized';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default rolesApi;
