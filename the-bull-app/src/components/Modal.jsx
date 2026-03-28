import React, { useEffect } from 'react';
import '../styles/Modal.css';

export default function Modal({ isOpen, onClose, title, children }) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-container glass-panel"
                onClick={e => e.stopPropagation()}
            >
                {title && <h2 className="modal-title">{title}</h2>}
                <div className="modal-content">
                    {children}
                </div>
            </div>
        </div>
    );
}
