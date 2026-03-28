import { useNavigate } from 'react-router-dom';
import { UPSELL_RULES } from '../data/upsell-rules';
import { useUpsellSettings } from '../hooks/useUpsellSettings';
import './CourseSettings.css';

export default function UpsellSettings() {
    const navigate = useNavigate();
    const { settings, toggle } = useUpsellSettings();

    return (
        <div className="page-container course-settings-page">
            <div className="table-header-nav">
                <div className="nav-left">
                    <button className="nav-rect-btn" onClick={() => navigate('/settings')}>
                        <span>Назад</span>
                    </button>
                </div>
                <h1 className="cs-page-title">Допродажи</h1>
                <div className="nav-right" />
            </div>

            <div className="cs-section">
                <h2 className="section-title">Правила допродаж</h2>
                <div className="cs-courses-list glass-panel">
                    {UPSELL_RULES.map(rule => (
                        <div
                            key={rule.id}
                            className="cs-course-item"
                            onClick={() => toggle(rule.id)}
                        >
                            <div className="cs-course-info">
                                <span className="cs-course-label">{rule.label}</span>
                                <span className="cs-course-sub">
                                    {rule.recommendations.map(r => r.name).join(', ')}
                                </span>
                            </div>
                            <div className={`toggle-switch ${settings[rule.id] ? 'active' : ''}`}>
                                <div className="toggle-knob" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
