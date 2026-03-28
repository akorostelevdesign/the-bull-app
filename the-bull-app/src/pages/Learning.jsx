import { useState, useEffect } from "react";
import { Trophy, Flame, Users, Heart, GraduationCap, RefreshCw, Lock } from "lucide-react";
import useProgress from "../hooks/useProgress";
import Onboarding from "./Onboarding";
import ServiceSection from "./ServiceSection";
import KitchenSection from "./KitchenSection";
import BarSection from "./BarSection";
import KnowledgeSection from "./KnowledgeSection";
import UpsellSection from "./UpsellSection";
import FortuneWheel from "./FortuneWheel";
import RestartScreen from "./RestartScreen";
import "./Learning.css";

function CircleProgress({ pct, size = 40, stroke = 3 }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg className="circle-prog" width={size} height={size}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="rgba(255,255,255,0.1)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="#f5a623" strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
        fill="#f5a623" fontSize={size * 0.22} fontWeight="800">
        {pct}%
      </text>
    </svg>
  );
}

const SECTIONS = [
  { key: "service",   label: "Сервис",    bg: "/Pictures/menu/Закуски/Крылья-куриные.jpg" },
  { key: "kitchen",   label: "Кухня",     bg: "/Pictures/menu/Прайм/Нью-Йорк.jpg" },
  { key: "bar",       label: "Бар",       bg: "/Pictures/menu/Напитки/Adrenaline-Rush.jpg" },
  { key: "knowledge", label: "Знания",    bg: "/Pictures/menu/Десерты/Медовик.jpg" },
  { key: "upsell",    label: "Допродажи", bg: "/Pictures/menu/Гарниры/Картофель-фри.jpg" },
];

