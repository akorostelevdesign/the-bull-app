import React, { useEffect, useState } from 'react';
import { Trophy, Copy, Check } from 'lucide-react';
import '../styles/ModuleResultsScreen.css';

/**
 * Results screen after completing a module
 * Shows score, mistakes, motivational message, and promo code if earned
 */
export default function ModuleResultsScreen({
  module,
  score,
  correct,
  total,
  motivationalMessage,
  promoCode,
  onContinue,
  onRetry,
}) {
  const [copied, setCopied] = useState(false);

  const percentage = Math.round((correct / total) * 100);
  const passed = percentage >= 80;

  const handleCopyPromo = () => {
    navigator.clipboard.writeText(promoCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="results-screen">
      {/* Background Animation */}
      <div className="results-bg-glow"></div>

      {/* Results Container */}
      <div className="results-container">
        {/* Header */}
        <div className={`results-header ${passed ? 'passed' : 'failed'}`}>
          <div className="results-icon">
            {passed ? (
              <Trophy size={48} className="trophy-icon" />
            ) : (
              <span className="retry-icon">🔄</span>
            )}
          </div>
          <h1 className="results-title">
            {passed ? 'Отлично!' : 'Попробуй ещё раз'}
          </h1>
          <p className="results-subtitle">{motivationalMessage}</p>
        </div>

        {/* Score Display */}
        <div className="results-score-section">
          <div className="score-circle">
            <span className="score-percentage">{percentage}%</span>
            <span className="score-label">Результат</span>
          </div>

          <div className="score-details">
            <div className="score-detail-item">
              <span className="detail-label">Правильно</span>
              <span className="detail-value correct">{correct}</span>
            </div>
            <div className="score-detail-item">
              <span className="detail-label">Ошибок</span>
              <span className="detail-value incorrect">{total - correct}</span>
            </div>
            <div className="score-detail-item">
              <span className="detail-label">Всего</span>
              <span className="detail-value">{total}</span>
            </div>
          </div>
        </div>

        {/* Module Info */}
        <div className="results-module-info">
          <div className="module-badge">{module.icon}</div>
          <div>
            <h2 className="module-name">{module.name}</h2>
            <p className="module-desc">{module.description}</p>
          </div>
        </div>

        {/* Promo Code Section (if earned) */}
        {promoCode && passed && (
          <div className="results-promo-section">
            <div className="promo-header">
              <span className="promo-icon">🎁</span>
              <h3>Награда разблокирована!</h3>
            </div>
            <p className="promo-description">
              Ты завершил все модули с результатом 80%+
            </p>
            <div className="promo-code-box">
              <code className="promo-code">{promoCode}</code>
              <button
                className="promo-copy-btn"
                onClick={handleCopyPromo}
                title="Скопировать код"
              >
                {copied ? (
                  <Check size={20} />
                ) : (
                  <Copy size={20} />
                )}
              </button>
            </div>
            <p className="promo-hint">
              {copied ? '✓ Скопировано!' : 'Нажми, чтобы скопировать'}
            </p>
          </div>
        )}

        {/* Feedback Message */}
        <div className={`results-feedback ${passed ? 'success' : 'retry'}`}>
          {passed ? (
            <>
              <p className="feedback-title">Ты готов к работе!</p>
              <p className="feedback-text">
                Используй эти знания в реальных заказах. Помни, что практика
                делает мастера.
              </p>
            </>
          ) : (
            <>
              <p className="feedback-title">Нужно ещё потренироваться</p>
              <p className="feedback-text">
                Не расстраивайся! Повтори этот модуль и достигни 80% для
                получения награды.
              </p>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="results-actions">
          {!passed && (
            <button className="btn-retry" onClick={onRetry}>
              🔄 Повторить модуль
            </button>
          )}
          <button className="btn-continue" onClick={onContinue}>
            {passed ? 'Следующий модуль' : 'Вернуться'}
          </button>
        </div>
      </div>
    </div>
  );
}
