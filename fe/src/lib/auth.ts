/**
 * NAOS Auth Library - JWT 토큰 관리
 */

import type { AuthUser } from '@/features/auth/types/auth.types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8090';

// 토큰 저장
export const saveTokens = (accessToken: string, refreshToken: string) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
};

export const getAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
};

export const getRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refreshToken');
};

// 유저 정보 저장
export const saveUser = (user: AuthUser) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('user', JSON.stringify(user));
};

export const getUser = (): AuthUser | null => {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

// 인증 상태
export const clearAuth = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};

export const isLoggedIn = (): boolean => {
  return !!getAccessToken();
};

// 토큰 갱신
const refreshAccessToken = async (): Promise<boolean> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (response.ok) {
      const data = await response.json();
      saveTokens(data.accessToken, data.refreshToken);
      saveUser({
        id: data.userId,
        email: data.email,
        username: data.username,
        fullName: data.fullName,
        avatarUrl: data.avatarUrl,
      });
      return true;
    }
  } catch (e) {
    console.error('Token refresh failed:', e);
  }
  return false;
};

// 인증된 fetch
export const authFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = getAccessToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const fullUrl = url.startsWith('http') ? url : `${API_URL}${url}`;
  const response = await fetch(fullUrl, { ...options, headers });

  if (response.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      const newToken = getAccessToken();
      return fetch(fullUrl, {
        ...options,
        headers: { ...headers, Authorization: `Bearer ${newToken}` },
      });
    } else {
      clearAuth();
      if (typeof window !== 'undefined') {
        window.location.href = '/auth';
      }
    }
  }

  return response;
};
