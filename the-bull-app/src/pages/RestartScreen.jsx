import './Learning.css';

// Shown when lives = 0 OR deadline expired
export default function RestartScreen({ reason, onRestart }) {
  const isExpired = reason === 'expired';

  return (
    <div className="restart-overlay fade-in">
      <div className="restart-modal">
        <div className="restart-emoji">{isExpired ? '⏰' : '💔'}</div>
        <div className="restart-title">
          {isExpired ? 'Время вышло' : 'Жизни закончились'}
        </div>
        <div className="restart-desc">
          {isExpired
            ? 'Дедлайн курса истёк. Прогресс сброшен — начни заново и пройди курс до конца!'
            : 'Ты пропустил слишком много дней и потерял все жизни. Прогресс сброшен — начни заново!'}
        </div>
        <button className="learn-btn-primary restart-btn" onClick={onRestart}>
          🔄 Начать заново
        </button>
      </div>
    </div>
  );
}
