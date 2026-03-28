import React, { forwardRef } from 'react';
import { Search } from 'lucide-react';
import './Input.css';

const Input = forwardRef(({
    type = 'text',
    placeholder,
    value,
    onChange,
    icon = false,
    className = '',
    ...props
}, ref) => {
    return (
        <div className={`input-container ${className}`}>
            {icon && <Search className="input-icon" size={20} />}
            <input
                ref={ref}
                type={type}
                className={`glass-input ${icon ? 'with-icon' : ''}`}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                {...props}
            />
        </div>
    );
});

Input.displayName = 'Input';
export default Input;
