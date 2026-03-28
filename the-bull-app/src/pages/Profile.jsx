import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import { useOrder } from '../contexts/OrderContext';
import { User, Calculator, Edit2, TrendingUp, LayoutGrid, ChevronLeft, ChevronRight, Flame, Camera, History, RotateCcw } from 'lucide-react';
import '../styles/Profile.css';

const MONTHS_RU = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

export default function Profile() {
    const { stats, resetMonthStats } = useOrder();
    const navigate = useNavigate();
    const today = new Date();
    const [calendarDate, setCalendarDate] = useState({ year: today.getFullYear(), month: today.getMonth() });
    const [allShifts, setAllShifts] = useState({}); // key = "YYYY-MM-DD", value = 0|1|2

    const [isCalcOpen, setIsCalcOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editForm, setEditForm] = useState({
        firstName: 'Иван',
        lastName: 'Иванов',
        position: 'Официант',
        grade: 2
    });
    const [positionOpen, setPositionOpen] = useState(false);
    const [gradeOpen, setGradeOpen] = useState(false);

    const [profile, setProfile] = useState({
        name: 'Иван Иванов',
        position: 'Официант',
        grade: 2,
        avatar: null
    });

    const avatarInputRef = useRef(null);

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            setProfile(prev => ({ ...prev, avatar: ev.target.result }));
        };
        reader.readAsDataURL(file);
    };

    const handleOpenEdit = () => {
        const parts = profile.name.split(' ');
        setEditForm({
            firstName: parts[0] || '',
            lastName: parts[1] || '',
            position: profile.position,
            grade: profile.grade
        });
        setIsEditModalOpen(true);
    };

    const handleSaveProfile = () => {
        setProfile({
            name: `${editForm.firstName} ${editForm.lastName}`.trim(),
            position: editForm.position,
            grade: editForm.grade
        });
        setIsEditModalOpen(false);
    };

    // Real statistics from context
    const topDishes = Object.entries(stats.dishes || {})
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name, count]) => ({ name, count }));

    const revenue = stats.revenue || 0;
    const grade = profile.grade;

    // Calendar logic
    const { year, month } = calendarDate;
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // Convert Sunday=0 to Monday=0 for Пн-Вс display
    const startOffset = (firstDayOfMonth + 6) % 7;

    const shiftKey = (day) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    const handleShiftClick = (day) => {
        const key = shiftKey(day);
        setAllShifts(prev => ({ ...prev, [key]: ((prev[key] || 0) + 1) % 3 }));
    };

    const getShiftType = (day) => allShifts[shiftKey(day)] || 0;

    const getShiftClass = (type) => {
        if (type === 1) return 'shift-half';
        if (type === 2) return 'shift-full';
        return '';
    };

    const canGoPrev = !(year === today.getFullYear() && month === today.getMonth());
    const canGoNext = !(year === today.getFullYear() && month === today.getMonth() + 1);

    const prevMonth = () => {
        if (!canGoPrev) return;
        setCalendarDate(prev => {
            if (prev.month === 0) return { year: prev.year - 1, month: 11 };
            return { ...prev, month: prev.month - 1 };
        });
    };

    const nextMonth = () => {
        if (!canGoNext) return;
        setCalendarDate(prev => {
            if (prev.month === 11) return { year: prev.year + 1, month: 0 };
            return { ...prev, month: prev.month + 1 };
        });
    };

    // Salary calc from all shifts
    const allShiftEntries = Object.values(allShifts);
    const fullShifts = allShiftEntries.filter(s => s === 2).length;
    const halfShifts = allShiftEntries.filter(s => s === 1).length;
    const fullShiftRate = 1800;
    const halfShiftRate = 900;
    const baseSalary = (fullShifts * fullShiftRate) + (halfShifts * halfShiftRate);
    const revenueBonus = grade === 2 ? revenue * 0.01 : 0;
    const totalSalary = baseSalary + revenueBonus;

    return (
        <div className="page-container">

            {/* Profile Header */}
            <div className="profile-header glass-panel">
                <div className="avatar-glass" onClick={() => avatarInputRef.current.click()}>
                    {profile.avatar
                        ? <img src={profile.avatar} alt="avatar" className="avatar-img" />
                        : <User size={36} style={{ color: 'var(--primary-red)' }} />
                    }
                    <div className="avatar-overlay">
                        <Camera size={16} />
                    </div>
                    <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleAvatarChange}
                    />
                </div>
                <div className="profile-info">
                    <h1>{profile.name}</h1>
                    <p className="text-secondary">{profile.position}</p>
                    <span className="grade-badge">Грейд {profile.grade}</span>
                </div>
                <button className="edit-profile-btn" onClick={handleOpenEdit}>
                    <Edit2 size={16} />
                </button>
            </div>

            {/* Statistics */}
            <div className="stats-section-header">
                <h2 className="section-title" style={{ margin: 0 }}>Статистика за месяц</h2>
                <div className="stats-actions">
                    <button className="stats-action-btn" onClick={() => navigate('/table-history')} title="История столов">
                        <History size={16} />
                    </button>
                    <button className="stats-action-btn" onClick={() => { if (window.confirm('Сбросить статистику за месяц?')) resetMonthStats(); }} title="Сбросить">
                        <RotateCcw size={16} />
                    </button>
                </div>
            </div>
            <div className="stats-row">
                <Card className="stat-card-wide" padding="20px">
                    <TrendingUp size={16} className="stat-icon" style={{ color: 'var(--primary-red)' }} />
                    <span className="stat-label">Выручка</span>
                    <span className="stat-value">{revenue.toLocaleString('ru-RU')} ₽</span>
                </Card>
                <Card className="stat-card-wide" padding="20px">
                    <LayoutGrid size={16} className="stat-icon" style={{ color: 'var(--primary-red)' }} />
                    <span className="stat-label">Столов</span>
                    <span className="stat-value">{stats.tables || 0}</span>
                </Card>
            </div>

            {/* Top 3 Dishes */}
            <Card className="top-dishes-card" padding="20px">
                <div className="top-dishes-header">
                    <Flame size={18} style={{ color: 'var(--primary-red)' }} />
                    <h3>Топ 3 блюда</h3>
                </div>
                {topDishes.length === 0 ? (
                    <p className="text-secondary" style={{ textAlign: 'center', opacity: 0.5, fontSize: '13px', marginTop: '8px' }}>Пока нет данных</p>
                ) : topDishes.map((dish, i) => (
                    <div key={i} className="top-dish-row">
                        <span className="dish-rank">{i + 1}</span>
                        <span className="dish-dish-name">{dish.name}</span>
                        <span className="dish-count">{dish.count} шт</span>
                    </div>
                ))}
            </Card>

            {/* Calendar */}
            <div className="calendar-header-row">
                <h2 className="section-title" style={{ margin: 0 }}>Смены</h2>
                <div className="month-nav">
                    <button className="month-nav-btn" onClick={prevMonth} disabled={!canGoPrev}>
                        <ChevronLeft size={18} />
                    </button>
                    <span className="month-label">{MONTHS_RU[month]} {year}</span>
                    <button className="month-nav-btn" onClick={nextMonth} disabled={!canGoNext}>
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            <Card className="calendar-card" padding="16px">
                <div className="calendar-grid">
                    {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(d => (
                        <div key={d} className="cal-header text-secondary">{d}</div>
                    ))}
                    {Array(startOffset).fill(null).map((_, i) => (
                        <div key={`empty-${i}`} className="cal-day empty" />
                    ))}
                    {Array(daysInMonth).fill(null).map((_, i) => {
                        const day = i + 1;
                        const type = getShiftType(day);
                        return (
                            <div
                                key={day}
                                className={`cal-day ${getShiftClass(type)}`}
                                onClick={() => handleShiftClick(day)}
                            >
                                {day}
                            </div>
                        );
                    })}
                </div>
                <div className="calendar-legend">
                    <div className="legend-item"><span className="dot dot-half"></span>Полсмены</div>
                    <div className="legend-item"><span className="dot dot-full"></span>Полная</div>
                </div>
            </Card>

            <Button fullWidth className="calc-btn" onClick={() => setIsCalcOpen(true)}>
                <Calculator size={18} style={{ marginRight: '8px' }} />
                Расчёт ЗП
            </Button>

            {/* Salary Modal */}
            <Modal isOpen={isCalcOpen} onClose={() => setIsCalcOpen(false)} title="РАСЧЁТ ЗАРПЛАТЫ">
                <div className="receipt-container">
                    <div className="receipt-row text-secondary">
                        <span>Грейд:</span><span>{grade}</span>
                    </div>
                    <div className="receipt-row text-secondary">
                        <span>Смены:</span><span>{fullShifts} полн. + {halfShifts} пол.</span>
                    </div>
                    <div className="receipt-row text-secondary">
                        <span>Выручка:</span><span>{revenue.toLocaleString('ru-RU')} ₽</span>
                    </div>
                    <hr className="receipt-divider" />
                    <div className="receipt-row">
                        <span>{fullShifts} × {fullShiftRate} ₽</span>
                        <span>{fullShifts * fullShiftRate} ₽</span>
                    </div>
                    <div className="receipt-row">
                        <span>{halfShifts} × {halfShiftRate} ₽</span>
                        <span>{halfShifts * halfShiftRate} ₽</span>
                    </div>
                    <div className="receipt-row">
                        <span>1% от выручки</span>
                        <span>{revenueBonus} ₽</span>
                    </div>
                    <hr className="receipt-divider" />
                    <div className="receipt-total">
                        <span>ИТОГО:</span>
                        <span>{totalSalary.toLocaleString('ru-RU')} ₽</span>
                    </div>
                    <Button fullWidth variant="ghost" onClick={() => setIsCalcOpen(false)}>ЗАКРЫТЬ</Button>
                </div>
            </Modal>

            {/* Edit Profile Modal */}
            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Редактировать профиль">
                <div className="edit-profile-form">
                    <label className="form-label">Имя</label>
                    <Input
                        value={editForm.firstName}
                        onChange={e => setEditForm({ ...editForm, firstName: e.target.value })}
                        placeholder="Имя"
                    />
                    <label className="form-label">Фамилия</label>
                    <Input
                        value={editForm.lastName}
                        onChange={e => setEditForm({ ...editForm, lastName: e.target.value })}
                        placeholder="Фамилия"
                    />
                    <label className="form-label">Должность</label>
                    <div className="custom-select" onClick={() => { setPositionOpen(p => !p); setGradeOpen(false); }}>
                        <span>{editForm.position}</span>
                        <span className="select-arrow">▾</span>
                        {positionOpen && (
                            <div className="select-dropdown">
                                {['Официант', 'Менеджер'].map(opt => (
                                    <div
                                        key={opt}
                                        className={`select-option ${editForm.position === opt ? 'selected' : ''}`}
                                        onClick={e => { e.stopPropagation(); setEditForm({ ...editForm, position: opt }); setPositionOpen(false); }}
                                    >
                                        {opt}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <label className="form-label">Грейд</label>
                    <div className="custom-select" onClick={() => { setGradeOpen(p => !p); setPositionOpen(false); }}>
                        <span>Грейд {editForm.grade}</span>
                        <span className="select-arrow">▾</span>
                        {gradeOpen && (
                            <div className="select-dropdown">
                                {[0, 1, 2, 3].map(g => (
                                    <div
                                        key={g}
                                        className={`select-option ${editForm.grade === g ? 'selected' : ''}`}
                                        onClick={e => { e.stopPropagation(); setEditForm({ ...editForm, grade: g }); setGradeOpen(false); }}
                                    >
                                        <span>Грейд {g}</span>
                                        <span className="grade-hint">
                                            {g === 0 && '1800 ₽/смена'}
                                            {g === 1 && '1800 ₽ + 1%'}
                                            {g === 2 && '2300 ₽ + 1%'}
                                            {g === 3 && '2300 ₽ + 2%'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <Button fullWidth style={{ marginTop: '16px' }} onClick={handleSaveProfile}>Сохранить</Button>
                </div>
            </Modal>
        </div>
    );
}
