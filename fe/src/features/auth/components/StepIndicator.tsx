import type { SignupStep } from '../types';

interface StepIndicatorProps {
  currentStep: SignupStep;
  totalSteps?: number;
}

export function StepIndicator({ currentStep, totalSteps = 4 }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
        <div
          key={step}
          className={`w-2 h-2 rounded-full transition-colors ${
            step === currentStep
              ? 'bg-mocha'
              : step < currentStep
              ? 'bg-mocha/50'
              : 'bg-muted'
          }`}
        />
      ))}
      <span className="ml-2 text-sm text-muted-foreground">
        {currentStep}/{totalSteps}
      </span>
    </div>
  );
}

export default StepIndicator;
