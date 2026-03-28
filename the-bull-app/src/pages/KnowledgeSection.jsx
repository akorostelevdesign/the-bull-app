import { useState, useRef, useEffect } from 'react';
import {
  ChevronLeft, Layers, Sliders, Shuffle, HelpCircle, ListOrdered, BookOpen,
  Star, Check, X, Lock,
} from 'lucide-react';
import {
  KNOWLEDGE_TOPICS, ROASTING_LEVELS, SWIPE_CARDS, LAST_STEPS, LATTE_STEPS,
} from '../data/learning-content';
import './Learning.css';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── 7.2 Roasting Slider ──────────────────────────────────────────────────────

function RoastingSlider({ onBack, addXP, updateMastery, studyMode }) {
  const [idx, setIdx] = useState(2); // Default to Medium Rare
  const [done, setDone] = useState(false);
  const level = ROASTING_LEVELS[idx];

  function handleFinish() {
    if (studyMode === 'study') addXP(20);
    updateMastery('knowledge', 15);
    setDone(true);
  }

  if (done) {
    return (
      <div className="learn-result fade-in">
        <div className="learn-result-emoji">🥩</div>
        <div className="learn-result-title">Прожарки изучены!</div>
        {studyMode === 'study' && <div className="learn-result-xp-badge">+20 XP заработано</div>}
        <button className="learn-btn-primary" style={{ marginTop: 24 }} onClick={onBack}>
          Вернуться к темам
        </button>
      </div>
    );
  }

  return (
    <div className="roast-slider-container fade-in">
      <div className="roast-preview-pane">
        <div className="roast-large-image" style={{ borderColor: level.color }}>
          <img 
            src={level.image} 
            alt={level.name} 
            onError={e => { e.target.style.display = 'none'; }}
          />
          <div className="roast-badge" style={{ backgroundColor: level.color }}>
            {level.temp}
          </div>
        </div>
        <div className="roast-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <h3 style={{ color: level.color, margin: 0, fontSize: 18 }}>{level.name}</h3>
            {level.recommended && (
              <span className="roast-rec-chip">⭐ Рекомендуем</span>
            )}
          </div>
          <p className="roast-description">{level.description}</p>
        </div>
      </div>

      <div className="roast-controls-box" style={{ marginTop: 10 }}>
        <div className="roast-track-modern" style={{ marginBottom: 24 }}>
          {ROASTING_LEVELS.map((l, i) => (
            <div 
              key={l.id} 
              className={`roast-segment-modern ${i === idx ? 'active' : ''}`}
              style={{ '--segment-color': l.color }}
              onClick={() => setIdx(i)}
            />
          ))}
        </div>
        <input 
          type="range" 
          min="0" 
          max={ROASTING_LEVELS.length - 1} 
          value={idx} 
          onChange={(e) => setIdx(parseInt(e.target.value))}
          className="roast-range-modern"
        />
      </div>

      <button className="learn-btn-primary" onClick={handleFinish} style={{ marginTop: 20 }}>
        Я изучил степени прожарки ✓
      </button>
    </div>
  );
}

// ─── 7.3 Swipe Cards (Зерно vs Трава) ────────────────────────────────────────

