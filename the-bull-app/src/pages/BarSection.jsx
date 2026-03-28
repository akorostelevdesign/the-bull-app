// v2
import { useState, useEffect, useRef } from 'react';
import { BookOpen, Layers, Zap, MessageSquare, ChevronLeft, X, Check, Star } from 'lucide-react';
import { BAR_DRINKS } from '../data/bar-drinks';
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

function getDistractors(excludeDrink, allDrinks, n) {
  const pool = [];
  allDrinks.forEach(d => {
    if (d.name !== excludeDrink.name) pool.push(...d.composition);
  });
  const unique = [...new Set(pool)].filter(i => !excludeDrink.composition.includes(i));
  return pickRandom(unique, n);
}

// ─── Fallback simulation ──────────────────────────────────────────────────────

const FALLBACK_BAR_SIM = {
  id: 'sim_bar_fallback',
  section: 'bar',
  title: 'Гость выбирает напиток',
  opening: 'Гость: «Что посоветуете из безалкогольного?»',
  nodes: [
    {
      id: 'root',
      text: 'Гость: «Что посоветуете из безалкогольного?»',
      options: [
        { id: 'a', text: '«Рекомендую лимонад Мохито — освежающий, с мятой и лаймом.»', xp: 20, next: 'ask_more' },
        { id: 'b', text: '«У нас есть вода и соки.»', xp: 5, next: 'end_ok' },
        { id: 'c', text: '«Попробуйте наш фирменный лимонад или свежевыжатый сок.»', xp: 15, next: 'ask_more' },
      ],
    },
    {
      id: 'ask_more',
      text: 'Гость: «А что-нибудь с газом есть?»',
      options: [
        { id: 'a', text: '«Конечно! Evervess Кола, Фанта, Спрайт или Тоник.»', xp: 20, next: 'end_great' },
        { id: 'b', text: '«Есть газировка.»', xp: 5, next: 'end_ok' },
      ],
    },
    { id: 'end_great', text: 'Отлично! Гость доволен и сделал заказ.', options: [], xp: 0 },
    { id: 'end_ok', text: 'Неплохо, но можно было дать более конкретную рекомендацию.', options: [], xp: 0 },
  ],
};

// ─── Category thumbnail with fallback ────────────────────────────────────────

function CategoryThumb({ src, emoji = '🍹' }) {
  const [err, setErr] = useState(false);
  if (!src || err) {
    return (
      <div className="catalog-folder-thumb catalog-folder-thumb-placeholder">
        {emoji}
      </div>
    );
  }
  return (
    <img src={src} alt="" className="catalog-folder-thumb" onError={() => setErr(true)} />
  );
}

function DrinkDetailImg({ src, alt }) {
  const [err, setErr] = useState(false);
  if (!src || err) {
    return (
      <div style={{
        width: '100%', height: 220, background: 'rgba(255,255,255,0.04)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 64, flexShrink: 0,
      }}>
        🍹
      </div>
    );
  }
  return <img src={src} alt={alt} className="dish-detail-img" onError={() => setErr(true)} />;
}

// ─── Catalog view ─────────────────────────────────────────────────────────────

function BrowseCardImg({ src, alt, emoji = '🍹', height = 110 }) {
  const [err, setErr] = useState(false);
  if (!src || err) {
    return <div className="browse-card-img-placeholder" style={{ height }}>{emoji}</div>;
  }
  return <img src={src} alt={alt} className="browse-card-img" style={{ height }} onError={() => setErr(true)} />;
}

