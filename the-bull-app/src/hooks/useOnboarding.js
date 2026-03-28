import { useState, useEffect, useCallback } from 'react';

/**
 * Onboarding steps for first-time users
 */
const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    title: 'Добро пожаловать в БЫК App!',
    description: 'Приложение для обучения и управления ресторанным бизнесом',
    target: null,
    position: 'center',
    action: 'next',
  },
  {
    id: 'menu',
    title: 'Меню',
    description: 'Здесь вы найдёте полное меню с описанием всех блюд и напитков',
    target: '[data-tutorial="menu"]',
    position: 'bottom',
    action: 'next',
  },
  {
    id: 'learning',
    title: 'Обучение',
    description: 'Пройдите интерактивные уроки и получите сертификат',
    target: '[data-tutorial="learning"]',
    position: 'bottom',
    action: 'next',
  },
  {
    id: 'profile',
    title: 'Профиль',
    description: 'Управляйте своим профилем и отслеживайте прогресс',
    target: '[data-tutorial="profile"]',
    position: 'bottom',
    action: 'next',
  },
  {
    id: 'settings',
    title: 'Настройки',
    description: 'Настройте приложение под себя и управляйте подпиской',
    target: '[data-tutorial="settings"]',
    position: 'bottom',
    action: 'next',
  },
  {
    id: 'complete',
    title: 'Готово!',
    description: 'Вы готовы начать. Нажмите "Завершить" для начала работы',
    target: null,
    position: 'center',
    action: 'complete',
  },
];

/**
 * Onboarding tutorial hook
 * Manages first-time user experience
 */
export function useOnboarding() {
  const [isOnboarding, setIsOnboarding] = useState(() => {
    const completed = localStorage.getItem('onboardingCompleted');
    return !completed;
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(() => {
    const saved = localStorage.getItem('completedOnboardingSteps');
    return saved ? JSON.parse(saved) : [];
  });

  // Save completed steps
  useEffect(() => {
    localStorage.setItem('completedOnboardingSteps', JSON.stringify(completedSteps));
  }, [completedSteps]);

  /**
   * Move to next step
   */
  const nextStep = useCallback(() => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      setCompletedSteps([...completedSteps, ONBOARDING_STEPS[currentStep].id]);
    }
  }, [currentStep, completedSteps]);

  /**
   * Move to previous step
   */
  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  /**
   * Skip onboarding
   */
  const skipOnboarding = useCallback(() => {
    localStorage.setItem('onboardingCompleted', 'true');
    setIsOnboarding(false);
  }, []);

  /**
   * Complete onboarding
   */
  const completeOnboarding = useCallback(() => {
    localStorage.setItem('onboardingCompleted', 'true');
    setCompletedSteps([...completedSteps, ONBOARDING_STEPS[currentStep].id]);
    setIsOnboarding(false);
  }, [currentStep, completedSteps]);

  /**
   * Reset onboarding (for testing)
   */
  const resetOnboarding = useCallback(() => {
    localStorage.removeItem('onboardingCompleted');
    localStorage.removeItem('completedOnboardingSteps');
    setIsOnboarding(true);
    setCurrentStep(0);
    setCompletedSteps([]);
  }, []);

  /**
   * Get current step
   */
  const step = ONBOARDING_STEPS[currentStep];

  /**
   * Get progress percentage
   */
  const progress = Math.round(((currentStep + 1) / ONBOARDING_STEPS.length) * 100);

  return {
    // State
    isOnboarding,
    currentStep,
    step,
    completedSteps,
    progress,
    totalSteps: ONBOARDING_STEPS.length,

    // Methods
    nextStep,
    prevStep,
    skipOnboarding,
    completeOnboarding,
    resetOnboarding,

    // Constants
    ONBOARDING_STEPS,
  };
}
