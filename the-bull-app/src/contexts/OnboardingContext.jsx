import React, { createContext, useContext } from 'react';
import { useOnboarding } from '../hooks/useOnboarding';
import OnboardingOverlay from '../components/OnboardingOverlay';

const OnboardingContext = createContext();

/**
 * Onboarding provider component
 * Wraps the app to provide onboarding functionality
 */
export function OnboardingProvider({ children }) {
  const onboarding = useOnboarding();

  return (
    <OnboardingContext.Provider value={onboarding}>
      {children}
      {onboarding.isOnboarding && (
        <OnboardingOverlay
          step={onboarding.step}
          currentStep={onboarding.currentStep}
          totalSteps={onboarding.totalSteps}
          progress={onboarding.progress}
          onNext={onboarding.nextStep}
          onPrev={onboarding.prevStep}
          onSkip={onboarding.skipOnboarding}
          onComplete={onboarding.completeOnboarding}
        />
      )}
    </OnboardingContext.Provider>
  );
}

/**
 * Hook to use onboarding context
 */
export function useOnboardingContext() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboardingContext must be used within OnboardingProvider');
  }
  return context;
}
