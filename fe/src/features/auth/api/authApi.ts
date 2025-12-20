/**
 * Auth API - 백엔드 Auth API 호출
 */

import { authFetch, getRefreshToken, clearAuth } from '@/lib/auth';
import type {
  LoginResponse,
  SignupRequest,
  SignupResponse,
  EmailCheckResponse,
  UsernameCheckResponse,
  VerificationSendResponse,
  VerificationCheckResponse,
} from '../types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8090';

export const authApi = {
  checkEmail: async (email: string): Promise<EmailCheckResponse> => {
    const response = await fetch(
      `${API_URL}/api/auth/check-email?email=${encodeURIComponent(email)}`
    );
    return response.json();
  },

  sendVerification: async (email: string): Promise<VerificationSendResponse> => {
    const response = await fetch(`${API_URL}/api/auth/send-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await response.json();
    return {
      success: response.ok,
      message: data.message
    };
  },

  verifyEmail: async (email: string, code: string): Promise<VerificationCheckResponse> => {
    const response = await fetch(`${API_URL}/api/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });
    const data = await response.json();
    return {
      success: response.ok && data.verified,
      message: data.message
    };
  },

  checkUsername: async (username: string): Promise<UsernameCheckResponse> => {
    const response = await fetch(
      `${API_URL}/api/auth/check-username?username=${encodeURIComponent(username)}`
    );
    return response.json();
  },

  signup: async (data: SignupRequest): Promise<SignupResponse> => {
    const response = await fetch(`${API_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    return {
      ...result,
      success: response.ok
    };
  },

  login: async (identifier: string, password: string): Promise<LoginResponse> => {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });
    return response.json();
  },

  logout: async (): Promise<void> => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        await authFetch('/api/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
        });
      } catch (e) {
        console.error('Logout API failed:', e);
      }
    }
    clearAuth();
  },
};

export default authApi;
