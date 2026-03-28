import React, { useState } from 'react';
import { Check, X, Zap } from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';
import '../styles/Subscription.css';

export default function Subscription() {
  const { subscription, getAllTiers, upgradeTier, daysRemaining, isExpiringSoon } = useSubscription();
  const [selectedTier, setSelectedTier] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const tiers = getAllTiers();

  const handleUpgrade = (tierId) => {
    setSelectedTier(tierId);
    setShowConfirm(true);
  };

  const confirmUpgrade = () => {
    upgradeTier(selectedTier);
    setShowConfirm(false);
    setSelectedTier(null);
  };

  const currentTierIndex = tiers.findIndex(t => t.id === subscription.tier);

  return (
    <div className="subscription-page">
      {/* Header */}
      <div className="subscription-header">
        <h1>Выберите план</h1>
        <p>Разблокируйте полный потенциал приложения</p>

        {/* Current Status */}
        {subscription.active && (
          <div className="current-status">
            <div className="status-badge">
              <span className="status-tier">Текущий план: {tiers[currentTierIndex]?.name}</span>
              {isExpiringSoon && (
                <span className="expiring-soon">⚠️ Истекает через {daysRemaining} дней</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Pricing Cards */}
      <div className="pricing-grid">
        {tiers.map((tier) => {
          const isCurrentTier = tier.id === subscription.tier;
          const isLowerTier = currentTierIndex > tiers.findIndex(t => t.id === tier.id);

          return (
            <div
              key={tier.id}
              className={`pricing-card ${isCurrentTier ? 'current' : ''} ${
                tier.recommended ? 'recommended' : ''
              }`}
              style={{ borderColor: tier.color }}
            >
              {/* Recommended Badge */}
              {tier.recommended && (
                <div className="recommended-badge">
                  <Zap size={16} />
                  Рекомендуется
                </div>
              )}

              {/* Tier Name */}
              <h2 className="tier-name">{tier.name}</h2>

              {/* Price */}
              <div className="price-section">
                <span className="price">{tier.price}</span>
                <span className="currency">{tier.currency}</span>
                <span className="period">/{tier.period}</span>
              </div>

              {/* Features List */}
              <ul className="features-list">
                {tier.features.map((feature, idx) => (
                  <li key={idx} className="feature-item">
                    <Check size={18} className="feature-icon" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Action Button */}
              <button
                className={`tier-button ${isCurrentTier ? 'current-tier' : ''} ${
                  isLowerTier ? 'disabled' : ''
                }`}
                onClick={() => handleUpgrade(tier.id)}
                disabled={isCurrentTier || isLowerTier}
              >
                {isCurrentTier ? '✓ Текущий план' : isLowerTier ? 'Понизить' : 'Выбрать'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Feature Comparison */}
      <div className="feature-comparison">
        <h3>Сравнение функций</h3>
        <div className="comparison-table">
          <div className="comparison-header">
            <div className="feature-name">Функция</div>
            {tiers.map(tier => (
              <div key={tier.id} className="tier-column">
                {tier.name}
              </div>
            ))}
          </div>

          {/* Feature rows */}
          {[
            { name: 'Доступ к меню', basic: true, standard: true, premium: true },
            { name: 'Поиск блюд', basic: true, standard: true, premium: true },
            { name: 'Обучение', basic: false, standard: true, premium: true },
            { name: 'Отслеживание прогресса', basic: false, standard: true, premium: true },
            { name: 'Статистика', basic: false, standard: true, premium: true },
            { name: 'Загрузка материалов', basic: false, standard: false, premium: true },
            { name: 'Приоритетная поддержка', basic: false, standard: false, premium: true },
            { name: 'Персональный коучинг', basic: false, standard: false, premium: true },
          ].map((feature, idx) => (
            <div key={idx} className="comparison-row">
              <div className="feature-name">{feature.name}</div>
              {tiers.map(tier => (
                <div key={tier.id} className="tier-column">
                  {feature[tier.id] ? (
                    <Check size={20} className="check-icon" />
                  ) : (
                    <X size={20} className="x-icon" />
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="subscription-faq">
        <h3>Часто задаваемые вопросы</h3>
        <div className="faq-items">
          <div className="faq-item">
            <h4>Могу ли я изменить план?</h4>
            <p>Да, вы можете обновить или понизить свой план в любое время. Новый тариф вступит в силу немедленно.</p>
          </div>
          <div className="faq-item">
            <h4>Что происходит при истечении подписки?</h4>
            <p>При истечении подписки вы вернётесь на базовый план. Ваши данные и прогресс будут сохранены.</p>
          </div>
          <div className="faq-item">
            <h4>Есть ли пробный период?</h4>
            <p>Да, вы можете использовать базовый план бесплатно. Обновитесь на Standard или Premium для доступа к полным функциям.</p>
          </div>
          <div className="faq-item">
            <h4>Как использовать промокод?</h4>
            <p>Введите промокод при оформлении подписки, чтобы получить скидку или специальные привилегии.</p>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="modal-overlay" onClick={() => setShowConfirm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Подтвердить обновление</h2>
            <p>Вы хотите обновить подписку на план <strong>{tiers.find(t => t.id === selectedTier)?.name}</strong>?</p>
            <p className="price-info">
              Стоимость: <strong>{tiers.find(t => t.id === selectedTier)?.price}₽/месяц</strong>
            </p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowConfirm(false)}>
                Отмена
              </button>
              <button className="btn-confirm" onClick={confirmUpgrade}>
                Подтвердить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
