import { useState, useEffect, useCallback } from 'react';
import { isUnlocked } from '../data/learning-schedule';

const LS_KEY = 'bull_learning_progress_v1';

// XP thresholds per level
export const LEVELS = [
  { name: 'Новичок',      rank: 'Lvl 1', min: 0    },
  { name: 'Стажёр',       rank: 'Lvl 2', min: 200  },
  { name: 'Официант',     rank: 'Lvl 3', min: 500  },
  { name: 'Гриль Мастер', rank: 'Lvl 4', min: 1000 },
  { name: 'Профи',        rank: 'Lvl 5', min: 2000 },
  { name: 'Легенда',      rank: 'Lvl 6', min: 4000 },
];

export const INITIAL_LIVES = 3;

export function getLevelInfo(xp) {
  let lvl = 0;
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].min) { lvl = i; break; }
  }
  const next = LEVELS[lvl + 1];
  const cur  = LEVELS[lvl];
  const pct  = next ? Math.round(((xp - cur.min) / (next.min - cur.min)) * 100) : 100;
  return { lvl, name: cur.name, rank: cur.rank, pct, nextMin: next?.min ?? null };
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function defaultProgress() {
  return {
    // Onboarding
    onboardingDone: false,
    courseDays: null,       // 7 | 14 | 28 | 45
    studyMode: null,        // 'study' | 'practice'
    grade: null,            // 1 | 2
    courseStartDate: null,  // ISO date string

    // Gamification
    xp: 0,
    level: 0,
    streak: 0,
    lives: INITIAL_LIVES,
    lastActivityDate: null,

    // Course progress
    courseCompleted: false,
    currentDayIndex: 0,     // which daily portion we're on (0-based)
    currentDayDone: false,  // has today's portion been completed

    // Section mastery (0-100 per section)
    mastery: {
      service: 0,
      kitchen: 0,
      bar: 0,
      knowledge: 0,
      upsell: 0,
    },

    // Fortune wheel
    fortuneWheelUsed: false,
    fortunePrize: null,

    // Unlocked content (populated as daily portions are completed)
    unlockedSections: [],  // e.g. ['service', 'kitchen']
    unlockedTopics: [],    // e.g. ['roasting', 'swipe-grain-grass']

    // Individual item mastery (for learning/catalog)
    learnedItems: {
      kitchen: [],
      bar: [],
      service: [],
      knowledge: [],
    },
  };
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return defaultProgress();
    const parsed = JSON.parse(raw);
    // Merge with defaults to handle new fields added in future versions
    return { ...defaultProgress(), ...parsed };
  } catch {
    return defaultProgress();
  }
}

function saveProgress(p) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(p));
  } catch (e) {
    console.error('Failed to save progress:', e);
  }
}

/**
 * Check streak and lives based on last activity date.
 * Called on every app open.
 * Returns updated progress object (does NOT mutate input).
 */
function checkStreakAndLives(p) {
  if (!p.onboardingDone) return p;

  const today = todayStr();
  if (p.lastActivityDate === today) return p; // already checked today

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  let updated = { ...p };

  if (p.lastActivityDate === null) {
    // First open after onboarding — no penalty
    return updated;
  }

  if (p.lastActivityDate === yesterdayStr) {
    // Consecutive day — streak continues (will be incremented on first exercise)
    return updated;
  }

  // Missed one or more days
  const lastDate = new Date(p.lastActivityDate);
  const todayDate = new Date(today);
  const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));
  const missedDays = diffDays - 1; // days with no activity

  if (missedDays > 0) {
    const newLives = Math.max(0, p.lives - missedDays);
    updated = { ...updated, lives: newLives, streak: 0 };
  }

  return updated;
}

/**
 * Calculate which daily portions are unlocked based on course start date
 * and how many days have passed.
 */
export function getUnlockedDayCount(courseStartDate, courseDays) {
  if (!courseStartDate || !courseDays) return 0;
  const start = new Date(courseStartDate);
  const today = new Date(todayStr());
  const elapsed = Math.floor((today - start) / (1000 * 60 * 60 * 24));
  return Math.min(elapsed + 1, courseDays); // +1 because day 1 is unlocked on start
}

