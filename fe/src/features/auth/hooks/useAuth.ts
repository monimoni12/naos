'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { isLoggedIn, saveTokens, saveUser } from '@/lib/auth';
import { authApi } from '../api/authApi';
import type {
  SignupStep,
  SignupFormData,
  LoginFormData,
  EmailStatus,
  UsernameStatus,
  VerificationStatus,
} from '../types';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_.]{3,20}$/;

export function useAuth() {
  const router = useRouter();

  // 로그인 상태
  const [loginData, setLoginData] = useState<LoginFormData>({
    identifier: '',
    password: '',
  });
  const [loginLoading, setLoginLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // 회원가입 상태
  const [signupStep, setSignupStep] = useState<SignupStep>(1);
  const [signupData, setSignupData] = useState<SignupFormData>({
    email: '',
    verificationCode: '',
    username: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    birthDate: '',
  });
  const [signupLoading, setSignupLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 유효성 검사 상태
  const [emailStatus, setEmailStatus] = useState<EmailStatus>('idle');
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle');
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('idle');

  // 마운트 시 세션 체크
  useEffect(() => {
    if (isLoggedIn()) {
      router.push('/');
    }
  }, [router]);

  // 이메일 유효성 검사 (디바운스)
  const checkEmailAvailability = useCallback(async (email: string) => {
    if (!email) {
      setEmailStatus('idle');
      return;
    }
    if (!EMAIL_REGEX.test(email)) {
      setEmailStatus('invalid');
      return;
    }
    setEmailStatus('checking');
    try {
      const result = await authApi.checkEmail(email);
      setEmailStatus(result.available ? 'available' : 'taken');
    } catch (error) {
      console.error('Email check error:', error);
      setEmailStatus('idle');
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (signupData.email && signupStep === 1) {
        checkEmailAvailability(signupData.email);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [signupData.email, signupStep, checkEmailAvailability]);

  // 사용자명 유효성 검사 (디바운스)
  const checkUsernameAvailability = useCallback(async (username: string) => {
    if (!username) {
      setUsernameStatus('idle');
      return;
    }
    if (!USERNAME_REGEX.test(username)) {
      setUsernameStatus('invalid');
      return;
    }
    setUsernameStatus('checking');
    try {
      const result = await authApi.checkUsername(username);
      setUsernameStatus(result.available ? 'available' : 'taken');
    } catch (error) {
      console.error('Username check error:', error);
      setUsernameStatus('idle');
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (signupData.username && signupStep === 3) {
        checkUsernameAvailability(signupData.username);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [signupData.username, signupStep, checkUsernameAvailability]);

  // 인증 코드 발송
  const handleSendVerification = async () => {
    if (emailStatus !== 'available') return;
    setVerificationStatus('sending');
    try {
      const result = await authApi.sendVerification(signupData.email);
      if (result.success) {
        setVerificationStatus('sent');
        toast.success('인증 코드 발송', { description: '이메일을 확인해주세요.' });
      } else {
        setVerificationStatus('idle');
        toast.error('발송 실패', { description: result.message || '다시 시도해주세요.' });
      }
    } catch (error) {
      setVerificationStatus('idle');
      toast.error('오류', { description: '인증 코드 발송 중 오류가 발생했습니다.' });
    }
  };

  // 인증 코드 확인
  const handleVerifyEmail = async () => {
    if (!signupData.verificationCode) return;
    setVerificationStatus('verifying');
    try {
      const result = await authApi.verifyEmail(signupData.email, signupData.verificationCode);
      if (result.success) {
        setVerificationStatus('verified');
        toast.success('인증 완료', { description: '이메일이 인증되었습니다.' });
        setSignupStep(3);
      } else {
        setVerificationStatus('failed');
        toast.error('인증 실패', { description: result.message || '코드를 다시 확인해주세요.' });
      }
    } catch (error) {
      setVerificationStatus('failed');
      toast.error('오류', { description: '인증 중 오류가 발생했습니다.' });
    }
  };

  // Step 1 → 2
  const handleStep1Next = () => {
    if (emailStatus !== 'available') {
      toast.error('이메일 확인 필요', { description: '유효하고 사용 가능한 이메일을 입력해주세요.' });
      return;
    }
    setSignupStep(2);
  };

  // Step 3 → 4
  const handleStep3Next = () => {
    if (usernameStatus !== 'available') {
      toast.error('사용자명 확인 필요', { description: '사용 가능한 사용자명을 입력해주세요.' });
      return;
    }
    setSignupStep(4);
  };

  // 회원가입 처리
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signupData.password.length < 8 || signupData.password.length > 20) {
      toast.error('비밀번호 오류', { description: '비밀번호는 8~20자여야 합니다.' });
      return;
    }
    if (signupData.password !== signupData.confirmPassword) {
      toast.error('비밀번호 불일치', { description: '비밀번호가 일치하지 않습니다.' });
      return;
    }

    setSignupLoading(true);
    try {
      const result = await authApi.signup({
        email: signupData.email,
        password: signupData.password,
        username: signupData.username,
        fullName: signupData.fullName || undefined,
        birthDate: signupData.birthDate || undefined,
      });
      if (result.success) {
        toast.success('회원가입 완료', { description: '로그인해주세요.' });
        resetSignupForm();
      } else {
        toast.error('회원가입 실패', { description: result.message || '회원가입 중 오류가 발생했습니다.' });
      }
    } catch (error) {
      console.error('Signup error:', error);
      toast.error('회원가입 실패', { description: '회원가입 중 오류가 발생했습니다.' });
    } finally {
      setSignupLoading(false);
    }
  };

  // 로그인 처리
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginData.identifier || !loginData.password) {
      toast.error('입력 오류', { description: '모든 필드를 입력해주세요.' });
      return;
    }

    setLoginLoading(true);
    try {
      const data = await authApi.login(loginData.identifier, loginData.password);
      if (data.accessToken && data.refreshToken) {
        saveTokens(data.accessToken, data.refreshToken);
        saveUser({
          id: data.userId!,
          email: data.email!,
          username: data.username!,
          fullName: data.fullName || null,
          avatarUrl: data.avatarUrl || null,
        });
        toast.success('로그인 성공', { description: '환영합니다!' });
        router.push('/');
      } else {
        toast.error('로그인 실패', { description: data.message || '이메일/사용자명 또는 비밀번호가 올바르지 않습니다.' });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('로그인 실패', { description: '로그인 중 오류가 발생했습니다.' });
    } finally {
      setLoginLoading(false);
    }
  };

  // 폼 리셋
  const resetSignupForm = () => {
    setSignupStep(1);
    setSignupData({
      email: '',
      verificationCode: '',
      username: '',
      password: '',
      confirmPassword: '',
      fullName: '',
      birthDate: '',
    });
    setEmailStatus('idle');
    setUsernameStatus('idle');
    setVerificationStatus('idle');
  };

  return {
    loginData, setLoginData, loginLoading, showLoginPassword, setShowLoginPassword, handleLogin,
    signupStep, setSignupStep, signupData, setSignupData, signupLoading,
    showPassword, setShowPassword, showConfirmPassword, setShowConfirmPassword,
    emailStatus, setEmailStatus, usernameStatus, setUsernameStatus, verificationStatus, setVerificationStatus,
    handleSendVerification, handleVerifyEmail, handleStep1Next, handleStep3Next, handleSignup, resetSignupForm,
  };
}

export default useAuth;