function SwipeCards({ onBack, addXP, updateMastery, studyMode }) {
  const [cards] = useState(() => shuffle(SWIPE_CARDS));
  const [idx, setIdx] = useState(0);
  const [answered, setAnswered] = useState(null); // 'grain' | 'grass' | null
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const totalXP = useRef(0);

  const card = cards[idx];

  function handleAnswer(choice) {
    if (answered !== null) return;
    const correct = choice === card.answer;
    setAnswered(choice);
    if (correct) {
      const xp = 5;
      if (studyMode === 'study') {
        addXP(xp);
        totalXP.current += xp;
      }
      setScore(s => s + 1);
    }
  }

  function handleNext() {
    setAnswered(null);
    if (idx + 1 >= cards.length) {
      updateMastery('knowledge', 20);
      setDone(true);
    } else {
      setIdx(i => i + 1);
    }
  }

  if (done) {
    return (
      <div className="learn-result fade-in">
        <div className="learn-result-emoji">🌾</div>
        <div className="learn-result-title">Готово!</div>
        <div className="learn-result-score">{score}/{cards.length}</div>
        {studyMode === 'study' && totalXP.current > 0 && (
          <div className="learn-result-xp-badge">+{totalXP.current} XP заработано</div>
        )}
        <button className="learn-btn-primary" style={{ marginTop: 24 }} onClick={onBack}>
          Вернуться к темам
        </button>
      </div>
    );
  }

  const isCorrect = answered !== null && answered === card.answer;
  const isWrong = answered !== null && answered !== card.answer;

  return (
    <div className="fade-in swipe-study-container" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
        <span>Вопрос {idx + 1} / {cards.length}</span>
        <span style={{ color: '#f5a623', fontWeight: 800 }}>✓ {score}</span>
      </div>

      <div className={`swipe-card-modern fade-in ${isCorrect ? 'correct' : isWrong ? 'wrong' : ''}`} key={card.id} style={{ marginBottom: 32, padding: '40px 24px' }}>
        <div className="swipe-card-fact-modern">{card.fact}</div>
        {answered !== null && (
          <div className="swipe-feedback-modern fade-in" style={{ marginTop: 24, paddingTop: 20 }}>
            {isCorrect ? '✓ ' : '✗ '}{card.hint}
          </div>
        )}
      </div>

      {answered === null ? (
        <div className="swipe-btn-row-modern">
          <button
            className="swipe-choice-btn grass"
            onClick={() => handleAnswer('grass')}
          >
            🌿 Травяной
          </button>
          <button
            className="swipe-choice-btn grain"
            onClick={() => handleAnswer('grain')}
          >
            🌽 Зерновой
          </button>
        </div>
      ) : (
        <button className="learn-btn-primary" style={{ marginTop: 'auto', height: 50, borderRadius: 14 }} onClick={handleNext}>
          {idx + 1 < cards.length ? 'Следующая →' : 'Завершить ✓'}
        </button>
      )}
    </div>
  );
}

// ─── 7.4 Quiz «Правда или Миф» ────────────────────────────────────────────────

