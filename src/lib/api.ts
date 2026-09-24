import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const isBrowser = typeof window !== 'undefined';
const host = isBrowser ? window.location.hostname : 'localhost';

export const BACKEND_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  (isBrowser ? `http://${host}:5050` : 'http://localhost:5050');

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  `${BACKEND_URL}/api`;

export const getFileUrl = (path?: string | null): string => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${BACKEND_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Request interceptor — accessToken qo'shish
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — token yangilash
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    const isAuthEndpoint = originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('bpm-auth');
          if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          return Promise.reject(error);
        }

        const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = response.data.data;

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        try {
          const { useAuthStore } = require('../store/authStore');
          useAuthStore.getState().setTokens(accessToken, newRefreshToken);
        } catch {
          // Store sync fallback
        }

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }

        return api(originalRequest);
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('bpm-auth');
        try {
          const { useAuthStore } = require('../store/authStore');
          useAuthStore.getState().logout().catch(() => {});
        } catch {}
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

    }

    return Promise.reject(error);
  }
);

export default api;

export interface IncomingEmailDocument {
  id: number;
  docNumber: string;
  title: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  senderOrg?: string | null;
  senderDocNumber?: string | null;
  senderDate?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  overallDeadline?: string | null;
  resolution?: string | null;
  createdAt: string;
  creator?: { id: number; fullName: string; email: string; department?: string | null };
  executor?: { id: number; fullName: string; email: string; department?: string | null };
  attachments?: { id: number; fileUrl: string; fileName: string; fileSize?: number | null }[];
}

export const getIncomingEmails = async (params?: { status?: string; search?: string; page?: number; limit?: number }) => {
  const response = await api.get('/incoming-emails', { params });
  return response.data;
};

export const assignIncomingEmail = async (docId: number, data: { executorId: number; overallDeadline?: string; resolution?: string; priority?: string }) => {
  const response = await api.post(`/incoming-emails/${docId}/assign`, data);
  return response.data;
};

export const syncIncomingEmails = async () => {
  const response = await api.post('/incoming-emails/sync');
  return response.data;
};

