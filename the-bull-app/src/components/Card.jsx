import React from 'react';
import './Card.css';

export default function Card({ children, className = '', onClick, padding = '20px', ...rest }) {
    const isClickable = !!onClick;
    return (
        <div
            className={`glass-panel card ${isClickable ? 'clickable' : ''} ${className}`}
            onClick={onClick}
            style={{ padding }}
            {...rest}
        >
            {children}
        </div>
    );
}
