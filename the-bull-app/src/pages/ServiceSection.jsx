import { useState, useRef } from 'react';
import { BookOpen, CheckSquare, Clock, ChevronLeft, Check, X } from 'lucide-react';
import { SERVICE_STEPS, TICKET_TIME_QUESTIONS } from '../data/learning-content';
import '../styles/Learning.css';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Build a shuffled pool for a checklist step: correct actions + 2-3 distractors from other steps */
function buildChecklistPool(stepIndex) {
  const step = SERVICE_STEPS[stepIndex];
  const correct = step.actions;

  // Collect distractors from other steps
  const distractors = [];
  SERVICE_STEPS.forEach((s, i) => {
    if (i !== stepIndex) distractors.push(...s.actions);
  });
  const shuffledDistractors = shuffle(distractors);
  const picked = shuffledDistractors.slice(0, 3);

  return shuffle([
    ...correct.map(a => ({ text: a, isCorrect: true })),
    ...picked.map(a => ({ text: a, isCorrect: false })),
  ]);
}

// ─── Sub-view: Learn (slider) ─────────────────────────────────────────────────

function LearnView({ onBack, addXP, updateMastery, studyMode }) {
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(false);
  const touchStartX = useRef(null);
  const total = SERVICE_STEPS.length;
  const step = SERVICE_STEPS[idx];

  function handleTouchStart(e) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e) {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (delta < -40 && idx < total - 1) setIdx(i => i + 1);
    if (delta > 40 && idx > 0) setIdx(i => i - 1);
  }

  function handleFinish() {
    if (studyMode === 'study') addXP(30);
    updateMastery('service', 20);
    setDone(true);
  }

  if (done) {
    return (
      <div className="learn-result fade-in">
        <div className="learn-result-emoji">🎉</div>
        <div className="learn-result-title">Отлично!</div>
        <div style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 16 }}>
          Ты изучил все 6 шагов сервиса
        </div>
        {studyMode === 'study' && (
          <div className="learn-result-xp-badge">+30 XP заработано</div>
        )}
        <button className="learn-btn-primary" style={{ marginTop: 24 }} onClick={onBack}>
          Вернуться в меню
        </button>
      </div>
    );
  }

  return (
    <div
      className="service-slider fade-in"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="service-slide">
        <div className="service-step-badge">Шаг {idx + 1} / {total}</div>
        <div className="service-step-title">{step.title}</div>
        <div className="service-step-desc">{step.description}</div>
        <div className="service-actions-list">
          {step.actions.map((action, i) => (
            <div key={i} className="service-action-chip">{action}</div>
          ))}
        </div>
      </div>

      <div className="service-dots">
        {SERVICE_STEPS.map((_, i) => (
          <div key={i} className={`service-dot${i === idx ? ' active' : ''}`} />
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <button
          className="learn-btn-ghost"
          style={{ flex: 1 }}
          disabled={idx === 0}
          onClick={() => setIdx(i => i - 1)}
        >
          ← Назад
        </button>
        {idx < total - 1 ? (
          <button
            className="learn-btn-primary"
            style={{ flex: 1, marginBottom: 0 }}
            onClick={() => setIdx(i => i + 1)}
          >
            Далее →
          </button>
        ) : (
          <button
            className="learn-btn-primary"
            style={{ flex: 1, marginBottom: 0 }}
            onClick={handleFinish}
          >
            Завершить ✓
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Sub-view: Checklist ──────────────────────────────────────────────────────

function ChecklistView({ onBack, addXP, updateMastery, studyMode }) {
  const [stepIdx, setStepIdx] = useState(0);
  const [pool, setPool] = useState(() => buildChecklistPool(0));
  const [selected, setSelected] = useState([]);
  const [checked, setChecked] = useState(false);
  const [totalXP, setTotalXP] = useState(0);
  const [done, setDone] = useState(false);

  const step = SERVICE_STEPS[stepIdx];

  function toggleSelect(i) {
    if (checked) return;
    setSelected(prev =>
      prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]
    );
  }

  function handleCheck() {
    setChecked(true);
    const correctCount = pool.filter((item, i) => item.isCorrect && selected.includes(i)).length;
    const wrongCount = pool.filter((item, i) => !item.isCorrect && selected.includes(i)).length;
    const isAllCorrect = correctCount === step.actions.length && wrongCount === 0;
    if (isAllCorrect && studyMode === 'study') {
      addXP(10);
      setTotalXP(prev => prev + 10);
    }
  }

  function handleNext() {
    const nextIdx = stepIdx + 1;
    if (nextIdx >= SERVICE_STEPS.length) {
      updateMastery('service', 40);
      setDone(true);
    } else {
      setStepIdx(nextIdx);
      setPool(buildChecklistPool(nextIdx));
      setSelected([]);
      setChecked(false);
    }
  }

  if (done) {
    return (
      <div className="learn-result fade-in">
        <div className="learn-result-emoji">🏆</div>
        <div className="learn-result-title">Чек-лист пройден!</div>
        {studyMode === 'study' && totalXP > 0 && (
          <div className="learn-result-xp-badge">+{totalXP} XP заработано</div>
        )}
        <button className="learn-btn-primary" style={{ marginTop: 24 }} onClick={onBack}>
          Вернуться в меню
        </button>
      </div>
    );
  }

  const isStepCorrect = checked &&
    pool.filter((item, i) => item.isCorrect && selected.includes(i)).length === step.actions.length &&
    pool.filter((item, i) => !item.isCorrect && selected.includes(i)).length === 0;

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div className="service-step-badge" style={{ marginBottom: 8 }}>
        Шаг {stepIdx + 1} / {SERVICE_STEPS.length}
      </div>
      <div className="service-step-title" style={{ marginBottom: 12 }}>{step.title}</div>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
        Выбери все действия, которые относятся к этому шагу:
      </p>

      <div className="service-actions-list" style={{ flex: 1, overflowY: 'auto' }}>
        {pool.map((item, i) => {
          let cls = 'service-action-chip';
          if (selected.includes(i)) cls += ' selected';
          if (checked) {
            if (item.isCorrect && selected.includes(i)) cls = 'service-action-chip correct';
            else if (!item.isCorrect && selected.includes(i)) cls = 'service-action-chip wrong';
            else if (item.isCorrect && !selected.includes(i)) cls = 'service-action-chip correct';
          }
          return (
            <div key={i} className={cls} onClick={() => toggleSelect(i)}>
              {item.text}
            </div>
          );
        })}
      </div>

      {checked && (
        <div style={{
          marginTop: 12,
          padding: '10px 14px',
          borderRadius: 12,
          background: isStepCorrect ? 'rgba(76,175,80,0.12)' : 'rgba(244,67,54,0.12)',
          border: `1px solid ${isStepCorrect ? 'rgba(76,175,80,0.3)' : 'rgba(244,67,54,0.3)'}`,
          color: isStepCorrect ? '#4CAF50' : '#f44336',
          fontSize: 14,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          {isStepCorrect
            ? <><Check size={16} /> Верно! {studyMode === 'study' ? '+10 XP' : ''}</>
            : <><X size={16} /> Не совсем... Правильные ответы выделены зелёным</>
          }
        </div>
      )}

      <div style={{ marginTop: 12 }}>
        {!checked ? (
          <button className="learn-btn-primary" onClick={handleCheck} disabled={selected.length === 0}>
            Проверить
          </button>
        ) : (
          <button className="learn-btn-primary" onClick={handleNext}>
            {stepIdx < SERVICE_STEPS.length - 1 ? 'Следующий шаг →' : 'Завершить ✓'}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Sub-view: Ticket-time ────────────────────────────────────────────────────

function TicketTimeView({ onBack, addXP, updateMastery, studyMode }) {
  const [qIdx, setQIdx] = useState(0);
  const [answered, setAnswered] = useState(null); // null | true | false (user's answer)
  const [correct, setCorrect] = useState(null);   // null | true | false
  const [score, setScore] = useState(0);
  const [totalXP, setTotalXP] = useState(0);
  const [done, setDone] = useState(false);

  const total = TICKET_TIME_QUESTIONS.length;
  const q = TICKET_TIME_QUESTIONS[qIdx];

  function handleAnswer(userAnswer) {
    const isCorrect = userAnswer === q.answer;
    setAnswered(userAnswer);
    setCorrect(isCorrect);
    if (isCorrect) {
      setScore(s => s + 1);
      if (studyMode === 'study') {
        addXP(15);
        setTotalXP(prev => prev + 15);
      }
    }
  }

  function handleNext() {
    const nextIdx = qIdx + 1;
    if (nextIdx >= total) {
      updateMastery('service', 30);
      setDone(true);
    } else {
      setQIdx(nextIdx);
      setAnswered(null);
      setCorrect(null);
    }
  }

  if (done) {
    return (
      <div className="learn-result fade-in">
        <div className="learn-result-emoji">{score >= total * 0.7 ? '🎯' : '📚'}</div>
        <div className="learn-result-title">Тренажёр завершён!</div>
        <div className="learn-result-score">{score} / {total}</div>
        <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
          правильных ответов
        </div>
        {studyMode === 'study' && totalXP > 0 && (
          <div className="learn-result-xp-badge">+{totalXP} XP заработано</div>
        )}
        <button className="learn-btn-primary" style={{ marginTop: 24 }} onClick={onBack}>
          Завершить
        </button>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Progress bar */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>
          <span>Вопрос {qIdx + 1} из {total}</span>
          <span>{score} верных</span>
        </div>
        <div className="learn-quiz-bar">
          <div className="learn-quiz-bar-fill" style={{ width: `${((qIdx) / total) * 100}%` }} />
        </div>
      </div>

      {/* Question card */}
      <div className="tt-question-card">
        <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)', textAlign: 'center', margin: 0 }}>
          {q.question}
        </p>
      </div>

      {/* Answer buttons */}
      {answered === null && (
        <div className="tt-answer-row">
          <button className="tt-btn-yes" onClick={() => handleAnswer(true)}>
            <Check size={20} /> Да
          </button>
          <button className="tt-btn-no" onClick={() => handleAnswer(false)}>
            <X size={20} /> Нет
          </button>
        </div>
      )}

      {/* Feedback */}
      {answered !== null && (
        <div className="fade-in">
          <div className={correct ? 'tt-result-correct' : 'tt-result-wrong'}>
            {correct
              ? <><Check size={18} /> Правильно! {studyMode === 'study' ? '+15 XP' : ''}</>
              : <><X size={18} /> Неверно. Правильный ответ: {q.answer ? 'Да' : 'Нет'}</>
            }
          </div>
          <div className="tt-explanation">{q.explanation}</div>
          <button className="learn-btn-primary" onClick={handleNext}>
            {qIdx < total - 1 ? 'Следующий вопрос →' : 'Завершить ✓'}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main ServiceSection ──────────────────────────────────────────────────────

export default function ServiceSection({ onBack, addXP, updateMastery, studyMode }) {
  const [view, setView] = useState('menu'); // 'menu' | 'learn' | 'checklist' | 'tickettime'

  function handleBack() {
    if (view === 'menu') {
      onBack();
    } else {
      setView('menu');
    }
  }

  return (
    <div className="learning-page" style={{ padding: '16px', display: 'flex', flexDirection: 'column' }}>
      {/* Back button */}
      <button
        onClick={handleBack}
        className="section-back-btn"
      >
        <ChevronLeft size={16} />
        {view === 'menu' ? 'Назад' : 'К выбору режима'}
      </button>

      {/* Banner */}
      <div className="mode-cat-banner" style={{ backgroundImage: "url('/Pictures/menu/Закуски/Крылья-куриные.jpg')" }}>
        <div className="mode-cat-banner-overlay" />
        <div className="mode-cat-banner-text">
          <span className="mode-cat-banner-label">Сервис</span>
          <span className="mode-cat-banner-count">6 шагов обслуживания</span>
        </div>
      </div>

      {/* Content */}
      {view === 'menu' && (
        <div className="mode-list fade-in">
          <button className="mode-card" onClick={() => setView('learn')}>
            <div className="mode-card-icon mode-icon-browse">
              <BookOpen size={22} />
            </div>
            <div className="mode-card-body">
              <div className="mode-card-title">Изучить</div>
              <div className="mode-card-desc">Изучи 6 шагов сервиса</div>
            </div>
          </button>

          <button className="mode-card" onClick={() => setView('checklist')}>
            <div className="mode-card-icon mode-icon-flash">
              <CheckSquare size={22} />
            </div>
            <div className="mode-card-body">
              <div className="mode-card-title">Чек-лист</div>
              <div className="mode-card-desc">Собери правильный порядок действий</div>
            </div>
          </button>

          <button className="mode-card" onClick={() => setView('tickettime')}>
            <div className="mode-card-icon mode-icon-test">
              <Clock size={22} />
            </div>
            <div className="mode-card-body">
              <div className="mode-card-title">Ticket-time</div>
              <div className="mode-card-desc">Тренажёр стандартов времени</div>
            </div>
          </button>
        </div>
      )}

      {view === 'learn' && (
        <LearnView
          onBack={() => setView('menu')}
          addXP={addXP}
          updateMastery={updateMastery}
          studyMode={studyMode}
        />
      )}

      {view === 'checklist' && (
        <ChecklistView
          onBack={() => setView('menu')}
          addXP={addXP}
          updateMastery={updateMastery}
          studyMode={studyMode}
        />
      )}

      {view === 'tickettime' && (
        <TicketTimeView
          onBack={() => setView('menu')}
          addXP={addXP}
          updateMastery={updateMastery}
          studyMode={studyMode}
        />
      )}
    </div>
  );
}
