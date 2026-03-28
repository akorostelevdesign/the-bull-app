import { useNavigate } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { useOrder } from '../contexts/OrderContext';
import { UPSELL_RULES } from '../data/upsell-rules';
import { useUpsellSettings } from '../hooks/useUpsellSettings';
import './CourseSettings.css';

const COURSE_LABELS = {
    0: { label: 'Нулевой курс', sub: 'Напитки' },
    1: { label: 'Первый курс', sub: 'Закуски, хлеб и салаты' },
    2: { label: 'Второй курс', sub: 'Супы' },
    3: { label: 'Третий курс', sub: 'Горячие блюда' },
    4: { label: 'Четвёртый курс', sub: 'Десерты' }
};

const COURSE_TIMING = [
    { num: 0, time: 'Сразу', hint: 'Пробиваем сразу после заказа' },
    { num: 1, time: '5–12 мин', hint: 'Хлеб и холодные закуски: 5–7 мин · Горячие закуски: 8–10 мин · Салаты: 10–12 мин' },
    { num: 2, time: '10–15 мин', hint: 'Отбивать через 10 мин после начала первого курса. Подача через 5–7 мин после закусок' },
    { num: 3, time: '15–25 мин', hint: 'Рыба/паста: 15–20 мин · Стейки: 15–25 мин · Бургеры/пицца: 12–18 мин. Отбивать когда гости приступили к супу' },
    { num: 4, time: '5–15 мин', hint: 'Холодные: 3–5 мин · Фондан: 12–15 мин. Заказывать после полной зачистки стола' }
];

export default function CourseSettings() {
    const navigate = useNavigate();
    const { courseSettings, updateCourseSettings } = useOrder();
    const { settings: upsellSettings, toggle: toggleUpsell } = useUpsellSettings();

    const toggleCourse = (num) => {
        updateCourseSettings({
            courses: { ...courseSettings.courses, [num]: !courseSettings.courses[num] }
        });
    };

    const setMode = (mode) => {
        updateCourseSettings({ mode });
    };

    const setManualType = (manualType) => {
        updateCourseSettings({ manualType });
    };

    const hasManual = courseSettings.mode === 'auto_manual' || courseSettings.mode === 'manual';

    return (
        <div className="page-container course-settings-page">
            <div className="table-header-nav">
                <div className="nav-left">
                    <button className="nav-rect-btn" onClick={() => navigate('/settings')}>
                        <span>Назад</span>
                    </button>
                </div>
                <h1 className="cs-page-title">Курсы блюда</h1>
                <div className="nav-right" />
            </div>

            <div className="cs-section">
                <h2 className="section-title">Режим сортировки</h2>
                <div className="cs-mode-list glass-panel">

                    {/* Автоматическая сортировка */}
                    <div
                        className={`cs-mode-item ${courseSettings.mode === 'auto' ? 'active' : ''}`}
                        onClick={() => setMode('auto')}
                    >
                        <div className="cs-mode-radio">
                            <div className="cs-radio-dot" />
                        </div>
                        <div className="cs-mode-info">
                            <span className="cs-mode-label">Автоматическая сортировка</span>
                            <span className="cs-mode-desc">При нажатии кнопки обновления блюда сортируются по курсам автоматически</span>
                        </div>
                    </div>

                    {/* Автоматическая + ручная */}
                    <div
                        className={`cs-mode-item ${courseSettings.mode === 'auto_manual' ? 'active' : ''}`}
                        onClick={() => setMode('auto_manual')}
                    >
                        <div className="cs-mode-radio">
                            <div className="cs-radio-dot" />
                        </div>
                        <div className="cs-mode-info">
                            <span className="cs-mode-label">Автоматическая + ручная</span>
                            <span className="cs-mode-desc">Автосортировка по кнопке, плюс возможность вручную менять порядок</span>
                        </div>
                    </div>

                    {/* Ручная сортировка */}
                    <div
                        className={`cs-mode-item ${courseSettings.mode === 'manual' ? 'active' : ''}`}
                        onClick={() => setMode('manual')}
                    >
                        <div className="cs-mode-radio">
                            <div className="cs-radio-dot" />
                        </div>
                        <div className="cs-mode-info">
                            <span className="cs-mode-label">Ручная сортировка</span>
                            <span className="cs-mode-desc">Только ручное управление порядком блюд</span>
                        </div>
                    </div>

                    {/* Вложенный выбор типа ручной сортировки */}
                    {hasManual && (
                        <div className="cs-manual-type-section">
                            <span className="cs-manual-type-label">Способ ручной сортировки:</span>
                            <div className="cs-manual-type-options">
                                <div
                                    className={`cs-manual-type-item ${courseSettings.manualType === 'buttons' ? 'active' : ''}`}
                                    onClick={() => setManualType('buttons')}
                                >
                                    <div className="cs-mode-radio">
                                        <div className="cs-radio-dot" />
                                    </div>
                                    <div className="cs-mode-info">
                                        <span className="cs-mode-label">Кнопки ▲▼</span>
                                        <span className="cs-mode-desc">Кнопки вверх/вниз на каждой карточке</span>
                                    </div>
                                </div>
                                <div
                                    className={`cs-manual-type-item ${courseSettings.manualType === 'drag' ? 'active' : ''}`}
                                    onClick={() => setManualType('drag')}
                                >
                                    <div className="cs-mode-radio">
                                        <div className="cs-radio-dot" />
                                    </div>
                                    <div className="cs-mode-info">
                                        <span className="cs-mode-label">Перетаскивание</span>
                                        <span className="cs-mode-desc">Зажми карточку блюда и перетащи в нужное место</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="cs-section">
                <h2 className="section-title">Активные курсы</h2>
                <div className="cs-courses-list glass-panel">
                    {[0, 1, 2, 3, 4].map(num => (
                        <div
                            key={num}
                            className="cs-course-item"
                            onClick={() => toggleCourse(num)}
                        >
                            <div className="cs-course-info">
                                <span className="cs-course-label">{COURSE_LABELS[num].label}</span>
                                <span className="cs-course-sub">{COURSE_LABELS[num].sub}</span>
                            </div>
                            <div className={`toggle-switch ${courseSettings.courses[num] ? 'active' : ''}`}>
                                <div className="toggle-knob" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="cs-section">
                <h2 className="section-title">Тайминг курсов</h2>
                <div className="cs-courses-list glass-panel">
                    {COURSE_TIMING.map(t => (
                        <div key={t.num} className="cs-timing-item">
                            <div className="cs-course-info">
                                <span className="cs-course-label">{COURSE_LABELS[t.num].label}</span>
                                <span className="cs-course-sub">{t.hint}</span>
                            </div>
                            <div className="cs-timing-badge">
                                <Clock size={12} />
                                <span>{t.time}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}