function CatalogView({ drinks, onBack, learnedItems }) {
  const [activeCategory, setActiveCategory] = useState(null);
  const [selected, setSelected] = useState(null);

  // Build category groups with unique items (robust stats)
  const groups = [];
  const seenGroupItems = {};
  const namesSet = new Set();
  const uniqueItems = [];

  drinks.forEach(d => {
    if (!namesSet.has(d.name)) {
      namesSet.add(d.name);
      uniqueItems.push(d);
    }
  });

  uniqueItems.forEach(drink => {
    if (!seenGroupItems[drink.category]) {
      seenGroupItems[drink.category] = [];
      groups.push({ category: drink.category, items: seenGroupItems[drink.category] });
    }
    seenGroupItems[drink.category].push(drink);
  });

  // Level 3: drink detail — modern view
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
          
          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            <span className="dish-detail-cat-pill">{selected.category}</span>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: selected.isAlcoholic ? 'rgba(244,67,54,0.12)' : 'rgba(76,175,80,0.12)',
              border: `1px solid ${selected.isAlcoholic ? 'rgba(244,67,54,0.3)' : 'rgba(76,175,80,0.3)'}`,
              color: selected.isAlcoholic ? '#f44336' : '#4CAF50',
              fontSize: 12, fontWeight: 800, padding: '4px 14px', borderRadius: 20,
              textTransform: 'uppercase', letterSpacing: 0.5
            }}>
              {selected.isAlcoholic ? '🍷 Алкоголь' : '🥤 Безалкоголь'}
            </span>
          </div>

          <div className="detail-section-modern">
            <span className="detail-section-label">Состав напитка</span>
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
              <div style={{ color: 'var(--text-secondary)', opacity: 0.6, fontSize: 14 }}>Аллергены отсутствуют</div>
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

  // Level 2: drinks inside category
  if (activeCategory) {
    const group = groups.find(g => g.category === activeCategory);
    return (
      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        <button className="section-back-btn" onClick={() => setActiveCategory(null)}>
          <ChevronLeft size={18} /> К списку категорий
        </button>
        <div className="browse-list">
          {group.items.map((drink, i) => {
            const isLearned = learnedItems.bar?.includes(drink.name);
            return (
              <div key={i} className={`browse-card ${isLearned ? 'is-learned' : ''}`} onClick={() => setSelected(drink)}>
                <BrowseCardImg src={drink.image} alt={drink.name} emoji="🍹" height={130} />
                {isLearned && <div className="learned-badge-mini"><Check size={10} strokeWidth={4} /></div>}
                <div className="browse-card-body">
                  <div className="browse-card-name">{drink.name}</div>
                  <div className="browse-card-comp">
                    {drink.composition.slice(0, 4).join(', ')}{drink.composition.length > 4 ? '...' : ''}
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
        const learnedInGroup = group.items.filter(d => learnedItems.bar?.includes(d.name)).length;
        const totalInGroup = group.items.length;
        const progress = Math.round((learnedInGroup / totalInGroup) * 100);
        return (
          <button key={group.category} className="catalog-folder-row" onClick={() => setActiveCategory(group.category)}>
            <CategoryThumb src={group.items.find(d => d.image)?.image} />
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
function FlashcardView({ drinks, onBack, addXP, updateMastery, studyMode, markItemLearned }) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(false);
  const total = drinks.length;
  const drink = drinks[idx];

  function handleFinish() {
    // Mark the last item as well
    markItemLearned('bar', drink.name);
    if (studyMode === 'study') addXP(25);
    updateMastery('bar', 15);
    setDone(true);
  }

  function goNext() {
    markItemLearned('bar', drink.name);
    if (idx < total - 1) {
      setIdx(i => i + 1);
      setFlipped(false);
    } else {
      handleFinish();
    }
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

  if (!drink) return null;

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
              <div className="flash-front-title-v4">{drink.name}</div>
              <div className="flash-front-hint-v4">Посмотреть состав</div>
            </div>
            <div className="flash-side-v4 flash-back-v4">
              <img src={drink.image || '/placeholder.jpg'} alt={drink.name} className="flash-back-img-v4" />
              <div className="flash-back-scroll-v4">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                  <span className="flash-back-label-v4" style={{ margin: 0 }}>Состав</span>
                  <span style={{
                    fontSize: 10, fontWeight: 900, textTransform: 'uppercase',
                    padding: '3px 8px', borderRadius: 8,
                    background: drink.isAlcoholic ? 'rgba(244,67,54,0.15)' : 'rgba(76,175,80,0.15)',
                    color: drink.isAlcoholic ? '#f44336' : '#4CAF50'
                  }}>
                    {drink.isAlcoholic ? '🍷 Алкоголь' : '🥤 Безалкоголь'}
                  </span>
                </div>
                <div className="flash-comp-tags-v4">
                  {drink.composition.map((item, i) => <span key={i} className="flash-tag-v4">{item}</span>)}
                </div>

                <span className="flash-back-label-v4">Аллергены</span>
                {drink.allergens && drink.allergens.length > 0 ? (
                  <div className="allergen-tags">
                    {drink.allergens.map((a, i) => (
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

// ─── Battle view ──────────────────────────────────────────────────────────────

function BattleView({ drinks, onBack, addXP, updateMastery, studyMode }) {
  const [battleDrinks] = useState(() => pickRandom(drinks, Math.min(5, drinks.length)));
  const [drinkIdx, setDrinkIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [chips, setChips] = useState([]);
  const [tapped, setTapped] = useState([]);
  const [revealed, setRevealed] = useState(false);
  const [roundXP, setRoundXP] = useState(0);
  const [totalXP, setTotalXP] = useState(0);
  const [done, setDone] = useState(false);
  const intervalRef = useRef(null);

  const drink = battleDrinks[drinkIdx];

  useEffect(() => {
    if (!drink) return;
    const maxIngr = drink.composition.slice(0, 5);
    const distractors = getDistractors(drink, drinks, 3);
    setChips(shuffle([...maxIngr, ...distractors]));
    setTapped([]);
    setRevealed(false);
    setTimeLeft(15);
  }, [drinkIdx]);

  useEffect(() => {
    if (revealed || !drink) return;
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
  }, [drinkIdx, revealed]);

  function revealResults(tl) {
    clearInterval(intervalRef.current);
    const correctTaps = tapped.filter(c => drink.composition.includes(c)).length;
    const totalCorrect = drink.composition.length;
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
    if (drinkIdx + 1 >= battleDrinks.length) {
      updateMastery('bar', 30);
      setDone(true);
    } else {
      setDrinkIdx(i => i + 1);
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

  if (!drink) return null;

  const timerPct = (timeLeft / 15) * 100;
  const timerColor = timeLeft > 8 ? '#4CAF50' : timeLeft > 4 ? '#FF9800' : '#f44336';

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
        <span>Напиток {drinkIdx + 1} / {battleDrinks.length}</span>
        <span style={{ color: timerColor, fontWeight: 800 }}>{timeLeft}с</span>
      </div>

      <div className="battle-timer-bar">
        <div className="battle-timer-fill" style={{ width: `${timerPct}%`, background: timerColor }} />
      </div>

      <div style={{ textAlign: 'center', marginBottom: 12 }}>
        <img src={drink.image} alt={drink.name}
          style={{ width: '100%', maxHeight: 140, objectFit: 'cover', borderRadius: 14, marginBottom: 8 }} />
        <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-main)' }}>{drink.name}</div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
          Выбери все ингредиенты этого напитка
        </div>
      </div>

      <div className="battle-chips-grid">
        {chips.map((chip, i) => {
          let cls = 'battle-chip';
          if (revealed) {
            const isCorrect = drink.composition.includes(chip);
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
            {studyMode === 'study' ? `+${roundXP} XP` : `Результат: ${tapped.filter(c => drink.composition.includes(c)).length}/${drink.composition.length}`}
          </div>
          <button className="learn-btn-primary" onClick={handleNext}>
            {drinkIdx + 1 < battleDrinks.length ? 'Следующий напиток →' : 'Завершить ✓'}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Simulation view ──────────────────────────────────────────────────────────

function SimulationView({ onBack, addXP, updateMastery, studyMode }) {
  const barSims = ORDER_SIMULATIONS.filter(s => s.section === 'bar');
  const sims = barSims.length > 0 ? barSims : [FALLBACK_BAR_SIM];

  const [simIdx, setSimIdx] = useState(0);
  const [nodeId, setNodeId] = useState('root');
  const [totalXP, setTotalXP] = useState(0);
  const [lastXP, setLastXP] = useState(null);
  const [done, setDone] = useState(false);

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
      if (simIdx + 1 < sims.length) {
        setSimIdx(i => i + 1);
        setNodeId('root');
      } else {
        updateMastery('bar', 20);
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

export default function BarSection({ onBack, addXP, updateMastery, studyMode, grade, checkContentUnlocked, markItemLearned, learnedItems }) {
  const [view, setView] = useState('menu');
  const [activeFlashCategory, setActiveFlashCategory] = useState(null);

  // 1. Filter by grade: grade 1 -> non-alcoholic only; grade 2 -> all
  const gradeFiltered = grade === 1
    ? BAR_DRINKS.filter(d => !d.isAlcoholic)
    : BAR_DRINKS;
  
  // 2. Filter by daily portion schedule + Ensure uniqueness
  const filteredDrinksRaw = gradeFiltered.filter(d => 
    checkContentUnlocked('barCategory', d.category)
  );
  
  const uniqueNames = new Set();
  const filteredDrinks = [];
  filteredDrinksRaw.forEach(d => {
    if (!uniqueNames.has(d.name)) {
      uniqueNames.add(d.name);
      filteredDrinks.push(d);
    }
  });

  const learnedCount = (learnedItems.bar || []).length;
  const totalCount = filteredDrinks.length;

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

  // Flashcard category selector
  function FlashcardCategoryList() {
    const groups = [];
    const seen = {};
    filteredDrinks.forEach(drink => {
      if (!seen[drink.category]) {
        seen[drink.category] = [];
        groups.push({ category: drink.category, items: seen[drink.category] });
      }
      seen[drink.category].push(drink);
    });

    return (
      <div className="catalog-folder-list fade-in">
        <button className="section-back-btn" onClick={handleBack}>
          <ChevronLeft size={16} /> Назад
        </button>
        <div className="section-subtitle-compact" style={{ marginBottom: 12, paddingLeft: 4 }}>Выбери категорию для изучения</div>
        {groups.map(group => {
          const learnedInGroup = group.items.filter(d => learnedItems.bar?.includes(d.name)).length;
          const totalInGroup = group.items.length;
          const progress = Math.round((learnedInGroup / totalInGroup) * 100);
          return (
            <button key={group.category} className="catalog-folder-row" onClick={() => setActiveFlashCategory(group.category)}>
              <CategoryThumb src={group.items.find(d => d.image)?.image} />
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
      {/* Main back button — shown only in menu; sub-views have their own back buttons */}
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
        <div className="mode-cat-banner" style={{ backgroundImage: "url('/Pictures/menu/Напитки/Adrenaline-Rush.jpg')" }}>
          <div className="mode-cat-banner-overlay" />
          <div className="mode-cat-banner-text">
            <span className="mode-cat-banner-label">Напитки и бар</span>
            <span className="mode-cat-banner-count">Напитки и коктейли</span>
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
              <div className="mode-card-desc">Изучи напитки с описанием и происхождением</div>
            </div>
          </button>

          <button className="mode-card" onClick={() => setView('flashcard')}>
            <div className="mode-card-icon mode-icon-flash"><Layers size={22} /></div>
            <div className="mode-card-body">
              <div className="mode-card-title">Флэш-карточки</div>
              <div className="mode-card-desc">Название → состав и происхождение</div>
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

      {view === 'catalog' && <CatalogView drinks={filteredDrinks} onBack={() => setView('menu')} learnedItems={learnedItems} />}
      {view === 'flashcard' && (
        activeFlashCategory ? (
          <FlashcardView
            drinks={filteredDrinks.filter(d => d.category === activeFlashCategory)}
            onBack={() => setActiveFlashCategory(null)}
            addXP={addXP}
            updateMastery={updateMastery}
            studyMode={studyMode}
            markItemLearned={markItemLearned}
          />
        ) : <FlashcardCategoryList />
      )}
      {view === 'battle' && (
        <BattleView
          drinks={filteredDrinks}
          onBack={() => setView('menu')}
          addXP={addXP}
          updateMastery={updateMastery}
          studyMode={studyMode}
        />
      )}
      {view === 'simulation' && (
        <SimulationView
          onBack={() => setView('menu')}
          addXP={addXP}
          updateMastery={updateMastery}
          studyMode={studyMode}
        />
      )}
    </div>
  );
}
