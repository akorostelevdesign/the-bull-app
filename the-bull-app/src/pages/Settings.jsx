import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Moon, Globe, Shield, LogOut, ChevronRight, Info, Utensils, TrendingUp, CreditCard, HelpCircle } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import '../styles/Settings.css';

const iconStyle = { color: 'var(--text-main)' };

export default function Settings() {
    const navigate = useNavigate();
    const [settings, setSettings] = useState(() => {
        const savedDark = localStorage.getItem('darkMode');
        const darkMode = savedDark === null ? true : savedDark === 'true';
        return {
            notifications: true,
            darkMode,
            language: 'ru',
            autoSync: true
        };
    });

    useEffect(() => {
        if (settings.darkMode) {
            document.body.classList.remove('light');
        } else {
            document.body.classList.add('light');
        }
        localStorage.setItem('darkMode', settings.darkMode);
    }, [settings.darkMode]);

    const toggleSetting = (key) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="page-container settings-page">
            <h1 className="page-title mb-6">Настройки</h1>

            <div className="settings-section">
                <h2 className="section-title">Управление меню</h2>
                <div className="settings-list glass-panel">
                    <div className="setting-item" onClick={() => navigate('/course-settings')}>
                        <div className="setting-icon-container">
                            <Utensils size={20} style={iconStyle} />
                        </div>
                        <div className="setting-info">
                            <span className="setting-label">Курсы блюда</span>
                            <span className="setting-desc">Автоматическая и ручная настройка</span>
                        </div>
                        <ChevronRight size={18} className="text-secondary" />
                    </div>
                    <div className="setting-item" onClick={() => navigate('/upsell-settings')}>
                        <div className="setting-icon-container">
                            <TrendingUp size={20} style={iconStyle} />
                        </div>
                        <div className="setting-info">
                            <span className="setting-label">Доп. продажи</span>
                            <span className="setting-desc">Управление upsell предложениями</span>
                        </div>
                        <ChevronRight size={18} className="text-secondary" />
                    </div>
                </div>
            </div>

            <div className="settings-section">
                <h2 className="section-title">Приложение</h2>
                <div className="settings-list glass-panel">
                    <div className="setting-item" onClick={() => navigate('/subscription')}>
                        <div className="setting-icon-container">
                            <CreditCard size={20} style={iconStyle} />
                        </div>
                        <div className="setting-info">
                            <span className="setting-label">Подписка</span>
                            <span className="setting-desc">Управление тарифом и функциями</span>
                        </div>
                        <ChevronRight size={18} className="text-secondary" />
                    </div>
                    <div className="setting-item" onClick={() => toggleSetting('notifications')}>
                        <div className="setting-icon-container">
                            <Bell size={20} style={iconStyle} />
                        </div>
                        <div className="setting-info">
                            <span className="setting-label">Уведомления</span>
                            <span className="setting-desc">{settings.notifications ? 'Включены' : 'Выключены'}</span>
                        </div>
                        <div className={`toggle-switch ${settings.notifications ? 'active' : ''}`}>
                            <div className="toggle-knob"></div>
                        </div>
                    </div>
                    <div className="setting-item" onClick={() => toggleSetting('darkMode')}>
                        <div className="setting-icon-container">
                            <Moon size={20} style={iconStyle} />
                        </div>
                        <div className="setting-info">
                            <span className="setting-label">Тёмная тема</span>
                            <span className="setting-desc">{settings.darkMode ? 'Включена' : 'Выключена'}</span>
                        </div>
                        <div className={`toggle-switch ${settings.darkMode ? 'active' : ''}`}>
                            <div className="toggle-knob"></div>
                        </div>
                    </div>
                    <div className="setting-item">
                        <div className="setting-icon-container">
                            <HelpCircle size={20} style={iconStyle} />
                        </div>
                        <div className="setting-info">
                            <span className="setting-label">Обучающий тур</span>
                            <span className="setting-desc">Показать подсказки снова</span>
                        </div>
                        <ChevronRight size={18} className="text-secondary" />
                    </div>
                </div>
            </div>

            <div className="settings-section">
                <h2 className="section-title">Система</h2>
                <div className="settings-list glass-panel">
                    <div className="setting-item" onClick={() => toggleSetting('autoSync')}>
                        <div className="setting-icon-container">
                            <Shield size={20} style={iconStyle} />
                        </div>
                        <div className="setting-info">
                            <span className="setting-label">Авто-синхронизация</span>
                            <span className="setting-desc">Синхронизация с R-Keeper</span>
                        </div>
                        <div className={`toggle-switch ${settings.autoSync ? 'active' : ''}`}>
                            <div className="toggle-knob"></div>
                        </div>
                    </div>
                    <div className="setting-item">
                        <div className="setting-icon-container">
                            <Info size={20} style={iconStyle} />
                        </div>
                        <div className="setting-info">
                            <span className="setting-label">О приложении</span>
                            <span className="setting-desc">Версия 1.0.4 (The Bull Build)</span>
                        </div>
                        <ChevronRight size={18} className="text-secondary" />
                    </div>
                </div>
            </div>

            <Button variant="outline" fullWidth className="logout-btn" style={{ color: 'var(--primary-red)', borderColor: 'rgba(211, 47, 47, 0.3)' }}>
                <LogOut size={18} className="mr-2" /> Выйти из аккаунта
            </Button>
        </div>
    );
}
