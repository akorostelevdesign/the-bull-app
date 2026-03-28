import { useState, useEffect, useRef } from 'react';
import { BookOpen, Layers, HelpCircle, Zap, MessageSquare, ChevronLeft, X, Check, Star } from 'lucide-react';
import { KITCHEN_DISHES } from '../data/kitchen-dishes';
import { ORDER_SIMULATIONS } from '../data/learning-content';
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

function pickRandom(arr, n) {
  return shuffle(arr).slice(0, n);
}

function getDistractors(excludeDish, n) {
  const pool = [];
  KITCHEN_DISHES.forEach(d => {
    if (d.name !== excludeDish.name) pool.push(...d.composition);
  });
  const unique = [...new Set(pool)].filter(i => !excludeDish.composition.includes(i));
  return pickRandom(unique, n);
}

function DishDetailImg({ src, alt }) {
  const [err, setErr] = useState(false);
  if (!src || err) {
    return (
      <div style={{
        width: '100%', height: 220, background: 'rgba(255,255,255,0.04)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 64, flexShrink: 0,
      }}>
        🍽️
      </div>
    );
  }
  return <img src={src} alt={alt} className="dish-detail-img" onError={() => setErr(true)} />;
}

// ─── Catalog view ─────────────────────────────────────────────────────────────

function CategoryThumb({ src, emoji = '🍽️' }) {
  const [err, setErr] = useState(false);
  if (!src || err) {
    return <div className="catalog-folder-thumb catalog-folder-thumb-placeholder">{emoji}</div>;
  }
  return <img src={src} alt="" className="catalog-folder-thumb" onError={() => setErr(true)} />;
}

function BrowseCardImg({ src, alt, emoji = '🍽️', height = 110 }) {
  const [err, setErr] = useState(false);
  if (!src || err) {
    return <div className="browse-card-img-placeholder" style={{ height }}>{emoji}</div>;
  }
  return <img src={src} alt={alt} className="browse-card-img" style={{ height }} onError={() => setErr(true)} />;
}

