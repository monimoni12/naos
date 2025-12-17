'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import type { LoginFormData } from '../types';

interface LoginFormProps {
  data: LoginFormData;
  setData: React.Dispatch<React.SetStateAction<LoginFormData>>;
  loading: boolean;
  showPassword: boolean;
  setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
  onSubmit: (e: React.FormEvent) => void;
}

export function LoginForm({
  data,
  setData,
  loading,
  showPassword,
  setShowPassword,
  onSubmit,
}: LoginFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="login-identifier">이메일 또는 사용자명</Label>
        <Input
          id="login-identifier"
          type="text"
          placeholder="이메일 또는 사용자명"
          value={data.identifier}
          onChange={(e) => setData({ ...data, identifier: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="login-password">비밀번호</Label>
        <div className="relative">
          <Input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="비밀번호"
            value={data.password}
            onChange={(e) => setData({ ...data, password: e.target.value })}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <Button type="submit" className="w-full mt-2" variant="secondary" disabled={loading}>
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
        로그인
      </Button>
    </form>
  );
}

export default LoginForm;
