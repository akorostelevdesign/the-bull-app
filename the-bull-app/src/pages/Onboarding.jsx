import { useState } from 'react';
import '../styles/Learning.css';

const COURSE_OPTIONS = [
  { value: 7,  title: '7 дней',  desc: 'Быстрый старт — минимальный курс' },
  { value: 14, title: '14 дней', desc: 'Стандарт — оптимальный темп' },
  { value: 30, title: '30 дней', desc: 'Углублённый — без спешки' },
  { value: 45, title: '45 дней', desc: 'Полный курс — максимальное погружение' },
];

const MODE_OPTIONS = [
  { value: 'study',    title: 'Я учусь',       desc: 'Получаю XP, повышаю уровень, прохожу курс впервые' },
  { value: 'practice', title: 'Я практикуюсь', desc: 'Повторяю материал без начисления очков опыта' },
];

const GRADE_OPTIONS = [
  { value: 1, title: 'Грейд 1', desc: 'Составы блюд, аллергены, безалкогольный бар' },
  { value: 2, title: 'Грейд 2', desc: 'Весь контент: алкоголь, маринады, компетенции и методы продаж' },
];

const STEPS = [
  { title: 'Срок курса',    subtitle: 'Выбери, за сколько дней хочешь пройти курс', options: COURSE_OPTIONS },
  { title: 'Режим',         subtitle: 'Как ты хочешь заниматься?',                  options: MODE_OPTIONS  },
  { title: 'Твой грейд',   subtitle: 'Выбери целевой уровень знаний',               options: GRADE_OPTIONS },
];

export default function Onboarding({ completeOnboarding, onComplete }) {
  const [step, setStep]           = useState(0);
  const [courseDays, setCourseDays] = useState(null);
  const [studyMode, setStudyMode]   = useState(null);
  const [grade, setGrade]           = useState(null);

  const selections = [courseDays, studyMode, grade];
  const setters    = [setCourseDays, setStudyMode, setGrade];

  const current    = STEPS[step];
  const selected   = selections[step];
  const isLast     = step === STEPS.length - 1;

  function handleNext() {
    if (selected === null) return;
    if (isLast) {
      completeOnboarding({ courseDays, studyMode, grade });
      onComplete();
    } else {
      setStep(s => s + 1);
    }
  }

  return (
    <div className="onboarding-wrap fade-in">
      <div className="onboarding-step-indicator">Шаг {step + 1} из {STEPS.length}</div>

      <h1 className="onboarding-title">{current.title}</h1>
      <p className="onboarding-subtitle">{current.subtitle}</p>

      <div className="onboarding-options">
        {current.options.map(opt => (
          <button
            key={opt.value}
            className={`onboarding-option${selected === opt.value ? ' selected' : ''}`}
            onClick={() => setters[step](opt.value)}
          >
            <div className="onboarding-option-title">{opt.title}</div>
            <div className="onboarding-option-desc">{opt.desc}</div>
          </button>
        ))}
      </div>

      <button
        className="onboarding-next-btn"
        onClick={handleNext}
        disabled={selected === null}
      >
        {isLast ? 'Начать обучение' : 'Далее'}
      </button>
    </div>
  );
}