function CatalogView({ dishes, onBack, learnedItems }) {
  const [activeCategory, setActiveCategory] = useState(null);
  const [selected, setSelected] = useState(null);

  // Build category groups with unique items (robust stats)
  const groups = [];
  const seenGroupItems = {};
  const namesSet = new Set();
  const uniqueItems = [];

  dishes.forEach(d => {
    if (!namesSet.has(d.name)) {
      namesSet.add(d.name);
      uniqueItems.push(d);
    }
  });

  uniqueItems.forEach(dish => {
    if (!seenGroupItems[dish.category]) {
      seenGroupItems[dish.category] = [];
      groups.push({ category: dish.category, items: seenGroupItems[dish.category] });
    }
    seenGroupItems[dish.category].push(dish);
  });

  // Level 3: dish detail — modern app-like view
  if (selected) {
    return (
      <div className="dish-detail-page fade-in">
        <div className="dish-detail-img-wrapper">
          <button className="dish-detail-back" onClick={() => setSelected(null)}>
            <ChevronLeft size={26} />
          </button>
          <img src={selected.image || '/placeholder.jpg'} alt={selected.name} className="dish-detail-img-full" />
        </div>

        <div className="dish-detail-content">
          <div className="dish-detail-name-large">{selected.name}</div>
          <div className="dish-detail-cat-pill">{selected.category}</div>

          <div className="detail-section-modern">
            <span className="detail-section-label">Состав блюда</span>
            <div className="detail-comp-grid">
              {selected.composition.map((item, i) => (
                <span key={i} className="detail-comp-pill">{item}</span>
              ))}
            </div>
          </div>

          <div className="detail-section-modern">
            <span className="detail-section-label">Аллергены</span>
            {selected.allergens && selected.allergens.length > 0 ? (
              <div className="dish-allergen-chips">
                {selected.allergens.map((a, i) => (
                  <span key={i} className="dish-allergen-chip">{a}</span>
                ))}
              </div>
            ) : (
              <div className="dish-no-allergens" style={{ color: 'var(--text-secondary)', opacity: 0.6, fontSize: 14 }}>
                Аллергены отсутствуют
              </div>
            )}
          </div>

          {selected.description && (
            <div className="detail-section-modern">
              <span className="detail-section-label">Описание</span>
              <div className="detail-desc-text">{selected.description}</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Level 2: dishes inside category
  if (activeCategory) {
    const group = groups.find(g => g.category === activeCategory);
    return (
      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        <button className="section-back-btn" onClick={() => setActiveCategory(null)}>
          <ChevronLeft size={18} /> К списку категорий
        </button>
        <div className="browse-list">
          {group.items.map((dish, i) => {
            const isLearned = learnedItems.kitchen?.includes(dish.name);
            return (
              <div key={i} className={`browse-card ${isLearned ? 'is-learned' : ''}`} onClick={() => setSelected(dish)}>
                <BrowseCardImg src={dish.image} alt={dish.name} emoji="🍽️" height={130} />
                {isLearned && <div className="learned-badge-mini"><Check size={10} strokeWidth={4} /></div>}
                <div className="browse-card-body">
                  <div className="browse-card-name">{dish.name}</div>
                  <div className="browse-card-comp">
                    {dish.composition.slice(0, 4).join(', ')}{dish.composition.length > 4 ? '...' : ''}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Level 1: category list
  return (
    <div className="catalog-folder-list fade-in">
      <button
        className="section-back-btn"
        onClick={onBack}
        style={{ marginBottom: 16 }}
      >
        <ChevronLeft size={18} /> Назад
      </button>
      {groups.map(group => {
        const firstImg = group.items.find(d => d.image)?.image;
        const learnedInGroup = group.items.filter(d => learnedItems.kitchen?.includes(d.name)).length;
        const totalInGroup = group.items.length;
        const progress = Math.round((learnedInGroup / totalInGroup) * 100);
        
        return (
          <button key={group.category} className="catalog-folder-row" onClick={() => setActiveCategory(group.category)}>
            <CategoryThumb src={firstImg} emoji="🍽️" />
            <div className="catalog-folder-info">
              <span className="catalog-folder-name">{group.category}</span>
              <span className="catalog-folder-sub">{learnedInGroup} / {totalInGroup} · {progress}% изучено</span>
            </div>
            <div className="catalog-folder-progress-mini">
              <div className="catalog-folder-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <ChevronLeft size={20} style={{ transform: 'rotate(180deg)', color: 'rgba(255,255,255,0.2)', flexShrink: 0, marginLeft: 8 }} />
          </button>
        );
      })}
    </div>
  );
}

// ─── Flashcard view ───────────────────────────────────────────────────────────
function FlashcardView({ dishes, onBack, addXP, updateMastery, studyMode, markItemLearned }) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(false);
  const total = dishes.length;
  const dish = dishes[idx];

  function handleFinish() {
    // Mark the last item as well
    markItemLearned('kitchen', dish.name);
    if (studyMode === 'study') addXP(25);
    updateMastery('kitchen', 15);
    setDone(true);
  }

  function goNext() {
    markItemLearned('kitchen', dish.name);
    if (idx < total - 1) {
      setIdx(i => i + 1);
      setFlipped(false);
    } else {
      handleFinish();
    }
  }

  function handleBackAction() {
    markItemLearned('kitchen', dish.name);
    onBack();
  }

  function goPrev() {
    if (idx > 0) {
      setIdx(i => i - 1);
      setFlipped(false);
    }
  }

  if (done) {
    return (
      <div className="learn-result fade-in">
        <div className="learn-result-emoji">🎉</div>
        <div className="learn-result-title">Флэш-карточки пройдены!</div>
        {studyMode === 'study' && <div className="learn-result-xp-badge">+25 XP заработано</div>}
        <button className="learn-btn-primary" style={{ marginTop: 24 }} onClick={onBack}>
          Вернуться в меню
        </button>
      </div>
    );
  }

  return (
    <div className="flashcard-fullscreen fade-in">
      <div className="flash-header-v4">
        <span className="counter-pill-v4">{idx + 1} / {total}</span>
        <span className="hint-pill-v4">Нажми, чтобы перевернуть</span>
      </div>

      <div className="flash-main-container-v4" onClick={() => setFlipped(f => !f)}>
        <div className={`flash-card-v4${flipped ? ' flipped' : ''}`}>
          <div className="flash-inner">
            <div className="flash-side-v4 flash-front-v4">
              <div className="flash-front-title-v4">{dish.name}</div>
              <div className="flash-front-hint-v4">Посмотреть состав</div>
            </div>
            <div className="flash-side-v4 flash-back-v4">
              <img src={dish.image || '/placeholder.jpg'} alt={dish.name} className="flash-back-img-v4" />
              <div className="flash-back-scroll-v4">
                <span className="flash-back-label-v4">Состав</span>
                <div className="flash-comp-tags-v4">
                  {dish.composition.map((item, i) => <span key={i} className="flash-tag-v4">{item}</span>)}
                </div>

                <span className="flash-back-label-v4">Аллергены</span>
                {dish.allergens.length > 0 ? (
                  <div className="allergen-tags">
                    {dish.allergens.map((a, i) => (
                      <span key={i} className="allergen-tag">{a}</span>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-secondary)', fontSize: 13, fontStyle: 'italic' }}>Нет аллергенов</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flash-navigation-modern">
        <button className="f-nav-btn ghost" disabled={idx === 0} onClick={goPrev}>
          ← Назад
        </button>
        {idx < total - 1 ? (
          <button className="f-nav-btn primary" onClick={goNext}>
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

// ─── Quiz view ────────────────────────────────────────────────────────────────

function buildQuizQuestions(allDishes) {
  const questions = [];
  const dishes = shuffle(allDishes);

  // 5 Type A: find the wrong ingredient
  for (let i = 0; i < 5; i++) {
    const dish = dishes[i % dishes.length];
    const correct3 = pickRandom(dish.composition, Math.min(3, dish.composition.length));
    const wrong = getDistractors(dish, 1);
    if (wrong.length === 0) continue;
    const options = shuffle([...correct3, wrong[0]]);
    questions.push({ type: 'A', dish, options, wrongIngredient: wrong[0] });
  }

  // 5 Type B: which sauce is in this dish
  const dishesWithSauce = allDishes.filter(d =>
    d.composition.some(c => c.toLowerCase().includes('соус'))
  );
  const sauceDishes = shuffle(dishesWithSauce).slice(0, 5);
  sauceDishes.forEach(dish => {
    const correctSauce = dish.composition.find(c => c.toLowerCase().includes('соус'));
    if (!correctSauce) return;
    const wrongSauces = [];
    allDishes.forEach(d => {
      if (d.name !== dish.name) {
        d.composition.forEach(c => {
          if (c.toLowerCase().includes('соус') && c !== correctSauce) wrongSauces.push(c);
        });
      }
    });
    const uniqueWrong = [...new Set(wrongSauces)];
    const wrong3 = pickRandom(uniqueWrong, 3);
    if (wrong3.length < 3) return;
    const options = shuffle([correctSauce, ...wrong3]);
    questions.push({ type: 'B', dish, options, correctSauce });
  });

  return shuffle(questions).slice(0, 10);
}

function QuizView({ dishes, onBack, addXP, updateMastery, studyMode }) {
  const [questions] = useState(() => buildQuizQuestions(dishes));
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [totalXP, setTotalXP] = useState(0);
  const [done, setDone] = useState(false);

  const q = questions[qIdx];

  function handleSelect(option) {
    if (selected !== null) return;
    setSelected(option);
    const isCorrect = q.type === 'A' ? option === q.wrongIngredient : option === q.correctSauce;
    if (isCorrect) {
      setScore(s => s + 1);
      if (studyMode === 'study') {
        addXP(10);
        setTotalXP(prev => prev + 10);
      }
    }
  }

  function handleNext() {
    if (qIdx + 1 >= questions.length) {
      updateMastery('kitchen', 25);
      setDone(true);
    } else {
      setQIdx(i => i + 1);
      setSelected(null);
    }
  }

  if (done) {
    return (
      <div className="learn-result fade-in">
        <div className="learn-result-emoji">{score >= 7 ? '🎯' : '📚'}</div>
        <div className="learn-result-title">Квиз завершён!</div>
        <div className="learn-result-score">{score}/{questions.length}</div>
        <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>правильных ответов</div>
        {studyMode === 'study' && totalXP > 0 && (
          <div className="learn-result-xp-badge">+{totalXP} XP заработано</div>
        )}
        <button className="learn-btn-primary" style={{ marginTop: 24 }} onClick={onBack}>
          Вернуться в меню
        </button>
      </div>
    );
  }

  if (!q) return null;

  const isCorrect = selected !== null && (q.type === 'A' ? selected === q.wrongIngredient : selected === q.correctSauce);

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflowY: 'auto' }}>
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>
          <span>Вопрос {qIdx + 1} из {questions.length}</span>
          <span>{score} верных</span>
        </div>
        <div className="learn-quiz-bar">
          <div className="learn-quiz-bar-fill" style={{ width: `${(qIdx / questions.length) * 100}%` }} />
        </div>
      </div>

      <div style={{
        padding: '12px 16px', borderRadius: '16px', marginBottom: '16px', textAlign: 'center',
        background: q.type === 'A' ? 'rgba(244,67,54,0.15)' : 'rgba(245,166,35,0.15)',
        border: `1px solid ${q.type === 'A' ? 'rgba(244,67,54,0.4)' : 'rgba(245,166,35,0.4)'}`,
        color: '#fff', boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', opacity: 0.8, marginBottom: 4, letterSpacing: 0.5 }}>
          {q.type === 'A' ? '🕵️ СУПЕР-ПОИСК' : '👨‍🍳 ТАЙНЫЙ СОСТАВ'}
        </div>
        <div style={{ fontSize: 16, fontWeight: 900, lineHeight: 1.3 }}>
          {q.type === 'A' ? 'Найди ЛИШНИЙ ингредиент:' : 'Какой СОУС в этом блюде?'}
        </div>
      </div>

      <div className="test-question-card" style={{ marginBottom: 20 }}>
        <img src={q.dish.image} alt={q.dish.name} className="test-question-img" />
        <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', marginTop: 10 }}>{q.dish.name}</div>
      </div>

      <div className="test-options">
        {q.options.map((opt, i) => {
          let cls = 'test-opt-btn';
          if (selected !== null) {
            const isThisCorrect = q.type === 'A' ? opt === q.wrongIngredient : opt === q.correctSauce;
            if (opt === selected && isThisCorrect) cls += ' test-opt-correct';
            else if (opt === selected && !isThisCorrect) cls += ' test-opt-wrong';
            else if (isThisCorrect) cls += ' test-opt-correct';
          }
          return (
            <button key={i} className={cls} onClick={() => handleSelect(opt)}>
              {opt}
            </button>
          );
        })}
      </div>

      {selected !== null && (
        <div className="fade-in" style={{ marginTop: 12 }}>
          <div style={{
            padding: '10px 14px', borderRadius: 12, marginBottom: 10,
            background: isCorrect ? 'rgba(76,175,80,0.12)' : 'rgba(244,67,54,0.12)',
            border: `1px solid ${isCorrect ? 'rgba(76,175,80,0.3)' : 'rgba(244,67,54,0.3)'}`,
            color: isCorrect ? '#4CAF50' : '#f44336',
            fontSize: 14, fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            {isCorrect
              ? <><Check size={16} /> Верно! {studyMode === 'study' ? '+10 XP' : ''}</>
              : <><X size={16} /> Неверно. Правильный ответ выделен зелёным</>
            }
          </div>
          <button className="learn-btn-primary" onClick={handleNext}>
            {qIdx + 1 < questions.length ? 'Следующий вопрос →' : 'Завершить ✓'}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Battle view ──────────────────────────────────────────────────────────────

function BattleView({ dishes, onBack, addXP, updateMastery, studyMode }) {
  const [battleDishes] = useState(() => pickRandom(dishes, Math.min(5, dishes.length)));
  const [dishIdx, setDishIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [chips, setChips] = useState([]);
  const [tapped, setTapped] = useState([]);
  const [revealed, setRevealed] = useState(false);
  const [roundXP, setRoundXP] = useState(0);
  const [totalXP, setTotalXP] = useState(0);
  const [done, setDone] = useState(false);
  const intervalRef = useRef(null);

  const dish = battleDishes[dishIdx];

  // Build chips for current dish
  useEffect(() => {
    if (!dish) return;
    const maxIngr = dish.composition.slice(0, 5);
    const distractors = getDistractors(dish, 4); // Limited to 4 distractors
    const merged = [...maxIngr, ...distractors];
    // Sort alphabetically to reduce visual "raznoboy" (mess)
    setChips(merged.sort((a, b) => a.localeCompare(b)));
    setTapped([]);
    setRevealed(false);
    setTimeLeft(15);
  }, [dishIdx]);

  // Timer
  useEffect(() => {
    if (revealed) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(intervalRef.current);
          revealResults(0);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [dishIdx, revealed]);

  function revealResults(tl) {
    clearInterval(intervalRef.current);
    const correctTaps = tapped.filter(c => dish.composition.includes(c)).length;
    const totalCorrect = dish.composition.length;
    const xp = Math.round(15 * (correctTaps / totalCorrect) * ((tl !== undefined ? tl : timeLeft) / 15));
    setRoundXP(xp);
    if (studyMode === 'study' && xp > 0) {
      addXP(xp);
      setTotalXP(prev => prev + xp);
    }
    setRevealed(true);
  }

  function handleReady() {
    revealResults(timeLeft);
  }

  function handleNext() {
    if (dishIdx + 1 >= battleDishes.length) {
      updateMastery('kitchen', 30);
      setDone(true);
    } else {
      setDishIdx(i => i + 1);
    }
  }

  function toggleChip(chip) {
    if (revealed) return;
    setTapped(prev =>
      prev.includes(chip) ? prev.filter(c => c !== chip) : [...prev, chip]
    );
  }

  if (done) {
    return (
      <div className="learn-result fade-in">
        <div className="learn-result-emoji">⚡</div>
        <div className="learn-result-title">Битва завершена!</div>
        {studyMode === 'study' && totalXP > 0 && (
          <div className="learn-result-xp-badge">+{totalXP} XP заработано</div>
        )}
        <button className="learn-btn-primary" style={{ marginTop: 24 }} onClick={onBack}>
          Вернуться в меню
        </button>
      </div>
    );
  }

  const timerPct = (timeLeft / 15) * 100;
  const timerColor = timeLeft > 8 ? '#4CAF50' : timeLeft > 4 ? '#FF9800' : '#f44336';

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
        <span>Блюдо {dishIdx + 1} / {battleDishes.length}</span>
        <span style={{ color: timerColor, fontWeight: 800 }}>{timeLeft}с</span>
      </div>

      <div className="battle-timer-bar">
        <div className="battle-timer-fill" style={{ width: `${timerPct}%`, background: timerColor }} />
      </div>

      <div style={{ textAlign: 'center', marginBottom: 12 }}>
        <img src={dish.image} alt={dish.name}
          style={{ width: '100%', maxHeight: 140, objectFit: 'cover', borderRadius: 14, marginBottom: 8 }} />
        <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-main)' }}>{dish.name}</div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
          Выбери все ингредиенты этого блюда
        </div>
      </div>

      <div className="battle-chips-grid">
        {chips.map((chip, i) => {
          let cls = 'battle-chip';
          if (revealed) {
            const isCorrect = dish.composition.includes(chip);
            const wasTapped = tapped.includes(chip);
            if (isCorrect && wasTapped) cls += ' correct';
            else if (isCorrect && !wasTapped) cls += ' missed';
            else if (!isCorrect && wasTapped) cls += ' wrong';
          } else if (tapped.includes(chip)) {
            cls += ' selected';
          }
          return (
            <button key={i} className={cls} onClick={() => toggleChip(chip)}>
              {chip}
            </button>
          );
        })}
      </div>

      {!revealed ? (
        <button className="learn-btn-primary" onClick={handleReady}>
          Готово
        </button>
      ) : (
        <div className="fade-in">
          <div style={{
            padding: '10px 14px', borderRadius: 12, marginBottom: 10,
            background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.25)',
            color: '#f5a623', fontSize: 14, fontWeight: 700,
          }}>
            {studyMode === 'study' ? `+${roundXP} XP` : `Результат: ${tapped.filter(c => dish.composition.includes(c)).length}/${dish.composition.length}`}
          </div>
          <button className="learn-btn-primary" onClick={handleNext}>
            {dishIdx + 1 < battleDishes.length ? 'Следующее блюдо →' : 'Завершить ✓'}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Simulation view ──────────────────────────────────────────────────────────

function SimulationView({ onBack, addXP, updateMastery, studyMode }) {
  const sims = ORDER_SIMULATIONS.filter(s => s.section === 'kitchen');
  const [simIdx, setSimIdx] = useState(0);
  const [nodeId, setNodeId] = useState('root');
  const [totalXP, setTotalXP] = useState(0);
  const [lastXP, setLastXP] = useState(null);
  const [done, setDone] = useState(false);

  if (sims.length === 0) {
    return (
      <div className="learn-result fade-in">
        <div className="learn-result-emoji">📭</div>
        <div className="learn-result-title">Симуляций пока нет</div>
        <button className="learn-btn-primary" style={{ marginTop: 24 }} onClick={onBack}>
          Назад
        </button>
      </div>
    );
  }

  const sim = sims[simIdx];
  const node = sim.nodes.find(n => n.id === nodeId);

  function handleOption(opt) {
    const earned = opt.xp || 0;
    setLastXP(earned);
    if (studyMode === 'study' && earned > 0) {
      addXP(earned);
      setTotalXP(prev => prev + earned);
    }
    if (opt.next) {
      setNodeId(opt.next);
    }
  }

  function handleContinue() {
    setLastXP(null);
    if (node.options.length === 0) {
      // terminal node
      if (simIdx + 1 < sims.length) {
        setSimIdx(i => i + 1);
        setNodeId('root');
      } else {
        updateMastery('kitchen', 20);
        setDone(true);
      }
    }
  }

  if (done) {
    return (
      <div className="learn-result fade-in">
        <div className="learn-result-emoji">💬</div>
        <div className="learn-result-title">Симуляция завершена!</div>
        {studyMode === 'study' && totalXP > 0 && (
          <div className="learn-result-xp-badge">+{totalXP} XP заработано</div>
        )}
        <button className="learn-btn-primary" style={{ marginTop: 24 }} onClick={onBack}>
          Вернуться в меню
        </button>
      </div>
    );
  }

  const isTerminal = node && node.options.length === 0;

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflowY: 'auto' }}>
      <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, fontWeight: 700 }}>
        {sim.title}
      </div>

      <div className="sim-guest-bubble">{node?.text}</div>

      {lastXP !== null ? (
        <div className="fade-in">
          {lastXP > 0 && (
            <div className="sim-feedback">
              <Star size={14} style={{ marginRight: 6 }} />
              +{lastXP} XP
            </div>
          )}
          <button className="learn-btn-primary" onClick={handleContinue}>
            {isTerminal ? (simIdx + 1 < sims.length ? 'Следующая симуляция →' : 'Завершить ✓') : 'Продолжить →'}
          </button>
        </div>
      ) : (
        <>
          {isTerminal ? (
            <button className="learn-btn-primary" onClick={handleContinue}>
              {simIdx + 1 < sims.length ? 'Следующая симуляция →' : 'Завершить ✓'}
            </button>
          ) : (
            <div className="sim-options">
              {node?.options.map(opt => (
                <button key={opt.id} className="sim-option-btn" onClick={() => handleOption(opt)}>
                  <span>{opt.text}</span>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Main KitchenSection ──────────────────────────────────────────────────────

export default function KitchenSection({ onBack, addXP, updateMastery, studyMode, grade, checkContentUnlocked, markItemLearned, learnedItems }) {
  const [view, setView] = useState('menu');
  const [activeFlashCategory, setActiveFlashCategory] = useState(null);

  const filteredDishesRaw = KITCHEN_DISHES.filter(d => 
    checkContentUnlocked('kitchenCategory', d.category)
  );
  
  const uniqueNames = new Set();
  const filteredDishes = [];
  filteredDishesRaw.forEach(d => {
    if (!uniqueNames.has(d.name)) {
      uniqueNames.add(d.name);
      filteredDishes.push(d);
    }
  });

  const learnedCount = (learnedItems?.kitchen || []).length;
  const totalCount = filteredDishes.length;

  function handleBack() {
    if (view === 'menu') {
      onBack();
    } else if (view === 'flashcard' && activeFlashCategory) {
      setActiveFlashCategory(null);
    } else {
      setView('menu');
      setActiveFlashCategory(null);
    }
  }

  // Flashcard category selector (similar to catalog list)
  function FlashcardCategoryList() {
    // Build category groups with unique items (robust stats)
    const groups = [];
    const seenGroupItems = {};
    const namesSet = new Set();
    const uniqueItemsInMode = [];

    filteredDishes.forEach(d => {
      if (!namesSet.has(d.name)) {
        namesSet.add(d.name);
        uniqueItemsInMode.push(d);
      }
    });

    uniqueItemsInMode.forEach(dish => {
      if (!seenGroupItems[dish.category]) {
        seenGroupItems[dish.category] = [];
        groups.push({ category: dish.category, items: seenGroupItems[dish.category] });
      }
      seenGroupItems[dish.category].push(dish);
    });

    return (
      <div className="catalog-folder-list fade-in">
        <button className="section-back-btn" onClick={handleBack}>
          <ChevronLeft size={16} /> Назад
        </button>
        <div className="section-subtitle-compact" style={{ marginBottom: 12, paddingLeft: 4 }}>Выбери категорию для изучения</div>
        {groups.map(group => {
          const firstImg = group.items.find(d => d.image)?.image;
          const learnedInGroup = group.items.filter(d => learnedItems.kitchen?.includes(d.name)).length;
          const totalInGroup = group.items.length;
          const progress = Math.round((learnedInGroup / totalInGroup) * 100);
          return (
            <button key={group.category} className="catalog-folder-row" onClick={() => setActiveFlashCategory(group.category)}>
              <CategoryThumb src={firstImg} emoji="🍽️" />
              <div className="catalog-folder-info">
                <span className="catalog-folder-name">{group.category}</span>
                <span className="catalog-folder-sub">{learnedInGroup} / {totalInGroup} · {progress}% изучено</span>
              </div>
              <div className="catalog-folder-progress-mini">
                <div className="catalog-folder-progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <ChevronLeft size={20} style={{ transform: 'rotate(180deg)', color: 'rgba(255,255,255,0.2)', flexShrink: 0, marginLeft: 8 }} />
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="learning-page" style={{ padding: '16px', display: 'flex', flexDirection: 'column' }}>
      {/* Main back button: only in menu. sub-views have their own. */}
      {view === 'menu' && (
        <button
          onClick={handleBack}
          className="section-back-btn"
        >
          <ChevronLeft size={16} /> Назад
        </button>
      )}

      {/* Banner — show only in menu view */}
      {view === 'menu' && (
        <div className="mode-cat-banner" style={{ backgroundImage: "url('/Pictures/menu/Прайм/Нью-Йорк.jpg')" }}>
          <div className="mode-cat-banner-overlay" />
          <div className="mode-cat-banner-text">
            <span className="mode-cat-banner-label">Кухня</span>
            <span className="mode-cat-banner-count">Блюда и составы</span>
          </div>
        </div>
      )}

      {/* Mode selection */}
      {view === 'menu' && (
        <div className="mode-list fade-in">
          <button className="mode-card" onClick={() => setView('catalog')}>
            <div className="mode-card-icon mode-icon-browse"><BookOpen size={22} /></div>
            <div className="mode-card-body">
              <div className="mode-card-title">
                Каталог
                <span className="learned-count-chip">{learnedCount}/{totalCount}</span>
              </div>
              <div className="mode-card-desc">Изучи блюда с фото и составами</div>
            </div>
          </button>

          <button className="mode-card" onClick={() => setView('flashcard')}>
            <div className="mode-card-icon mode-icon-flash"><Layers size={22} /></div>
            <div className="mode-card-body">
              <div className="mode-card-title">Флэш-карточки</div>
              <div className="mode-card-desc">Название → состав и аллергены</div>
            </div>
          </button>

          <button className="mode-card" onClick={() => setView('quiz')}>
            <div className="mode-card-icon mode-icon-test"><HelpCircle size={22} /></div>
            <div className="mode-card-body">
              <div className="mode-card-title">Квиз</div>
              <div className="mode-card-desc">Найди ошибку в составе</div>
            </div>
          </button>

          <button className="mode-card" onClick={() => setView('battle')}>
            <div className="mode-card-icon mode-icon-battle"><Zap size={22} /></div>
            <div className="mode-card-body">
              <div className="mode-card-title">Битва за состав</div>
              <div className="mode-card-desc">Назови ингредиенты за 15 секунд</div>
            </div>
          </button>

          <button className="mode-card" onClick={() => setView('simulation')}>
            <div className="mode-card-icon mode-icon-sim"><MessageSquare size={22} /></div>
            <div className="mode-card-body">
              <div className="mode-card-title">Симуляция заказа</div>
              <div className="mode-card-desc">Диалог с гостем</div>
            </div>
          </button>
        </div>
      )}

      {view === 'catalog' && <CatalogView dishes={filteredDishes} onBack={() => setView('menu')} learnedItems={learnedItems} />}
      {view === 'flashcard' && (
        activeFlashCategory ? (
          <FlashcardView 
            dishes={filteredDishes.filter(d => d.category === activeFlashCategory)} 
            onBack={() => setActiveFlashCategory(null)} 
            addXP={addXP} 
            updateMastery={updateMastery} 
            studyMode={studyMode} 
            markItemLearned={markItemLearned} 
          />
        ) : <FlashcardCategoryList />
      )}
      {view === 'quiz' && (
        <QuizView dishes={filteredDishes} onBack={() => setView('menu')} addXP={addXP} updateMastery={updateMastery} studyMode={studyMode} />
      )}
      {view === 'battle' && (
        <BattleView dishes={filteredDishes} onBack={() => setView('menu')} addXP={addXP} updateMastery={updateMastery} studyMode={studyMode} />
      )}
      {view === 'simulation' && (
        <SimulationView onBack={() => setView('menu')} addXP={addXP} updateMastery={updateMastery} studyMode={studyMode} />
      )}
    </div>
  );
}
