import { useState, useRef } from 'react';
import '../styles/Learning.css';

// ─── Sectors ──────────────────────────────────────────────────────────────────
// Probabilities must sum to 1.0
export const WHEEL_SECTORS = [
  { id: 'xp_50',    label: '+50 XP',       emoji: '⚡', color: '#f5a623', prize: { type: 'xp',   value: 50  }, prob: 0.25 },
  { id: 'xp_100',   label: '+100 XP',      emoji: '🔥', color: '#FF9800', prize: { type: 'xp',   value: 100 }, prob: 0.15 },
  { id: 'xp_200',   label: '+200 XP',      emoji: '💎', color: '#9C27B0', prize: { type: 'xp',   value: 200 }, prob: 0.08 },
  { id: 'life',     label: '+1 Жизнь',     emoji: '❤️', color: '#f44336', prize: { type: 'life', value: 1   }, prob: 0.15 },
  { id: 'streak',   label: 'Стрик +3',     emoji: '🌟', color: '#4CAF50', prize: { type: 'streak', value: 3 }, prob: 0.12 },
  { id: 'xp_25',    label: '+25 XP',       emoji: '✨', color: '#2196F3', prize: { type: 'xp',   value: 25  }, prob: 0.25 },
];

// ─── Weighted random pick ─────────────────────────────────────────────────────
function pickSector() {
  const r = Math.random();
  let cumulative = 0;
  for (const s of WHEEL_SECTORS) {
    cumulative += s.prob;
    if (r <= cumulative) return s;
  }
  return WHEEL_SECTORS[WHEEL_SECTORS.length - 1];
}

// ─── SVG Wheel ────────────────────────────────────────────────────────────────
function WheelSVG({ rotation }) {
  const n = WHEEL_SECTORS.length;
  const anglePerSector = 360 / n;
  const cx = 150;
  const cy = 150;
  const r = 140;

  function polarToCartesian(angle, radius) {
    const rad = ((angle - 90) * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad),
    };
  }

  function sectorPath(startAngle, endAngle) {
    const start = polarToCartesian(startAngle, r);
    const end = polarToCartesian(endAngle, r);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
  }

  return (
    <svg
      width="300"
      height="300"
      viewBox="0 0 300 300"
      style={{
        transform: `rotate(${rotation}deg)`,
        transition: 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)',
        display: 'block',
      }}
    >
      {WHEEL_SECTORS.map((sector, i) => {
        const startAngle = i * anglePerSector;
        const endAngle = startAngle + anglePerSector;
        const midAngle = startAngle + anglePerSector / 2;
        const labelPos = polarToCartesian(midAngle, r * 0.65);

        return (
          <g key={sector.id}>
            <path
              d={sectorPath(startAngle, endAngle)}
              fill={sector.color}
              stroke="rgba(0,0,0,0.3)"
              strokeWidth="2"
            />
            {/* Emoji */}
            <text
              x={polarToCartesian(midAngle, r * 0.52).x}
              y={polarToCartesian(midAngle, r * 0.52).y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="20"
              style={{ transform: `rotate(${midAngle}deg)`, transformOrigin: `${cx}px ${cy}px` }}
            >
              {sector.emoji}
            </text>
            {/* Label */}
            <text
              x={labelPos.x}
              y={labelPos.y + 14}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="11"
              fontWeight="800"
              fill="#fff"
              style={{
                textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                paintOrder: 'stroke',
                stroke: 'rgba(0,0,0,0.5)',
                strokeWidth: 3,
              }}
            >
              {sector.label}
            </text>
          </g>
        );
      })}
      {/* Center circle */}
      <circle cx={cx} cy={cy} r={22} fill="#1a1a1a" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize="16">🎯</text>
    </svg>
  );
}

// ─── Main FortuneWheel ────────────────────────────────────────────────────────

export default function FortuneWheel({ onClose, addXP, restoreLife, saveFortuneResult, alreadyUsed, fortunePrize }) {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState(alreadyUsed ? fortunePrize : null);
  const totalRotation = useRef(0);

  function handleSpin() {
    if (spinning || alreadyUsed || result) return;

    const sector = pickSector();
    const n = WHEEL_SECTORS.length;
    const anglePerSector = 360 / n;

    // Find sector index
    const sectorIdx = WHEEL_SECTORS.findIndex(s => s.id === sector.id);
    // We want the pointer (top = 0°) to land on this sector's center
    const sectorCenter = sectorIdx * anglePerSector + anglePerSector / 2;
    // Pointer is at top (0°), wheel rotates clockwise
    // To land sector at top: rotate = 360 - sectorCenter + random full spins
    const fullSpins = 5 + Math.floor(Math.random() * 3); // 5-7 full rotations
    const targetAngle = fullSpins * 360 + (360 - sectorCenter);

    setSpinning(true);
    totalRotation.current += targetAngle;
    setRotation(totalRotation.current);

    setTimeout(() => {
      setSpinning(false);
      setResult(sector.prize);
      saveFortuneResult(sector.prize);

      // Apply prize
      if (sector.prize.type === 'xp') {
        addXP(sector.prize.value);
      } else if (sector.prize.type === 'life') {
        restoreLife(0); // free life from wheel
      }
    }, 4200);
  }

  const prizeLabel = result
    ? result.type === 'xp'
      ? `+${result.value} XP`
      : result.type === 'life'
        ? '+1 Жизнь'
        : `Стрик +${result.value}`
    : null;

  return (
    <div className="fortune-overlay fade-in">
      <div className="fortune-modal">
        <div className="fortune-title">🎡 Колесо Фортуны</div>
        <div className="fortune-subtitle">
          {alreadyUsed
            ? 'Ты уже крутил колесо в этом курсе'
            : 'Поздравляем с завершением курса! Крути колесо!'}
        </div>

        {/* Pointer */}
        <div className="fortune-pointer-wrap">
          <div className="fortune-pointer" />
          <WheelSVG rotation={rotation} />
        </div>

        {result ? (
          <div className="fortune-result fade-in">
            <div className="fortune-result-prize">{prizeLabel}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
              {result.type === 'xp' && 'XP добавлены на твой счёт!'}
              {result.type === 'life' && 'Жизнь восстановлена!'}
              {result.type === 'streak' && 'Стрик увеличен!'}
            </div>
            <button className="learn-btn-primary" onClick={onClose}>
              Закрыть
            </button>
          </div>
        ) : (
          <button
            className="learn-btn-primary"
            style={{ marginTop: 20 }}
            onClick={handleSpin}
            disabled={spinning || alreadyUsed}
          >
            {spinning ? 'Крутится...' : alreadyUsed ? 'Уже использовано' : '🎰 Крутить!'}
          </button>
        )}
      </div>
    </div>
  );
}
