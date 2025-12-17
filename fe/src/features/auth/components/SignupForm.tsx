'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, X, Loader2, Eye, EyeOff, ArrowLeft, ArrowRight } from 'lucide-react';
import { StepIndicator } from './StepIndicator';
import type {
  SignupStep,
  SignupFormData,
  EmailStatus,
  UsernameStatus,
  VerificationStatus,
} from '../types';

interface SignupFormProps {
  step: SignupStep;
  setStep: React.Dispatch<React.SetStateAction<SignupStep>>;
  data: SignupFormData;
  setData: React.Dispatch<React.SetStateAction<SignupFormData>>;
  loading: boolean;
  showPassword: boolean;
  setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
  showConfirmPassword: boolean;
  setShowConfirmPassword: React.Dispatch<React.SetStateAction<boolean>>;
  emailStatus: EmailStatus;
  setEmailStatus: React.Dispatch<React.SetStateAction<EmailStatus>>;
  usernameStatus: UsernameStatus;
  setUsernameStatus: React.Dispatch<React.SetStateAction<UsernameStatus>>;
  verificationStatus: VerificationStatus;
  setVerificationStatus: React.Dispatch<React.SetStateAction<VerificationStatus>>;
  onSendVerification: () => void;
  onVerifyEmail: () => void;
  onStep1Next: () => void;
  onStep3Next: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function SignupForm({
  step, setStep, data, setData, loading,
  showPassword, setShowPassword, showConfirmPassword, setShowConfirmPassword,
  emailStatus, setEmailStatus, usernameStatus, setUsernameStatus,
  verificationStatus, setVerificationStatus,
  onSendVerification, onVerifyEmail, onStep1Next, onStep3Next, onSubmit,
}: SignupFormProps) {

  // Step 1: 이메일 입력
  const renderStep1 = () => (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="signup-email">이메일</Label>
        <div className="relative">
          <Input
            id="signup-email"
            type="email"
            placeholder="example@email.com"
            value={data.email}
            onChange={(e) => {
              setData({ ...data, email: e.target.value });
              setEmailStatus('idle');
            }}
            className="pr-10"
          />
          {emailStatus === 'checking' && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
          )}
          {emailStatus === 'available' && (
            <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
          )}
          {(emailStatus === 'taken' || emailStatus === 'invalid') && (
            <X className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-destructive" />
          )}
        </div>
        {emailStatus === 'invalid' && <p className="text-sm text-destructive">유효한 이메일 주소를 입력해주세요.</p>}
        {emailStatus === 'taken' && <p className="text-sm text-destructive">이미 사용 중인 이메일입니다.</p>}
      </div>
      <Button type="button" className="w-full" variant="secondary" onClick={onStep1Next} disabled={emailStatus !== 'available'}>
        다음 <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );

  // Step 2: 이메일 인증
  const renderStep2 = () => (
    <div className="space-y-5">
      <div className="text-center mb-4">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{data.email}</span>
          <br />으로 인증 코드를 발송합니다
        </p>
      </div>

      {verificationStatus === 'idle' || verificationStatus === 'sending' ? (
        <Button type="button" className="w-full" variant="secondary" onClick={onSendVerification} disabled={verificationStatus === 'sending'}>
          {verificationStatus === 'sending' ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />발송 중...</> : '인증 코드 발송'}
        </Button>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="verification-code">인증 코드 (6자리)</Label>
            <Input
              id="verification-code"
              type="text"
              placeholder="000000"
              maxLength={6}
              value={data.verificationCode}
              onChange={(e) => setData({ ...data, verificationCode: e.target.value.replace(/\D/g, '') })}
              className="text-center text-lg tracking-widest"
            />
          </div>
          <Button type="button" className="w-full" variant="secondary" onClick={onVerifyEmail} disabled={data.verificationCode.length !== 6 || verificationStatus === 'verifying'}>
            {verificationStatus === 'verifying' ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />확인 중...</> : '확인'}
          </Button>
          <Button type="button" variant="ghost" className="w-full text-sm" onClick={onSendVerification} disabled={verificationStatus === 'verifying'}>
            코드 재발송
          </Button>
        </div>
      )}

      <Button type="button" variant="ghost" className="w-full" onClick={() => { setStep(1); setVerificationStatus('idle'); }}>
        <ArrowLeft className="mr-2 h-4 w-4" />이전
      </Button>
    </div>
  );

  // Step 3: 사용자명 입력
  const renderStep3 = () => (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="signup-username">사용자명</Label>
        <div className="relative">
          <Input
            id="signup-username"
            type="text"
            placeholder="username"
            value={data.username}
            onChange={(e) => {
              setData({ ...data, username: e.target.value });
              setUsernameStatus('idle');
            }}
            className="pr-10"
          />
          {usernameStatus === 'checking' && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
          )}
          {usernameStatus === 'available' && (
            <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
          )}
          {(usernameStatus === 'taken' || usernameStatus === 'invalid') && (
            <X className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-destructive" />
          )}
        </div>
        {usernameStatus === 'invalid' && <p className="text-sm text-destructive">3~20자의 영문, 숫자, _, . 만 사용 가능합니다.</p>}
        {usernameStatus === 'taken' && <p className="text-sm text-destructive">이미 사용 중인 사용자명입니다.</p>}
      </div>
      <Button type="button" className="w-full" variant="secondary" onClick={onStep3Next} disabled={usernameStatus !== 'available'}>
        다음 <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" className="w-full" onClick={() => setStep(2)}>
        <ArrowLeft className="mr-2 h-4 w-4" />이전
      </Button>
    </div>
  );

  // Step 4: 비밀번호 및 추가 정보
  const renderStep4 = () => (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="signup-password">비밀번호</Label>
        <div className="relative">
          <Input
            id="signup-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="8~20자"
            value={data.password}
            onChange={(e) => setData({ ...data, password: e.target.value })}
            className="pr-10"
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-confirm-password">비밀번호 확인</Label>
        <div className="relative">
          <Input
            id="signup-confirm-password"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="비밀번호 확인"
            value={data.confirmPassword}
            onChange={(e) => setData({ ...data, confirmPassword: e.target.value })}
            className="pr-10"
          />
          <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {data.confirmPassword && data.password !== data.confirmPassword && (
          <p className="text-sm text-destructive">비밀번호가 일치하지 않습니다.</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-fullname">성명 (선택)</Label>
        <Input id="signup-fullname" type="text" placeholder="홍길동" value={data.fullName} onChange={(e) => setData({ ...data, fullName: e.target.value })} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-birthdate">생년월일 (선택)</Label>
        <Input id="signup-birthdate" type="date" value={data.birthDate} onChange={(e) => setData({ ...data, birthDate: e.target.value })} />
      </div>

      <Button type="submit" className="w-full" variant="secondary" disabled={loading || data.password !== data.confirmPassword || data.password.length < 8}>
        {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />가입 중...</> : '가입 완료'}
      </Button>

      <Button type="button" variant="ghost" className="w-full" onClick={() => setStep(3)}>
        <ArrowLeft className="mr-2 h-4 w-4" />이전
      </Button>
    </form>
  );

  return (
    <>
      <StepIndicator currentStep={step} />
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderStep4()}
    </>
  );
}

export default SignupForm;