export default function Learning() {
  const {
    progress, levelInfo, daysRemaining, courseProgressPct, todayPortionIndex,
    completeOnboarding, toggleStudyMode,
    addXP, updateMastery, restoreLife, saveFortuneResult, resetProgress,
    unlockTopic, checkContentUnlocked, skipDay, markItemLearned,
  } = useProgress();

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const [showFortune, setShowFortune] = useState(false);
  const [showRestart, setShowRestart] = useState(false);
  const [levelUpName, setLevelUpName] = useState(null);

  useEffect(() => {
    setShowOnboarding(!progress.onboardingDone);
  }, [progress.onboardingDone]);

  useEffect(() => {
    if (progress.onboardingDone && progress.lives <= 0) {
      setShowRestart(true);
    }
  }, [progress.lives, progress.onboardingDone]);

  useEffect(() => {
    if (progress.courseCompleted && !progress.fortuneWheelUsed) {
      setShowFortune(true);
    }
  }, [progress.courseCompleted, progress.fortuneWheelUsed]);

  if (showOnboarding) {
    return (
      <div className="learning-page" style={{ padding: "16px", overflowY: "auto" }}>
        <Onboarding
          completeOnboarding={completeOnboarding}
          onComplete={() => setShowOnboarding(false)}
        />
      </div>
    );
  }

  if (showRestart) {
    return (
      <RestartScreen
        reason={progress.lives <= 0 ? "lives" : "expired"}
        onRestart={() => { resetProgress(); setShowRestart(false); }}
      />
    );
  }

  const { xp, streak, lives, mastery, studyMode, courseCompleted, unlockedSections } = progress;
  const isPractice = studyMode === "practice";
  const isStudy = studyMode === "study";

  function isSectionLocked(key) {
    if (key === "service") return false;
    if (key === "upsell") return (mastery.kitchen ?? 0) < 100 || (mastery.bar ?? 0) < 100;

    // In practice mode or after course completion, we use the old logic
    if (isPractice || courseCompleted) {
      return !unlockedSections.includes(key);
    }
    
    // In study mode, we check the daily schedule
    return !checkContentUnlocked('section', key);
  }

  function handleCardClick(sec) {
    if (isSectionLocked(sec.key)) return;
    setActiveSection(sec.key);
  }

  function handleXP(amount) {
    const leveled = addXP(amount);
    if (leveled) {
      setLevelUpName(levelInfo.name);
      setTimeout(() => setLevelUpName(null), 2600);
    }
  }

  if (activeSection) {
    const sectionProps = {
      onBack: () => setActiveSection(null),
      addXP: handleXP,
      updateMastery,
      unlockTopic,
      markItemLearned,
      learnedItems: progress.learnedItems,
      studyMode,
      grade: progress.grade,
      unlockedTopics: progress.unlockedTopics,
      courseCompleted,
      checkContentUnlocked,
    };
    if (activeSection === "service")   return <ServiceSection   {...sectionProps} />;
    if (activeSection === "kitchen")   return <KitchenSection   {...sectionProps} />;
    if (activeSection === "bar")       return <BarSection       {...sectionProps} />;
    if (activeSection === "knowledge") return <KnowledgeSection {...sectionProps} />;
    if (activeSection === "upsell")    return <UpsellSection    {...sectionProps} />;
  }

  return (
    <div className="learning-page" style={{ padding: "16px" }}>

      {showFortune && (
        <FortuneWheel
          onClose={() => setShowFortune(false)}
          addXP={handleXP}
          restoreLife={restoreLife}
          saveFortuneResult={saveFortuneResult}
        />
      )}

      <div className="ld-header">
        <div className="ld-header-left">
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <h1 className="ld-title">Изучение</h1>
            <div className="course-day-badge">
              День {todayPortionIndex + 1} из {progress.courseDays}
            </div>
          </div>
          <div className="ld-rank-inline">
            <Trophy size={13} color="#f5a623" />
            <span className="ld-rank-inline-text">{levelInfo.rank}  {levelInfo.name}</span>
          </div>
        </div>
        <div className="ld-header-right">
          <button 
            onClick={skipDay} 
            style={{ 
              fontSize: 10, padding: '2px 6px', background: 'rgba(255,255,255,0.05)', 
              borderRadius: 4, marginRight: 8, color: 'var(--text-secondary)' 
            }}
          >
            Skip Day (Dev)
          </button>
          <div className="ld-streak">
            <Flame size={16} color="#f5a623" />
            {streak}
          </div>
          <button className="ld-team-btn" aria-label="Команда">
            <Users size={16} />
          </button>
        </div>
      </div>

      <button
        className={`ld-mode-toggle${isStudy ? "" : " practice"}`}
        onClick={toggleStudyMode}
      >
        {isStudy
          ? <><GraduationCap size={14} style={{ marginRight: 6 }} />Учусь</>
          : <><RefreshCw size={14} style={{ marginRight: 6 }} />Практикуюсь</>
        }
      </button>

      <div className="ld-xp-bar-wrap">
        <div className="ld-xp-bar">
          <div className="ld-xp-bar-fill" style={{ width: `${levelInfo.pct}%` }} />
        </div>
        <div className="ld-xp-row">
          <span className="ld-mastery-label"><b>{xp}</b> XP</span>
          <span className="ld-xp-label">
            {levelInfo.nextMin ? <>до <b>{levelInfo.nextMin}</b> XP</> : "Макс. уровень"}
          </span>
        </div>
      </div>

      <div className="ld-status-row">
        <div className="ld-status-item">
          <div className="ld-lives">
            {Array.from({ length: 3 }).map((_, i) => (
              <Heart key={i} size={18}
                fill={i < lives ? "#f44336" : "none"}
                color={i < lives ? "#f44336" : "rgba(255,255,255,0.2)"}
                style={{ marginRight: 1 }}
              />
            ))}
          </div>
          <span className="ld-status-label">Жизни</span>
        </div>
        <div className="ld-status-item">
          <span className="ld-status-value">{daysRemaining ?? ""}</span>
          <span className="ld-status-label">Дней осталось</span>
        </div>
        <div className="ld-status-item">
          <span className="ld-status-value">{courseProgressPct}%</span>
          <span className="ld-status-label">Курс пройден</span>
        </div>
      </div>

      <div className="ld-cards">
        {SECTIONS.map(sec => {
          const pct = mastery[sec.key] ?? 0;
          const locked = isSectionLocked(sec.key);
          return (
            <div
              key={sec.key}
              className="ld-card"
              style={{ backgroundImage: `url(${sec.bg})` }}
              onClick={() => handleCardClick(sec)}
            >
              <div className="ld-card-overlay" />
              <div className="ld-card-content">
                <div className="ld-card-top">
                  <span className="ld-card-label">{sec.label}</span>
                  <CircleProgress pct={pct} />
                </div>
                <div className="ld-card-bottom">
                  <span className="ld-card-mastered">{pct}% прогресс</span>
                </div>
              </div>
              {locked && (
                <div className="ld-card-locked">
                  <Lock size={22} color="rgba(255,255,255,0.8)" />
                  <span className="ld-card-locked-text">
                    {sec.key === "upsell" 
                      ? "Освой Кухню и Бар на 100%" 
                      : (isStudy ? "Доступ откроется позже" : "Пройди раздел в режиме Учусь")
                    }
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {levelUpName && (
        <div className="level-up-popup">
          <div className="level-up-title">Новый уровень!</div>
          <div className="level-up-name">{levelUpName}</div>
        </div>
      )}
    </div>
  );
}