/**
 * Get the daily portion index for today (0-based).
 */
export function getTodayPortionIndex(courseStartDate) {
  if (!courseStartDate) return 0;
  const start = new Date(courseStartDate);
  const today = new Date(todayStr());
  return Math.floor((today - start) / (1000 * 60 * 60 * 24));
}

/**
 * Check if the course deadline has passed without completion.
 */
export function isCourseExpired(courseStartDate, courseDays, courseCompleted) {
  if (!courseStartDate || !courseDays || courseCompleted) return false;
  const start = new Date(courseStartDate);
  const deadline = new Date(start);
  deadline.setDate(deadline.getDate() + courseDays);
  return new Date() > deadline;
}

export default function useProgress() {
  const [progress, setProgress] = useState(() => {
    const p = loadProgress();
    return checkStreakAndLives(p);
  });

  // Persist on every change
  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  // On mount: check streak/lives and course expiry
  useEffect(() => {
    setProgress(prev => {
      let updated = checkStreakAndLives(prev);

      // Reset course if expired
      if (isCourseExpired(updated.courseStartDate, updated.courseDays, updated.courseCompleted)) {
        updated = { ...defaultProgress(), onboardingDone: false };
      }

      // Reset course if lives hit 0
      if (updated.onboardingDone && updated.lives <= 0) {
        updated = { ...defaultProgress(), onboardingDone: false };
      }

      return updated;
    });
  }, []);

  /** Complete onboarding and start the course */
  const completeOnboarding = useCallback(({ courseDays, studyMode, grade }) => {
    setProgress(prev => ({
      ...prev,
      onboardingDone: true,
      courseDays,
      studyMode,
      grade,
      courseStartDate: todayStr(),
      lives: INITIAL_LIVES,
      currentDayIndex: 0,
      currentDayDone: false,
    }));
  }, []);

  /** Add XP (only in study mode). Returns true if level-up occurred. */
  const addXP = useCallback((amount) => {
    let leveledUp = false;
    setProgress(prev => {
      if (prev.studyMode !== 'study') return prev;

      const oldLevel = getLevelInfo(prev.xp).lvl;
      const newXP = prev.xp + amount;
      const newLevel = getLevelInfo(newXP).lvl;
      leveledUp = newLevel > oldLevel;

      const today = todayStr();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yStr = yesterday.toISOString().slice(0, 10);

      let newStreak = prev.streak;
      if (prev.lastActivityDate !== today) {
        newStreak = prev.lastActivityDate === yStr ? prev.streak + 1 : 1;
      }

      return {
        ...prev,
        xp: newXP,
        level: newLevel,
        streak: newStreak,
        lastActivityDate: today,
      };
    });
    return leveledUp;
  }, []);

  /** Update mastery for a section (0-100) — also auto-unlocks the section */
  const updateMastery = useCallback((section, pct) => {
    setProgress(prev => {
      const alreadyUnlocked = prev.unlockedSections.includes(section);
      return {
        ...prev,
        mastery: {
          ...prev.mastery,
          [section]: Math.max(prev.mastery[section] ?? 0, pct),
        },
        unlockedSections: alreadyUnlocked
          ? prev.unlockedSections
          : [...prev.unlockedSections, section],
      };
    });
  }, []);

  /** Mark a specific dish/drink/topic as learned */
  const markItemLearned = useCallback((section, itemId) => {
    setProgress(prev => {
      const currentSection = prev.learnedItems[section] || [];
      if (currentSection.includes(itemId)) return prev;
      return {
        ...prev,
        learnedItems: {
          ...prev.learnedItems,
          [section]: [...currentSection, itemId]
        }
      };
    });
  }, []);

  /** Mark today's daily portion as done */
  const completeDailyPortion = useCallback(() => {
    setProgress(prev => ({
      ...prev,
      currentDayDone: true,
      lastActivityDate: todayStr(),
    }));
  }, []);

  /** Unlock a section for practice mode */
  const unlockSection = useCallback((sectionKey) => {
    setProgress(prev => {
      if (prev.unlockedSections.includes(sectionKey)) return prev;
      return { ...prev, unlockedSections: [...prev.unlockedSections, sectionKey] };
    });
  }, []);

  /** Unlock a topic (by id) for practice mode */
  const unlockTopic = useCallback((topicId) => {
    setProgress(prev => {
      if (prev.unlockedTopics.includes(topicId)) return prev;
      return { ...prev, unlockedTopics: [...prev.unlockedTopics, topicId] };
    });
  }, []);

  /** Restore 1 life. Pass xpCost=0 for a free restore (e.g. fortune wheel). */
  const restoreLife = useCallback((xpCost = 100) => {
    setProgress(prev => {
      if (prev.lives >= INITIAL_LIVES) return prev;
      if (xpCost > 0 && prev.xp < xpCost) return prev;
      return { ...prev, xp: Math.max(0, prev.xp - xpCost), lives: prev.lives + 1 };
    });
  }, []);

  /** Mark course as completed — unlock all content for practice */
  const completeCourse = useCallback(() => {
    setProgress(prev => ({
      ...prev,
      courseCompleted: true,
      studyMode: 'practice',
      unlockedSections: ['service', 'kitchen', 'bar', 'knowledge', 'upsell'],
    }));
  }, []);

  /** Save fortune wheel result and apply non-XP/life prizes */
  const saveFortuneResult = useCallback((prize) => {
    setProgress(prev => {
      const updates = { fortuneWheelUsed: true, fortunePrize: prize };
      if (prize.type === 'streak') {
        updates.streak = (prev.streak || 0) + prize.value;
      }
      return { ...prev, ...updates };
    });
  }, []);

  /** Toggle study mode between 'study' and 'practice' */
  const toggleStudyMode = useCallback(() => {
    setProgress(prev => ({
      ...prev,
      studyMode: prev.studyMode === 'study' ? 'practice' : 'study',
    }));
  }, []);

  /** Hard reset — clears everything */
  const resetProgress = useCallback(() => {
    const fresh = defaultProgress();
    setProgress(fresh);
    saveProgress(fresh);
  }, []);

  /** DEV ONLY: Skip one day ahead by shifting start date back */
  const skipDay = useCallback(() => {
    setProgress(prev => {
      if (!prev.courseStartDate) return prev;
      const d = new Date(prev.courseStartDate);
      d.setDate(d.getDate() - 1);
      return { ...prev, courseStartDate: d.toISOString().slice(0, 10) };
    });
  }, []);

  // Derived values
  const levelInfo = getLevelInfo(progress.xp);
  const todayPortionIndex = getTodayPortionIndex(progress.courseStartDate);
  const unlockedDays = getUnlockedDayCount(progress.courseStartDate, progress.courseDays);
  const daysRemaining = progress.courseDays
    ? Math.max(0, progress.courseDays - (todayPortionIndex + 1))
    : null;
  const courseProgressPct = progress.courseDays
    ? Math.round((unlockedDays / progress.courseDays) * 100)
    : 0;

  /** Check if specific content is unlocked today */
  const checkContentUnlocked = useCallback((type, id) => {
    if (!progress.onboardingDone) return false;
    if (progress.studyMode === 'practice' || progress.courseCompleted) return true;
    
    return isUnlocked(todayPortionIndex + 1, progress.courseDays, type, id);
  }, [progress.onboardingDone, progress.studyMode, progress.courseCompleted, progress.courseDays, todayPortionIndex]);

  return {
    progress,
    levelInfo,
    todayPortionIndex,
    unlockedDays,
    daysRemaining,
    courseProgressPct,
    checkContentUnlocked,
    // Actions
    completeOnboarding,
    addXP,
    updateMastery,
    markItemLearned,
    completeDailyPortion,
    unlockSection,
    unlockTopic,
    restoreLife,
    completeCourse,
    saveFortuneResult,
    resetProgress,
    skipDay,
    toggleStudyMode,
  };
}
