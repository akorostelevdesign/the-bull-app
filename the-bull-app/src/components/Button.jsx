import React from 'react';
import '../styles/Button.css';

export default function Button({
    children,
    onClick,
    variant = 'primary', // primary, secondary, ghost
    size = 'md', // sm, md, lg
    className = '',
    icon: Icon,
    disabled = false,
    fullWidth = false,
    type = 'button'
}) {
    const baseClass = `btn btn-${variant} btn-${size} ${fullWidth ? 'btn-full' : ''} ${className}`;

    return (
        <button
            type={type}
            className={baseClass}
            onClick={onClick}
            disabled={disabled}
        >
            {Icon && <Icon className="btn-icon" size={size === 'sm' ? 16 : 20} />}
            {children}
        </button>
    );
}
