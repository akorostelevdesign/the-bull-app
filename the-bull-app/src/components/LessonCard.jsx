import React, { useState } from 'react';
import { Heart, Volume2, ChevronRight } from 'lucide-react';
import '../styles/LessonCard.css';

/**
 * Story-driven lesson component with:
 * - Interactive scenario questions
 * - Lives system feedback
 * - Realistic restaurant dilemmas
 * - "How to use this" tips
 */
export default function LessonCard({
  lesson,
  lives,
  onAnswer,
  onComplete,
  onBack,
}) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);

  const question = lesson.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / lesson.questions.length) * 100;

  const handleAnswerClick = (option) => {
    if (answered) return;

    const correct = option.isCorrect;
    setSelectedAnswer(option.id);
    setIsCorrect(correct);
    setAnswered(true);

    onAnswer({
      correct,
      questionId: question.id,
      optionId: option.id,
    });
  };

  const handleNext = () => {
    if (currentQuestion < lesson.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setAnswered(false);
      setSelectedAnswer(null);
      setIsCorrect(null);
    } else {
      onComplete({
        lessonId: lesson.id,
        score: lesson.questions.length,
      });
    }
  };

  return (
    <div className="lesson-card">
      {/* Header */}
      <div className="lesson-header">
        <button className="lesson-back-btn" onClick={onBack}>
          ← Назад
        </button>
        <div className="lesson-lives">
          {Array.from({ length: 3 }).map((_, i) => (
            <Heart
              key={i}
              size={20}
              className={i < lives ? 'heart-full' : 'heart-empty'}
            />
          ))}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="lesson-progress-container">
        <div className="lesson-progress-bar">
          <div
            className="lesson-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="lesson-progress-text">
          {currentQuestion + 1} / {lesson.questions.length}
        </span>
      </div>

      {/* Lesson Title */}
      <div className="lesson-title-section">
        <h2 className="lesson-title">{lesson.title}</h2>
        <p className="lesson-description">{lesson.description}</p>
      </div>

      {/* Story Scenario */}
      <div className="lesson-scenario">
        <div className="scenario-icon">{question.scenario.icon}</div>
        <p className="scenario-text">{question.scenario.text}</p>
      </div>

      {/* Question */}
      <div className="lesson-question">
        <h3>{question.question}</h3>
      </div>

      {/* Answer Options */}
      <div className="lesson-options">
        {question.options.map((option) => (
          <button
            key={option.id}
            className={`lesson-option ${
              selectedAnswer === option.id
                ? option.isCorrect
                  ? 'correct'
                  : 'incorrect'
                : ''
            } ${answered ? 'disabled' : ''}`}
            onClick={() => handleAnswerClick(option)}
            disabled={answered}
          >
            <span className="option-text">{option.text}</span>
            {answered && selectedAnswer === option.id && (
              <span className="option-feedback">
                {option.isCorrect ? '✓' : '✗'}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Feedback */}
      {answered && (
        <div className={`lesson-feedback ${isCorrect ? 'success' : 'error'}`}>
          <p className="feedback-title">
            {isCorrect ? '✓ Верно!' : '✗ Неверно'}
          </p>
          <p className="feedback-explanation">{question.explanation}</p>
          {question.tip && (
            <div className="feedback-tip">
              <strong>💡 Как использовать в реальном заказе:</strong>
              <p>{question.tip}</p>
            </div>
          )}
        </div>
      )}

      {/* Next Button */}
      {answered && (
        <button className="lesson-next-btn" onClick={handleNext}>
          {currentQuestion < lesson.questions.length - 1
            ? 'Далее'
            : 'Завершить'}
          <ChevronRight size={20} />
        </button>
      )}
    </div>
  );
}
