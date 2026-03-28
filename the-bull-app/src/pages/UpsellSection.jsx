import { useState } from 'react';
import { ChevronLeft, Check, X, Star } from 'lucide-react';
import { KITCHEN_DISHES } from '../data/kitchen-dishes';
import './Learning.css';

// ─── Upsell data ──────────────────────────────────────────────────────────────
// For each main dish category, define what can be upsold
const UPSELL_SCENARIOS = [
  {
    id: 'steak_upsell',
    mainDish: { name: 'Рибай', category: 'Прайм стейки', image: '/Pictures/menu/Прайм/Нью-Йорк.jpg' },
    prompt: 'Гость заказал стейк Рибай. Что предложишь дополнительно?',
    correct: ['Картофель фри', 'Соус перечный', 'Брокколи'],
    distractors: ['Медовик', 'Чизкейк баскский', 'Цезарь с курицей'],
    tip: 'К стейку предлагаем гарнир (картофель, брокколи) и соус. Десерт — отдельно, в конце.',
    xp: 30,
  },
  {
    id: 'burger_upsell',
    mainDish: { name: 'Бургер The БЫК', category: 'Бургеры', image: '/Pictures/menu/Бургеры/Бургер-The-БЫК.jpg' },
    prompt: 'Гость заказал Бургер The БЫК. Что предложишь дополнительно?',
    correct: ['Картофель фри', 'Картофель по-деревенски', 'Адреналин Раш'],
    distractors: ['Брокколи', 'Медовик', 'Карпаччо денвер'],
    tip: 'К бургеру — картофель и напиток. Брокколи к бургеру не предлагаем.',
    xp: 25,
  },
  {
    id: 'chicken_upsell',
    mainDish: { name: 'Куриные стрипсы', category: 'Закуски', image: '/Pictures/menu/Закуски/Куриные-стрипсы.jpg' },
    prompt: 'Гость заказал Куриные стрипсы. Что предложишь дополнительно?',
    correct: ['Картофель фри', 'Соус медово-горчичный', 'Evervess Кола'],
    distractors: ['Шоколадный фондан', 'Стейк-салат', 'Картофель по-деревенски'],
    tip: 'К стрипсам — картофель, соус и напиток. Десерт предлагаем отдельно в конце.',
    xp: 25,
  },
  {
    id: 'salad_upsell',
    mainDish: { name: 'Цезарь с курицей', category: 'Салаты', image: '/Pictures/menu/Закуски/Куриные-стрипсы.jpg' },
    prompt: 'Гость заказал Цезарь с курицей. Что предложишь дополнительно?',
    correct: ['Evervess Тоник', 'Чизкейк баскский', 'Хлебная корзина'],
    distractors: ['Картофель фри', 'Брокколи', 'Бургер The БЫК'],
    tip: 'К салату — напиток, хлеб и десерт. Гарниры к салату не предлагаем.',
    xp: 20,
  },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Single round ─────────────────────────────────────────────────────────────

function UpsellRound({ scenario, onNext, addXP, studyMode, isLast }) {
  const [options] = useState(() => shuffle([...scenario.correct, ...scenario.distractors]));
  const [selected, setSelected] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [earnedXP, setEarnedXP] = useState(0);

  function toggle(opt) {
    if (submitted) return;
    setSelected(prev =>
      prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt]
    );
  }

  function handleSubmit() {
    const correctSet = new Set(scenario.correct);
    const correctTaps = selected.filter(o => correctSet.has(o)).length;
    const wrongTaps = selected.filter(o => !correctSet.has(o)).length;
    const score = Math.max(0, correctTaps - wrongTaps);
    const xp = Math.round(scenario.xp * (score / scenario.correct.length));
    if (studyMode === 'study' && xp > 0) addXP(xp);
    setEarnedXP(xp);
    setSubmitted(true);
  }

  const allCorrectSelected = scenario.correct.every(c => selected.includes(c));
  const noWrongSelected = selected.every(s => scenario.correct.includes(s));
  const isPerfect = submitted && allCorrectSelected && noWrongSelected;

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Main dish card */}
      <div className="upsell-main-card">
        <img src={scenario.mainDish.image} alt={scenario.mainDish.name} className="upsell-main-img" />
        <div className="upsell-main-body">
          <div className="upsell-main-name">{scenario.mainDish.name}</div>
          <div className="upsell-main-cat">{scenario.mainDish.category}</div>
        </div>
      </div>

      <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.5 }}>
        {scenario.prompt}
      </div>

      {/* Options grid */}
      <div className="upsell-chips-grid">
        {options.map(opt => {
          let cls = 'battle-chip';
          if (submitted) {
            const isCorrect = scenario.correct.includes(opt);
            const wasTapped = selected.includes(opt);
            if (isCorrect && wasTapped) cls += ' correct';
            else if (isCorrect && !wasTapped) cls += ' missed';
            else if (!isCorrect && wasTapped) cls += ' wrong';
          } else if (selected.includes(opt)) {
            cls += ' selected';
          }
          return (
            <button key={opt} className={cls} onClick={() => toggle(opt)}>
              {opt}
            </button>
          );
        })}
      </div>

      {submitted ? (
        <div className="fade-in" style={{ marginTop: 'auto' }}>
          {/* Tip */}
          <div className="upsell-tip">
            <div style={{ fontSize: 12, fontWeight: 800, color: '#f5a623', marginBottom: 4 }}>
              💡 Совет
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {scenario.tip}
            </div>
          </div>

          {studyMode === 'study' && earnedXP > 0 && (
            <div className="learn-result-xp-badge" style={{ marginBottom: 12 }}>
              <Star size={14} style={{ marginRight: 6 }} />
              +{earnedXP} XP
            </div>
          )}

          <button className="learn-btn-primary" onClick={onNext}>
            {isLast ? 'Завершить ✓' : 'Следующий →'}
          </button>
        </div>
      ) : (
        <button
          className="learn-btn-primary"
          style={{ marginTop: 'auto' }}
          disabled={selected.length === 0}
          onClick={handleSubmit}
        >
          Проверить
        </button>
      )}
    </div>
  );
}

