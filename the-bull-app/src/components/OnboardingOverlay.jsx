import React, { useEffect, useState } from 'react';
import { ChevronRight, ChevronLeft, X, SkipForward } from 'lucide-react';
import '../styles/OnboardingOverlay.css';

/**
 * Interactive onboarding overlay with step-by-step tutorial
 */
export default function OnboardingOverlay({
  step,
  currentStep,
  totalSteps,
  progress,
  onNext,
  onPrev,
  onSkip,
  onComplete,
}) {
  const [targetRect, setTargetRect] = useState(null);

  useEffect(() => {
    if (step.target) {
      const element = document.querySelector(step.target);
      if (element) {
        const rect = element.getBoundingClientRect();
        setTargetRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });
      }
    }
  }, [step.target]);

  const handleAction = () => {
    if (step.action === 'complete') {
      onComplete();
    } else {
      onNext();
    }
  };

  return (
    <div className="onboarding-overlay">
      {/* Backdrop */}
      <div className="onboarding-backdrop" />

      {/* Spotlight (if targeting an element) */}
      {targetRect && (
        <div
          className="onboarding-spotlight"
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
          }}
        />
      )}

      {/* Tooltip */}
      <div
        className={`onboarding-tooltip ${step.position}`}
        style={
          targetRect && step.position !== 'center'
            ? {
                top:
                  step.position === 'top'
                    ? targetRect.top - 20
                    : targetRect.top + targetRect.height + 20,
                left: Math.max(
                  16,
                  Math.min(
                    window.innerWidth - 320,
                    targetRect.left + targetRect.width / 2 - 160
                  )
                ),
              }
            : {}
        }
      >
        {/* Header */}
        <div className="tooltip-header">
          <h3 className="tooltip-title">{step.title}</h3>
          <button
            className="tooltip-close"
            onClick={onSkip}
            title="Пропустить"
          >
            <X size={20} />
          </button>
        </div>

        {/* Description */}
        <p className="tooltip-description">{step.description}</p>

        {/* Progress Bar */}
        <div className="tooltip-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="progress-text">
            {currentStep + 1} / {totalSteps}
          </span>
        </div>

        {/* Actions */}
        <div className="tooltip-actions">
          <button
            className="btn-prev"
            onClick={onPrev}
            disabled={currentStep === 0}
            title="Предыдущий шаг"
          >
            <ChevronLeft size={18} />
          </button>

          <button
            className="btn-skip"
            onClick={onSkip}
            title="Пропустить обучение"
          >
            <SkipForward size={16} />
            Пропустить
          </button>

          <button
            className="btn-next"
            onClick={handleAction}
            title={step.action === 'complete' ? 'Завершить' : 'Далее'}
          >
            {step.action === 'complete' ? 'Завершить' : 'Далее'}
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
