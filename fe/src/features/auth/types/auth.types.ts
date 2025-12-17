/**
 * Auth Types
 */

export interface AuthUser {
  id: number;
  email: string;
  username: string;
  fullName: string | null;
  avatarUrl: string | null;
}

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface LoginResponse {
  accessToken?: string;
  refreshToken?: string;
  tokenType?: string;
  expiresIn?: number;
  userId?: number;
  email?: string;
  username?: string;
  fullName?: string;
  avatarUrl?: string;
  error?: string;
  message?: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  username: string;
  fullName?: string;
  birthDate?: string;
}

export interface SignupResponse {
  success: boolean;
  message?: string;
}

export interface EmailCheckResponse {
  available: boolean;
  message?: string;
}

export interface UsernameCheckResponse {
  available: boolean;
  message?: string;
}

export interface VerificationSendResponse {
  success: boolean;
  message?: string;
}

export interface VerificationCheckResponse {
  success: boolean;
  message?: string;
}

export type SignupStep = 1 | 2 | 3 | 4;
export type EmailStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';
export type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';
export type VerificationStatus = 'idle' | 'sending' | 'sent' | 'verifying' | 'verified' | 'failed';

export interface SignupFormData {
  email: string;
  verificationCode: string;
  username: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  birthDate: string;
}

export interface LoginFormData {
  identifier: string;
  password: string;
}
