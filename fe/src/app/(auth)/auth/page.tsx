'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@radix-ui/react-tabs';
import { useAuth, LoginForm, SignupForm } from '@/features/auth';

export default function AuthPage() {
  const auth = useAuth();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 로고 */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img
              src="/naos-icon.gif"
              alt="NAOS"
              className="w-52 h-auto object-contain animate-bounce"
              style={{ animationDuration: '2s' }}
            />
          </div>
        </div>

        {/* 탭: 로그인 / 회원가입 */}
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted p-1 rounded-md">
            <TabsTrigger
              value="login"
              className="rounded-sm px-3 py-1.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              로그인
            </TabsTrigger>
            <TabsTrigger
              value="signup"
              onClick={() => auth.setSignupStep(1)}
              className="rounded-sm px-3 py-1.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              회원가입
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="mt-6">
            <LoginForm
              data={auth.loginData}
              setData={auth.setLoginData}
              loading={auth.loginLoading}
              showPassword={auth.showLoginPassword}
              setShowPassword={auth.setShowLoginPassword}
              onSubmit={auth.handleLogin}
            />
          </TabsContent>

          <TabsContent value="signup" className="mt-6">
            <SignupForm
              step={auth.signupStep}
              setStep={auth.setSignupStep}
              data={auth.signupData}
              setData={auth.setSignupData}
              loading={auth.signupLoading}
              showPassword={auth.showPassword}
              setShowPassword={auth.setShowPassword}
              showConfirmPassword={auth.showConfirmPassword}
              setShowConfirmPassword={auth.setShowConfirmPassword}
              emailStatus={auth.emailStatus}
              setEmailStatus={auth.setEmailStatus}
              usernameStatus={auth.usernameStatus}
              setUsernameStatus={auth.setUsernameStatus}
              verificationStatus={auth.verificationStatus}
              setVerificationStatus={auth.setVerificationStatus}
              onSendVerification={auth.handleSendVerification}
              onVerifyEmail={auth.handleVerifyEmail}
              onStep1Next={auth.handleStep1Next}
              onStep3Next={auth.handleStep3Next}
              onSubmit={auth.handleSignup}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
