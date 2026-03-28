import { NavLink } from 'react-router-dom';
import { User, Wrench, Search, BookOpen, Settings, LayoutGrid } from 'lucide-react';
import '../styles/BottomNav.css';

export default function BottomNav() {
    const navItems = [
        { name: 'Профиль', path: '/profile', icon: User },
        { name: 'Инструменты', path: '/tools', icon: Wrench },
        { name: 'Столы', path: '/', icon: LayoutGrid },
        { name: 'Изучение', path: '/learning', icon: BookOpen },
        { name: 'Настройки', path: '/settings', icon: Settings },
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
                    >
                        <Icon size={24} className="nav-icon" />
                        <span className="nav-label">{item.name}</span>
                    </NavLink>
                );
            })}
        </nav>
    );
}