// ─── Main UpsellSection ───────────────────────────────────────────────────────

export default function UpsellSection({ onBack, addXP, updateMastery, studyMode, kitchenMastery }) {
  const [scenarios] = useState(() => shuffle(UPSELL_SCENARIOS));
  const [idx, setIdx] = useState(0);
  const [totalXP, setTotalXP] = useState(0);
  const [done, setDone] = useState(false);

  // 8.1 Unlock check: kitchen mastery must be 100%
  const isUnlocked = kitchenMastery >= 100;

  function handleAddXP(amount) {
    addXP(amount);
    setTotalXP(prev => prev + amount);
  }

  function handleNext() {
    if (idx + 1 >= scenarios.length) {
      updateMastery('upsell', 100);
      setDone(true);
    } else {
      setIdx(i => i + 1);
    }
  }

  if (!isUnlocked) {
    return (
      <div className="learning-page" style={{ padding: '16px', display: 'flex', flexDirection: 'column' }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: 'none', border: 'none',
            color: 'var(--text-secondary)', fontSize: 15, fontWeight: 700,
            cursor: 'pointer', padding: '0 0 12px 0', alignSelf: 'flex-start',
          }}
        >
          <ChevronLeft size={20} />
          Назад
        </button>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 16 }}>
          <div style={{ fontSize: 56 }}>🔒</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-main)' }}>Раздел заблокирован</div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 280 }}>
            Пройди раздел «Кухня» на 100%, чтобы открыть «Допродажи»
          </div>
          <div style={{
            padding: '10px 20px', borderRadius: 14,
            background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.25)',
            color: '#f5a623', fontSize: 14, fontWeight: 700,
          }}>
            Кухня: {kitchenMastery}% / 100%
          </div>
          <button className="learn-btn-primary" style={{ width: 'auto', padding: '12px 32px' }} onClick={onBack}>
            Вернуться
          </button>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="learning-page" style={{ padding: '16px', display: 'flex', flexDirection: 'column' }}>
        <div className="learn-result fade-in">
          <div className="learn-result-emoji">🚂</div>
          <div className="learn-result-title">Паровоз пройден!</div>
          {studyMode === 'study' && totalXP > 0 && (
            <div className="learn-result-xp-badge">+{totalXP} XP заработано</div>
          )}
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.6, textAlign: 'center' }}>
            Ты освоил технику допродаж. Применяй её в работе!
          </div>
          <button className="learn-btn-primary" style={{ marginTop: 24 }} onClick={onBack}>
            Вернуться
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="learning-page" style={{ padding: '16px', display: 'flex', flexDirection: 'column' }}>
      <button
        onClick={onBack}
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          background: 'none', border: 'none',
          color: 'var(--text-secondary)', fontSize: 15, fontWeight: 700,
          cursor: 'pointer', padding: '0 0 12px 0', alignSelf: 'flex-start',
        }}
      >
        <ChevronLeft size={20} />
        Назад
      </button>

      <div className="mode-cat-banner" style={{ backgroundImage: "url('/Pictures/menu/Гарниры/Картофель-фри.jpg')" }}>
        <div className="mode-cat-banner-overlay" />
        <div className="mode-cat-banner-text">
          <span className="mode-cat-banner-label">Допродажи 🚂</span>
          <span className="mode-cat-banner-count">{idx + 1} / {scenarios.length}</span>
        </div>
      </div>

      <UpsellRound
        key={idx}
        scenario={scenarios[idx]}
        onNext={handleNext}
        addXP={handleAddXP}
        studyMode={studyMode}
        isLast={idx + 1 >= scenarios.length}
      />
    </div>
  );
}
