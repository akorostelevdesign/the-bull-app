import { useState, useEffect, useCallback } from 'react';

/**
 * Enhanced gamified learning hook with:
 * - Lives system (3 lives, lose on wrong answers)
 * - Module-based learning (Menu, Service, Upsell, Knowledge)
 * - Progress tracking per module
 * - Promo code generation for 80%+ completion
 * - Results screen with score and motivational messages
 */

const MODULES = [
  {
    id: 'menu',
    name: 'Меню',
    description: 'Кухня и Бар',
    icon: '🍽️',
    lessons: 5,
    color: '#FF6B6B',
  },
  {
    id: 'service',
    name: 'Стандарты сервиса',
    description: 'Как обслуживать гостей',
    icon: '👨‍💼',
    lessons: 6,
    color: '#4ECDC4',
  },
  {
    id: 'upsell',
    name: 'Техники допродаж',
    description: 'Увеличивайте средний чек',
    icon: '💰',
    lessons: 4,
    color: '#FFE66D',
  },
  {
    id: 'knowledge',
    name: 'Знания о ресторане',
    description: 'История и факты',
    icon: '📚',
    lessons: 3,
    color: '#95E1D3',
  },
];

const INITIAL_STATE = {
  lives: 3,
  currentModule: null,
  currentLesson: 0,
  moduleProgress: {
    menu: { completed: 0, score: 0, attempts: 0 },
    service: { completed: 0, score: 0, attempts: 0 },
    upsell: { completed: 0, score: 0, attempts: 0 },
    knowledge: { completed: 0, score: 0, attempts: 0 },
  },
  allModulesCompleted: false,
  promoCode: null,
  sessionScore: 0,
  sessionCorrect: 0,
  sessionTotal: 0,
};

export function useGamifiedLearning() {
  const [state, setState] = useState(() => {
    const saved = localStorage.getItem('gamifiedLearning');
    return saved ? { ...INITIAL_STATE, ...JSON.parse(saved) } : INITIAL_STATE;
  });

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem('gamifiedLearning', JSON.stringify(state));
  }, [state]);

  // Start a module
  const startModule = useCallback((moduleId) => {
    setState(prev => ({
      ...prev,
      currentModule: moduleId,
      currentLesson: 0,
      sessionScore: 0,
      sessionCorrect: 0,
      sessionTotal: 0,
    }));
  }, []);

  // End current module and show results
  const endModule = useCallback((score, correct, total) => {
    setState(prev => {
      const moduleId = prev.currentModule;
      if (!moduleId) return prev;

      const percentage = Math.round((correct / total) * 100);
      const newProgress = { ...prev.moduleProgress };
      newProgress[moduleId] = {
        completed: newProgress[moduleId].completed + 1,
        score: Math.max(newProgress[moduleId].score, percentage),
        attempts: newProgress[moduleId].attempts + 1,
      };

      // Check if all modules completed with 80%+ score
      const allCompleted = MODULES.every(m => newProgress[m.id].score >= 80);
      const promoCode = allCompleted && !prev.promoCode ? generatePromoCode() : prev.promoCode;

      return {
        ...prev,
        moduleProgress: newProgress,
        currentModule: null,
        allModulesCompleted: allCompleted,
        promoCode,
        sessionScore: percentage,
        sessionCorrect: correct,
        sessionTotal: total,
      };
    });
  }, []);

  // Lose a life
  const loseLife = useCallback(() => {
    setState(prev => ({
      ...prev,
      lives: Math.max(0, prev.lives - 1),
    }));
  }, []);

  // Restore a life (e.g., watch video)
  const restoreLife = useCallback(() => {
    setState(prev => ({
      ...prev,
      lives: Math.min(3, prev.lives + 1),
    }));
  }, []);

  // Reset all progress
  const resetProgress = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  // Get module progress percentage
  const getModuleProgress = useCallback((moduleId) => {
    const module = MODULES.find(m => m.id === moduleId);
    if (!module) return 0;
    return Math.round((state.moduleProgress[moduleId].score / 100) * 100);
  }, [state.moduleProgress]);

  // Get overall progress
  const getOverallProgress = useCallback(() => {
    const scores = Object.values(state.moduleProgress).map(m => m.score);
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    return avgScore;
  }, [state.moduleProgress]);

  // Get motivational message based on score
  const getMotivationalMessage = useCallback((score) => {
    if (score >= 90) return '🌟 Отлично! Ты эксперт!';
    if (score >= 80) return '👏 Хорошо! Продолжай в том же духе!';
    if (score >= 70) return '💪 Неплохо! Ещё немного практики!';
    if (score >= 60) return '📚 Хороший старт! Учись дальше!';
    return '🔄 Попробуй ещё раз!';
  }, []);

  return {
    // State
    lives: state.lives,
    currentModule: state.currentModule,
    currentLesson: state.currentLesson,
    moduleProgress: state.moduleProgress,
    allModulesCompleted: state.allModulesCompleted,
    promoCode: state.promoCode,
    sessionScore: state.sessionScore,
    sessionCorrect: state.sessionCorrect,
    sessionTotal: state.sessionTotal,

    // Actions
    startModule,
    endModule,
    loseLife,
    restoreLife,
    resetProgress,

    // Getters
    getModuleProgress,
    getOverallProgress,
    getMotivationalMessage,

    // Constants
    MODULES,
  };
}

/**
 * Generate unique promo code
 * Format: BULL-XXXX-2024
 */
function generatePromoCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const year = new Date().getFullYear();
  return `BULL-${code}-${year}`;
}