function TruthOrMythQuiz({ topic, onBack, addXP, updateMastery, studyMode }) {
  const [questions] = useState(() => shuffle(topic.questions));
  const [idx, setIdx] = useState(0);
  const [answered, setAnswered] = useState(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const totalXP = useRef(0);

  const q = questions[idx];

  function handleAnswer(choice) {
    if (answered !== null) return;
    setAnswered(choice);
    const correct = choice === q.isTrue;
    if (correct) {
      const xp = 10;
      if (studyMode === 'study') {
        addXP(xp);
        totalXP.current += xp;
      }
      setScore(s => s + 1);
    }
  }

  function handleNext() {
    setAnswered(null);
    if (idx + 1 >= questions.length) {
      updateMastery('knowledge', 25);
      setDone(true);
    } else {
      setIdx(i => i + 1);
    }
  }

  if (done) {
    return (
      <div className="learn-result fade-in">
        <div className="learn-result-emoji">🧠</div>
        <div className="learn-result-title">Квиз завершён!</div>
        <div className="learn-result-score">{score}/{questions.length}</div>
        {studyMode === 'study' && totalXP.current > 0 && (
          <div className="learn-result-xp-badge">+{totalXP.current} XP заработано</div>
        )}
        <button className="learn-btn-primary" style={{ marginTop: 24 }} onClick={onBack}>
          Вернуться к темам
        </button>
      </div>
    );
  }

  const isCorrect = answered !== null && answered === q.isTrue;

  return (
    <div className="fade-in quiz-study-container" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div className="learn-quiz-bar-modern" style={{ marginBottom: 20 }}>
        <div className="learn-quiz-bar-fill-modern" style={{ width: `${((idx + 1) / questions.length) * 100}%` }} />
      </div>

      <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
        Вопрос {idx + 1} из {questions.length}
      </div>

      <div className="quiz-card-modern" style={{ marginBottom: 24 }}>
        <div className="quiz-card-label">Правда или Миф?</div>
        <div className="quiz-card-text">
          {q.statement}
        </div>
      </div>

      {answered !== null && (
        <div className={`quiz-feedback-box fade-in ${isCorrect ? 'correct' : 'wrong'}`} style={{ marginBottom: 20 }}>
          <div className="feedback-icon-circle">{isCorrect ? <Check size={18} /> : <X size={18} />}</div>
          <div className="feedback-text">{q.explanation}</div>
        </div>
      )}

      {answered === null ? (
        <div className="quiz-btn-row-modern">
          <button className="quiz-choice-btn myth" onClick={() => handleAnswer(false)}>
            <X size={20} /> Миф
          </button>
          <button className="quiz-choice-btn truth" onClick={() => handleAnswer(true)}>
            <Check size={20} /> Правда
          </button>
        </div>
      ) : (
        <button className="learn-btn-primary" style={{ marginTop: 'auto', height: 50, borderRadius: 14 }} onClick={handleNext}>
          {idx + 1 < questions.length ? 'Далее →' : 'Завершить ✓'}
        </button>
      )}
    </div>
  );
}

// ─── 7.5 Sort Steps (LAST / LATTE) ───────────────────────────────────────────

function SortSteps({ onBack, addXP, updateMastery, studyMode }) {
  const [method, setMethod] = useState(null); // 'last' | 'latte'
  const [items, setItems] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [done, setDone] = useState(false);
  const [earned, setEarned] = useState(0);

  function startMethod(m) {
    const source = m === 'last' ? LAST_STEPS : LATTE_STEPS;
    setItems(shuffle(source));
    setMethod(m);
    setSubmitted(false);
  }

  function moveUp(i) {
    if (i === 0) return;
    const next = [...items];
    [next[i - 1], next[i]] = [next[i], next[i - 1]];
    setItems(next);
  }

  function moveDown(i) {
    if (i === items.length - 1) return;
    const next = [...items];
    [next[i], next[i + 1]] = [next[i + 1], next[i]];
    setItems(next);
  }

  function handleSubmit() {
    const correct = items.every((item, i) => item.order === i + 1);
    const xp = correct ? 30 : 10;
    if (studyMode === 'study') {
      addXP(xp);
      setEarned(xp);
    }
    setSubmitted(true);
  }

  function handleFinish() {
    updateMastery('knowledge', 20);
    setDone(true);
  }

  if (done) {
    return (
      <div className="learn-result fade-in">
        <div className="learn-result-emoji">🏆</div>
        <div className="learn-result-title">Кейсы пройдены!</div>
        {studyMode === 'study' && earned > 0 && (
          <div className="learn-result-xp-badge">+{earned} XP заработано</div>
        )}
        <button className="learn-btn-primary" style={{ marginTop: 24 }} onClick={onBack}>
          Вернуться к темам
        </button>
      </div>
    );
  }

  if (!method) {
    return (
      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <p className="topic-instruction">Выбери метод решения конфликтов:</p>
        <button className="method-choice-card" onClick={() => startMethod('last')}>
          <div className="m-card-icon last">LAST</div>
          <div className="m-card-body">
            <div className="m-card-title">Вина ресторана</div>
            <div className="m-card-desc">Ошибка кухни, сервис-тайм, мулос в блюде и т.д.</div>
          </div>
        </button>
        <button className="method-choice-card" onClick={() => startMethod('latte')}>
          <div className="m-card-icon latte">LATTE</div>
          <div className="m-card-body">
            <div className="m-card-title">Не вина ресторана</div>
            <div className="m-card-desc">Просто не понравилось блюдо, задержка по просьбе гостя.</div>
          </div>
        </button>
      </div>
    );
  }

  const isCorrect = submitted && items.every((item, i) => item.order === i + 1);

  return (
    <div className="fade-in sort-container-modern">
      <p className="sort-desc-modern">Расставь шаги <span className="method-highlight">{method.toUpperCase()}</span> в правильном порядке:</p>

      <div className="sort-list-modern">
        {items.map((item, i) => {
          const isItemCorrect = submitted && item.order === i + 1;
          const isItemWrong = submitted && item.order !== i + 1;
          return (
            <div
              key={item.id}
              className={`sort-row-modern ${isItemCorrect ? 'correct' : isItemWrong ? 'wrong' : ''}`}
            >
              <div className="sort-step-index">{i + 1}</div>
              <div className="sort-step-content">
                 <div className="sort-step-main">
                    <span className="step-letter-pill">{item.letter}</span>
                    <span className="step-word-main">{item.word}</span>
                 </div>
                 <div className="step-translation-sub">{item.translation}</div>
              </div>
              {!submitted && (
                <div className="sort-arrows-modern">
                  <button className="sort-move-btn" onClick={() => moveUp(i)} disabled={i === 0}>▲</button>
                  <button className="sort-move-btn" onClick={() => moveDown(i)} disabled={i === items.length - 1}>▼</button>
                </div>
              )}
              {submitted && (
                <div className="sort-check-icon">
                  {isItemCorrect ? <Check size={20} color="#4CAF50" /> : <X size={20} color="#f44336" />}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!submitted ? (
        <button className="learn-btn-primary" style={{ marginTop: 24 }} onClick={handleSubmit}>
          Проверить порядок
        </button>
      ) : (
        <div className="fade-in sort-result-pane">
          <div className={`sort-status-banner ${isCorrect ? 'correct' : 'wrong'}`}>
            {isCorrect
              ? 'Великолепно! Порядок верный.'
              : 'Ошибка. Обрати внимание на правильную последовательность.'
            }
          </div>
          <button className="learn-btn-primary" onClick={handleFinish}>
            Завершить ✓
          </button>
        </div>
      )}
    </div>
  );
}

// ─── 7.6 Flashcard view (generic) ────────────────────────────────────────────

function FlashcardView({ topic, onBack, addXP, updateMastery, studyMode }) {
  const [cards] = useState(() => shuffle(topic.cards));
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(false);

  function handleFinish() {
    if (studyMode === 'study') addXP(20);
    updateMastery('knowledge', 10);
    setDone(true);
  }

  if (done) {
    return (
      <div className="learn-result fade-in">
        <div className="learn-result-emoji">🎉</div>
        <div className="learn-result-title">Карточки пройдены!</div>
        {studyMode === 'study' && <div className="learn-result-xp-badge">+20 XP заработано</div>}
        <button className="learn-btn-primary" style={{ marginTop: 24 }} onClick={onBack}>
          Вернуться к темам
        </button>
      </div>
    );
  }

  const card = cards[idx];

  return (
    <div className="flash-study-container fade-in">
      <div className="flash-study-header">
        <span>Карточка {idx + 1} из {cards.length}</span>
        <span className="flip-hint-modern">Нажми, чтобы развернуть</span>
      </div>

      <div className="flashcard-modern-container" onClick={() => setFlipped(f => !f)}>
        <div className={`flashcard-modern ${flipped ? 'flipped' : ''}`}>
           <div className="flash-front-modern">
              <div className="flash-front-title">{card.front}</div>
              <div className="flash-tap-icon"><Shuffle size={24} /></div>
           </div>
           <div className="flash-back-modern">
              <div className="flash-back-content">
                 <label>Объяснение:</label>
                 <div className="flash-explanation-text">{card.back}</div>
                 
                 {card.example && (
                   <div className="flash-example-box">
                      <label>📌 Пример ситуации:</label>
                      <div className="flash-example-text">{card.example}</div>
                   </div>
                 )}
              </div>
           </div>
        </div>
      </div>

      <div className="flash-navigation-modern">
        <button className="f-nav-btn ghost" disabled={idx === 0}
          onClick={() => { setIdx(i => i - 1); setFlipped(false); }}>
          ← Назад
        </button>
        {idx < cards.length - 1 ? (
          <button className="f-nav-btn primary"
            onClick={() => { setIdx(i => i + 1); setFlipped(false); }}>
            Далее →
          </button>
        ) : (
          <button className="f-nav-btn primary" onClick={handleFinish}>
            Завершить ✓
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Topic detail router ──────────────────────────────────────────────────────

function TopicView({ topic, onBack, addXP, updateMastery, studyMode }) {
  if (topic.type === 'slider') {
    return <RoastingSlider onBack={onBack} addXP={addXP} updateMastery={updateMastery} studyMode={studyMode} />;
  }
  if (topic.type === 'swipe') {
    return <SwipeCards onBack={onBack} addXP={addXP} updateMastery={updateMastery} studyMode={studyMode} />;
  }
  if (topic.type === 'sort') {
    return <SortSteps onBack={onBack} addXP={addXP} updateMastery={updateMastery} studyMode={studyMode} />;
  }
  if (topic.type === 'quiz') {
    return <TruthOrMythQuiz topic={topic} onBack={onBack} addXP={addXP} updateMastery={updateMastery} studyMode={studyMode} />;
  }
  if (topic.type === 'flashcard') {
    return <FlashcardView topic={topic} onBack={onBack} addXP={addXP} updateMastery={updateMastery} studyMode={studyMode} />;
  }
  return null;
}

const TYPE_ICONS = {
  slider: <Sliders size={22} />,
  swipe: <Shuffle size={22} />,
  quiz: <HelpCircle size={22} />,
  sort: <ListOrdered size={22} />,
  flashcard: <Layers size={22} />,
};

const TYPE_ICON_CLASS = {
  slider: 'mode-icon-battle',
  swipe: 'mode-icon-sim',
  quiz: 'mode-icon-test',
  sort: 'mode-icon-flash',
  flashcard: 'mode-icon-browse',
};

const TYPE_LABELS = {
  slider: 'Слайдер',
  swipe: 'Свайп-карточки',
  quiz: 'Квиз',
  sort: 'Расстановка',
  flashcard: 'Флэш-карточки',
};

// ─── Main KnowledgeSection ────────────────────────────────────────────────────

export default function KnowledgeSection({ onBack, addXP, updateMastery, unlockTopic, studyMode, unlockedTopics = [], courseCompleted, checkContentUnlocked }) {
  const [activeTopic, setActiveTopic] = useState(null);
  const isPractice = studyMode === 'practice';

  // Topics shown to the user based on mode
  const visibleTopics = KNOWLEDGE_TOPICS.filter(t => {
    if (isPractice || courseCompleted) return true; // Show all in practice
    return checkContentUnlocked('knowledgeTopic', t.id); // Only unlocked in study
  });

  function isTopicLocked(topicId) {
    if (isPractice || courseCompleted) {
      return !unlockedTopics.includes(topicId);
    }
    return !checkContentUnlocked('knowledgeTopic', topicId);
  }

  function handleTopicClick(topic) {
    if (isTopicLocked(topic.id)) return;
    // Unlock topic when first accessed in study mode
    if (!isPractice && unlockTopic) unlockTopic(topic.id);
    setActiveTopic(topic);
  }

  function handleBack() {
    if (activeTopic) {
      setActiveTopic(null);
    } else {
      onBack();
    }
  }

  return (
    <div className="learning-page" style={{ padding: '16px', display: 'flex', flexDirection: 'column' }}>
      <button
        onClick={handleBack}
        className="section-back-btn"
      >
        <ChevronLeft size={16} /> Назад
      </button>

      {!activeTopic ? (
        <>
          <div className="mode-list fade-in" style={{ overflowY: 'auto', marginTop: 12, paddingBottom: 24 }}>
            {visibleTopics.length === 0 ? (
              <div className="empty-state-card">
                <div className="empty-state-emoji">📚</div>
                <div className="empty-state-text">
                  На сегодня новых тем нет. Загляни попозже или повтори пройденное в режиме <b>Практики</b>.
                </div>
              </div>
            ) : (
              visibleTopics.map(topic => {
                const locked = isTopicLocked(topic.id);
                return (
                  <button
                    key={topic.id}
                    className={`mode-card${locked ? ' mode-card-locked' : ''}`}
                    onClick={() => handleTopicClick(topic)}
                    disabled={locked}
                  >
                    <div className={`mode-card-icon ${locked ? 'mode-icon-locked' : (TYPE_ICON_CLASS[topic.type] || 'mode-icon-browse')}`}>
                      {locked ? <Lock size={22} /> : (TYPE_ICONS[topic.type] || <BookOpen size={22} />)}
                    </div>
                    <div className="mode-card-body">
                      <div className="mode-card-title">{topic.title}</div>
                      <div className="mode-card-desc">{locked ? 'Пройди в режиме «Учусь»' : (TYPE_LABELS[topic.type] || 'Изучить')}</div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </>
      ) : (
        <div className="topic-container fade-in">
          <div className="topic-header">
            <h2 className="topic-title">{activeTopic.title}</h2>
          </div>
          <TopicView
            topic={activeTopic}
            onBack={() => {
              if (!isPractice && unlockTopic) unlockTopic(activeTopic.id);
              setActiveTopic(null);
            }}
            addXP={addXP}
            updateMastery={updateMastery}
            studyMode={studyMode}
          />
        </div>
      )}
    </div>
  );
}
