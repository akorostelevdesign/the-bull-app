import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrder } from '../contexts/OrderContext';
import { ChevronLeft, ChevronRight, Clock, Receipt } from 'lucide-react';
import Card from '../components/Card';
import './TableHistory.css';

function formatDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function formatTime(iso) {
    const d = new Date(iso);
    return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

export default function TableHistory() {
    const { tableHistory } = useOrder();
    const navigate = useNavigate();
    const [selected, setSelected] = useState(null);

    if (selected) {
        return (
            <div className="page-container th-detail">
                <div className="th-nav">
                    <button className="th-back-btn" onClick={() => setSelected(null)}>
                        <ChevronLeft size={20} /> Назад
                    </button>
                </div>
                <div className="th-detail-header">
                    <h1 className="th-detail-title">{selected.tableName}</h1>
                    <span className="th-detail-meta">
                        <Clock size={13} /> {formatDate(selected.closedAt)} в {formatTime(selected.closedAt)}
                    </span>
                </div>
                <Card padding="0">
                    {selected.orders.map((o, i) => (
                        <div key={i} className="th-order-row">
                            <span className="th-order-name">{o.name}</span>
                            <span className="th-order-qty">×{o.quantity}</span>
                            <span className="th-order-price">{(o.price * o.quantity).toLocaleString('ru-RU')} ₽</span>
                        </div>
                    ))}
                    <div className="th-order-total">
                        <span>Итого</span>
                        <span>{selected.total.toLocaleString('ru-RU')} ₽</span>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="page-container">
            <div className="th-nav">
                <button className="th-back-btn" onClick={() => navigate('/profile')}>
                    <ChevronLeft size={20} /> Профиль
                </button>
            </div>
            <h1 className="page-title">История столов</h1>

            {tableHistory.length === 0 ? (
                <div className="th-empty">
                    <Receipt size={48} className="th-empty-icon" />
                    <p>История пуста</p>
                    <span className="text-secondary">Закрытые столы будут отображаться здесь</span>
                </div>
            ) : (
                <div className="th-list">
                    {tableHistory.map(entry => (
                        <div key={entry.id} className="th-item glass-panel" onClick={() => setSelected(entry)}>
                            <div className="th-item-info">
                                <span className="th-item-name">{entry.tableName}</span>
                                <span className="th-item-meta">
                                    <Clock size={12} /> {formatDate(entry.closedAt)} в {formatTime(entry.closedAt)}
                                </span>
                            </div>
                            <div className="th-item-right">
                                <span className="th-item-total">{entry.total.toLocaleString('ru-RU')} ₽</span>
                                <ChevronRight size={16} className="th-chevron" />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
