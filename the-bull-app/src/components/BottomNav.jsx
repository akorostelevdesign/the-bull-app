import { NavLink } from 'react-router-dom';
import { User, Wrench, Search, BookOpen, Settings, LayoutGrid } from 'lucide-react';
import '../styles/BottomNav.css';

export default function BottomNav() {
    const navItems = [
        { name: 'Профиль', path: '/profile', icon: User, tutorial: 'profile' },
        { name: 'Инструменты', path: '/tools', icon: Wrench, tutorial: 'menu' },
        { name: 'Столы', path: '/', icon: LayoutGrid, tutorial: 'menu' },
        { name: 'Изучение', path: '/learning', icon: BookOpen, tutorial: 'learning' },
        { name: 'Настройки', path: '/settings', icon: Settings, tutorial: 'settings' },
    ];

    return (
        <nav className="bottom-nav glass-panel">
            {navItems.map((item) => {
                const Icon = item.icon;
                return (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        data-tutorial={item.tutorial}
                    >
                        <Icon size={24} className="nav-icon" />
                        <span className="nav-label">{item.name}</span>
                    </NavLink>
                );
            })}
        </nav>
    );
}
