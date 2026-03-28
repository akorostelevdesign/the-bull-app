import React, { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, PenLine, Eraser, Trash2, ShoppingBag, Check } from 'lucide-react';
import { useOrder } from '../contexts/OrderContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import './Home.css';

export default function Home() {
    const { tables, addTable, updateTable, removeTable, clearTable, updateOrderStatus } = useOrder();
    const navigate = useNavigate();

    const [view, setView] = useState('tables'); // 'tables', 'kitchen', 'bar'
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newTableName, setNewTableName] = useState('');

    // Long press and Context Menu state
    const [actionTable, setActionTable] = useState(null);
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);

    const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
    const [renameValue, setRenameValue] = useState('');

    const pressTimer = useRef(null);
    const isLongPress = useRef(false);

    const handleAddTable = (e) => {
        e.preventDefault();
        if (!newTableName.trim()) return;
        const tableId = addTable(newTableName);
        setNewTableName('');
        setIsModalOpen(false);
        navigate(`/table/${tableId}`);
    };

    const calculateTotal = (orders) => {
        return orders.reduce((sum, order) => sum + (order.price * order.quantity), 0);
    };

    const handlePointerDown = (table) => {
        isLongPress.current = false;
        pressTimer.current = setTimeout(() => {
            isLongPress.current = true;
            setActionTable(table);
            setIsActionModalOpen(true);
            // viberate briefly if possible
            if (window.navigator && window.navigator.vibrate) {
                window.navigator.vibrate(50);
            }
        }, 500); // 500ms for long press
    };

    const handlePointerUp = (tableId) => {
        clearTimeout(pressTimer.current);
        if (!isLongPress.current && !isActionModalOpen && !isRenameModalOpen) {
            navigate(`/table/${tableId}`);
        }
    };

    const handlePointerLeave = () => {
        clearTimeout(pressTimer.current);
    };

    const getStats = (orders) => {
        const stats = { kitchen: { total: 0, served: 0, items: [] }, bar: { total: 0, served: 0, items: [] } };
        orders.forEach(o => {
            const cat = (o.category || '').toUpperCase();
            const alcohols = ['НАПИТКИ', 'ПИВО', 'БАР', 'ВИНТ', 'КОКТЕЙЛЬ', 'ВОДКА', 'ВИСКИ', 'ДЖИН', 'КОНЬЯК', 'ТЕКИЛА', 'РОМ', 'ШОТЫ', 'ЛИМОНАДЫ', 'ВЕРМУТ', 'НАСТОЙКИ', 'БИТТЕР', 'ЛИКЕР', 'СПИРТ'];
            const isBar = alcohols.some(a => cat.includes(a)) || cat.includes('WINE') || cat.includes('GIN') || cat.includes('VODKA') || cat.includes('RUM') || cat.includes('WHISKEY');
            const target = isBar ? stats.bar : stats.kitchen;
            target.total += o.quantity;
            if (o.status === 'served') {
                target.served += o.quantity;
            } else {
                // Include both 'new' and 'sent' in the items list for queues
                target.items.push(o);
            }
        });
        return stats;
    };

    const globalStats = useMemo(() => {
        const stats = { kitchen: [], bar: [] };
        tables.forEach(table => {
            const tableStats = getStats(table.orders);
            if (tableStats.kitchen.items.length > 0) {
                stats.kitchen.push({ id: table.id, name: table.name, items: tableStats.kitchen.items });
            }
            if (tableStats.bar.items.length > 0) {
                stats.bar.push({ id: table.id, name: table.name, items: tableStats.bar.items });
            }
        });
        return stats;
    }, [tables]);

    return (
        <div className="page-container home-page">
            <div className="ambient-glow g-1"></div>
            <div className="ambient-glow g-2"></div>

            <div className="header-row-v3">
                <div className="header-actions-group">
                    <div className="title-fake-button">
                        Столы
                    </div>
                    <button className="header-plus-btn" onClick={() => setIsModalOpen(true)}>
                        <Plus size={24} />
                    </button>
                </div>
            </div>

            <div className="view-selector-v3">
                <button 
                    className={`nav-chip-v3 ${view === 'tables' ? 'active' : ''}`}
                    onClick={() => setView('tables')}
                >
                    Зал
                </button>
                <button 
                    className={`nav-chip-v3 ${view === 'kitchen' ? 'active' : ''}`}
                    onClick={() => setView('kitchen')}
                >
                    Кухня {globalStats.kitchen.length > 0 && <span className="cat-badge">{globalStats.kitchen.length}</span>}
                </button>
                <button 
                    className={`nav-chip-v3 ${view === 'bar' ? 'active' : ''}`}
                    onClick={() => setView('bar')}
                >
                    Бар {globalStats.bar.length > 0 && <span className="cat-badge">{globalStats.bar.length}</span>}
                </button>
            </div>

            <div className="home-content">
                {view === 'tables' && (
                    <>
                        {tables.length === 0 ? (
                            <div className="main-empty-state fade-in">
                                <h2 className="empty-title">Нет открытых столов</h2>
                                <p className="empty-desc">Начните смену, создав первый стол для приема заказов.</p>
                                <Button onClick={() => setIsModalOpen(true)} className="create-first-btn">
                                    Создать стол
                                </Button>
                            </div>
                        ) : (
                            <div className="tables-grid fade-in">
                                {tables.map(table => {
                                    const total = calculateTotal(table.orders);
                                    const hasOrders = table.orders.length > 0;
                                    const stats = getStats(table.orders);

                                    return (
                                        <Card
                                            key={table.id}
                                            className={`table-card-v2 ${hasOrders ? 'active' : ''}`}
                                            onPointerDown={() => handlePointerDown(table)}
                                            onPointerUp={() => handlePointerUp(table.id)}
                                            onPointerLeave={handlePointerLeave}
                                        >
                                            <div className="table-card-glow" />
                                            <div className="t-card-header">
                                                <span className="t-card-number">{table.name}</span>
                                                {hasOrders && <span className="t-card-price">{total} ₽</span>}
                                            </div>

                                            {hasOrders ? (
                                                <div className="t-card-stats">
                                                    <div className="stat-mini">
                                                        <div className="stat-bar"><div className="stat-fill kitchen" style={{ width: `${stats.kitchen.total > 0 ? (stats.kitchen.served / stats.kitchen.total) * 100 : 0}%` }} /></div>
                                                        <span className="stat-text">{stats.kitchen.served}/{stats.kitchen.total}</span>
                                                    </div>
                                                    <div className="stat-mini">
                                                        <div className="stat-bar"><div className="stat-fill bar" style={{ width: `${stats.bar.total > 0 ? (stats.bar.served / stats.bar.total) * 100 : 0}%` }} /></div>
                                                        <span className="stat-text">{stats.bar.served}/{stats.bar.total}</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="t-card-status">Свободен</div>
                                            )}
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}

                {view !== 'tables' && (
                    <div className="queue-list fade-in">
                        {globalStats[view].length === 0 ? (
                            <div className="empty-queue-v2">
                                <div className="empty-check-icon">
                                    <Check size={32} />
                                </div>
                                <p>Очередь пуста</p>
                                <span>Все заказы готовы и вынесены</span>
                            </div>
                        ) : (
                            globalStats[view].map(tableQueue => (
                                <div key={tableQueue.id} className="queue-card">
                                    <div className="q-card-header">
                                        <h3>Стол {tableQueue.name}</h3>
                                        <span className="q-count-badge">{tableQueue.items.length}</span>
                                    </div>
                                    <div className="q-card-items">
                                        {tableQueue.items.map(order => (
                                            <div key={order.id} className="q-item-row">
                                                <div className="q-item-info">
                                                    <span className="q-item-name">{order.name}</span>
                                                    <span className="q-item-qty">x{order.quantity}</span>
                                                </div>
                                                <button
                                                    className="q-complete-btn"
                                                    onClick={() => updateOrderStatus(tableQueue.id, order.id, 'served')}
                                                >
                                                    Готово
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Create Table Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Новый стол">
                <form onSubmit={handleAddTable} className="modal-form">
                    <div className="form-group">
                        <Input
                            autoFocus
                            placeholder="Название или номер"
                            value={newTableName}
                            onChange={(e) => setNewTableName(e.target.value)}
                            inputMode="text"
                        />
                    </div>
                    <Button type="submit" fullWidth className="submit-btn" disabled={!newTableName.trim()}>
                        Создать стол
                    </Button>
                </form>
            </Modal>

            {/* Action Menu Modal for Table */}
            <Modal isOpen={isActionModalOpen} onClose={() => setIsActionModalOpen(false)} title={`Стол: ${actionTable?.name}`}>
                <div className="table-actions-menu">
                    <Button
                        variant="secondary"
                        fullWidth
                        onClick={() => {
                            setRenameValue(actionTable?.name || '');
                            setIsActionModalOpen(false);
                            setIsRenameModalOpen(true);
                        }}
                        style={{ justifyContent: 'flex-start', marginBottom: '8px' }}
                    >
                        <PenLine size={20} style={{ marginRight: '12px' }} />
                        Переименовать стол
                    </Button>
                    <Button
                        variant="secondary"
                        fullWidth
                        onClick={() => {
                            if (window.confirm('Очистить все заказы стола?')) {
                                clearTable(actionTable.id);
                                setIsActionModalOpen(false);
                            }
                        }}
                        style={{ justifyContent: 'flex-start', marginBottom: '8px' }}
                    >
                        <Eraser size={20} style={{ marginRight: '12px' }} />
                        Очистить стол
                    </Button>
                    <Button
                        variant="ghost"
                        fullWidth
                        style={{ justifyContent: 'flex-start', color: 'var(--primary-red)' }}
                        onClick={() => {
                            if (window.confirm('Удалить стол полностью?')) {
                                removeTable(actionTable.id);
                                setIsActionModalOpen(false);
                            }
                        }}
                    >
                        <Trash2 size={20} style={{ marginRight: '12px' }} />
                        Удалить стол
                    </Button>
                </div>
            </Modal>

            {/* Rename Modal */}
            <Modal isOpen={isRenameModalOpen} onClose={() => setIsRenameModalOpen(false)} title="Переименовать">
                <form onSubmit={(e) => {
                    e.preventDefault();
                    if (renameValue.trim() && actionTable) {
                        updateTable(actionTable.id, renameValue);
                        setIsRenameModalOpen(false);
                    }
                }} className="modal-form">
                    <div className="form-group">
                        <Input
                            autoFocus
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            placeholder="Новое название"
                        />
                    </div>
                    <Button type="submit" fullWidth className="submit-btn" disabled={!renameValue.trim()}>
                        Сохранить
                    </Button>
                </form>
            </Modal>

        </div>
    );
}
