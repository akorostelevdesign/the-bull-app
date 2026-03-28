import React, { useState } from 'react';
import { Gift, Copy, Check } from 'lucide-react';
import '../styles/PromoCodeInput.css';

/**
 * Promo code input and redemption component
 * Allows users to enter and validate promo codes
 */
export default function PromoCodeInput({ onRedeem, onClose }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('info');
  const [copied, setCopied] = useState(false);

  const handleInputChange = (e) => {
    setCode(e.target.value.toUpperCase());
  };

  const handleRedeem = async () => {
    if (!code.trim()) {
      setMessage('Введите промокод');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));

      // Validate code format
      if (!/^BULL-[A-Z0-9]{4}-\d{4}$/.test(code)) {
        setMessage('Неверный формат промокода');
        setMessageType('error');
        setLoading(false);
        return;
      }

      setMessage('✓ Промокод активирован!');
      setMessageType('success');

      setTimeout(() => {
        if (onRedeem) {
          onRedeem(code);
        }
      }, 1500);
    } catch (err) {
      setMessage('Ошибка при активации кода');
      setMessageType('error');
      setLoading(false);
    }
  };

  const handlePasteExample = () => {
    const exampleCode = 'BULL-ABC1-2024';
    setCode(exampleCode);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="promo-code-input">
      {/* Header */}
      <div className="promo-header">
        <div className="promo-icon-wrapper">
          <Gift size={32} className="promo-icon" />
        </div>
        <h2>Активировать промокод</h2>
        <p>Введите промокод для получения скидки или бонуса</p>
      </div>

      {/* Input Section */}
      <div className="promo-input-section">
        <div className="input-wrapper">
          <input
            type="text"
            placeholder="BULL-XXXX-2024"
            value={code}
            onChange={handleInputChange}
            disabled={loading}
            className="promo-input"
            maxLength="14"
          />
          {code && (
            <button
              className="clear-btn"
              onClick={() => setCode('')}
              title="Очистить"
            >
              ✕
            </button>
          )}
        </div>

        {/* Message */}
        {message && (
          <div className={`promo-message ${messageType}`}>
            {message}
          </div>
        )}

        {/* Redeem Button */}
        <button
          className={`redeem-btn ${loading ? 'loading' : ''}`}
          onClick={handleRedeem}
          disabled={loading || !code}
        >
          {loading ? (
            <>
              <span className="spinner"></span>
              Проверка...
            </>
          ) : (
            'Активировать'
          )}
        </button>
      </div>

      {/* Example Section */}
      <div className="promo-example">
        <p className="example-label">Пример формата:</p>
        <div className="example-code">
          <code>BULL-ABC1-2024</code>
          <button
            className="copy-example-btn"
            onClick={handlePasteExample}
            title="Вставить пример"
          >
            Вставить
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="promo-info">
        <h4>💡 Как использовать промокод:</h4>
        <ul>
          <li>Промокоды выдаются при завершении обучения</li>
          <li>Каждый код можно использовать только один раз</li>
          <li>Коды имеют срок действия</li>
          <li>Активированный код применяется к вашей подписке</li>
        </ul>
      </div>

      {/* Close Button */}
      {onClose && (
        <button className="close-btn" onClick={onClose}>
          Закрыть
        </button>
      )}
    </div>
  );
}
