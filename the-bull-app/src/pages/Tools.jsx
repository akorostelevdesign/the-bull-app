import React, { useState, useMemo } from 'react';
import { Search, Ban, ShieldAlert, LayoutGrid, Server, ChevronLeft, Info, X } from 'lucide-react';
import { dishes } from '../data/db';
import { useOrder } from '../contexts/OrderContext';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import '../styles/Tools.css';

const POPULAR = ['Стейк Рибай', 'Борщ', 'Цезарь', 'Лимонад', 'Бургер'];

export default function Tools() {
    const { stopList, toggleStopList, clearStopList } = useOrder();
    const [activeTab, setActiveTab] = useState('catalog');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDish, setSelectedDish] = useState(null);

    const searchResults = useMemo(() => {
        if (!searchQuery.trim()) return [];
        return dishes.filter(d =>
            d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            String(d.code).includes(searchQuery)
        ).slice(0, 30);
    }, [searchQuery]);

    const handleChipClick = (name) => {
        const found = dishes.find(d => d.name.toLowerCase().includes(name.toLowerCase()));
        if (found) setSelectedDish(found);
    };

    // ----- DISH DETAIL VIEW -----
    if (selectedDish) {
        return (
            <div className="page-container dish-detail-page">
                <div className="dish-detail-nav">
                    <button className="back-to-catalog" onClick={() => setSelectedDish(null)}>
                        <ChevronLeft size={20} /> Каталог
                    </button>
                </div>

                {selectedDish.image ? (
                    <div className="dish-detail-hero">
                        <img
                            src={`/${selectedDish.image}`}
                            alt={selectedDish.name}
                            className="dish-detail-hero-img"
                            onError={e => e.target.closest('.dish-detail-hero').style.display = 'none'}
                        />
                    </div>
                ) : (
                    <div className="dish-detail-hero-placeholder" />
                )}

                <div className="dish-detail-body">
                    <div className="dish-detail-title-row">
                        <h1 className="dish-detail-title">{selectedDish.name}</h1>
                        <span className="dish-detail-price">{selectedDish.price} <span className="rub">₽</span></span>
                    </div>

                    {selectedDish.category && (
                        <div className="detail-badge-row">
                            <span className="detail-badge">
                                <Info size={12} /> {selectedDish.category}
                            </span>
                        </div>
                    )}

                    <div className="detail-info-blocks">
                        <div className="detail-info-block">
                            <span className="di-label">Код R-Keeper</span>
                            <span className="di-value">{selectedDish.code}</span>
                        </div>
                        {selectedDish.raw?.gramm && (
                            <div className="detail-info-block">
                                <span className="di-label">Вес</span>
                                <span className="di-value">{selectedDish.raw.gramm}</span>
                            </div>
                        )}
                        {selectedDish.raw?.kbju && (
                            <div className="detail-info-block">
                                <span className="di-label">КБЖУ</span>
                                <span className="di-value">{selectedDish.raw.kbju}</span>
                            </div>
                        )}
                    </div>

                    {selectedDish.raw?.composition && selectedDish.raw.composition.length > 0 && (
                        <div className="detail-section">
                            <h3 className="detail-section-title">Состав</h3>
                            <p className="detail-section-text">{selectedDish.raw.composition.join(', ')}</p>
                        </div>
                    )}

                    {selectedDish.raw?.allergens && selectedDish.raw.allergens.length > 0 && (
                        <div className="detail-section">
                            <h3 className="detail-section-title allergen-title">Аллергены</h3>
                            <div className="allergen-chips">
                                {selectedDish.raw.allergens.map((a, i) => (
                                    <span key={i} className="allergen-chip">{a}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ----- MAIN TOOLS VIEW -----
    return (
        <div className="page-container tools-page">
            <h1 className="page-title">Инструменты</h1>

            <div className="tools-tabs glass-panel">
                <button className={`tool-tab ${activeTab === 'catalog' ? 'active' : ''}`} onClick={() => setActiveTab('catalog')}>
                    <LayoutGrid size={16} /> Каталог
                </button>
                <button className={`tool-tab ${activeTab === 'stoplist' ? 'active' : ''}`} onClick={() => setActiveTab('stoplist')}>
                    <Ban size={16} /> Стоп-лист
                    {stopList.length > 0 && <span className="tab-badge">{stopList.length}</span>}
                </button>
                <button className={`tool-tab ${activeTab === 'sync' ? 'active' : ''}`} onClick={() => setActiveTab('sync')}>
                    <Server size={16} /> Системы
                </button>
            </div>

            <div className="action-buttons-row">
                <Button variant="secondary" size="sm" className="action-tool-btn">Позиционник</Button>
                <Button variant="secondary" size="sm" className="action-tool-btn">Передать</Button>
                <Button variant="secondary" size="sm" className="action-tool-btn">Карта</Button>
            </div>

            <div className="tab-content">
                {activeTab === 'catalog' && (
                    <div className="catalog-tab">
                        <Input
                            icon
                            placeholder="Название блюда или код..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />

                        {!searchQuery.trim() ? (
                            /* Empty state with popular chips */
                            <div className="catalog-empty-state">
                                <Search size={40} className="catalog-search-icon" />
                                <h3>Поиск блюд</h3>
                                <p className="text-secondary">Напишите название блюда или код</p>
                                <div className="popular-chips">
                                    {POPULAR.map(name => (
                                        <button key={name} className="popular-chip" onClick={() => handleChipClick(name)}>
                                            {name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : searchResults.length === 0 ? (
                            <div className="catalog-empty-state">
                                <Search size={40} className="catalog-search-icon" />
                                <p className="text-secondary">Ничего не найдено</p>
                            </div>
                        ) : (
                            <div className="search-results-list">
                                {searchResults.map(dish => (
                                    <div key={dish.id} className="search-result-row" onClick={() => setSelectedDish(dish)}>
                                        <div className="sr-info">
                                            <span className="sr-name">{dish.name}</span>
                                            <span className="sr-meta">Код: {dish.code} · {dish.category}</span>
                                        </div>
                                        <span className="sr-price">{dish.price} ₽</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'stoplist' && (
                    <div className="stoplist-tab fade-in">
                        <Card padding="20px">
                            <h2 style={{ marginBottom: '16px', fontSize: '16px' }}>Управление Стоп-листом</h2>
                            <Input
                                icon
                                placeholder="Найти блюдо..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                            {searchQuery.trim() && searchResults.length > 0 && (
                                <div className="stop-search-results glass-panel">
                                    {searchResults.slice(0, 8).map(dish => {
                                        const isStopped = stopList.includes(dish.id);
                                        return (
                                            <div key={dish.id} className={`stop-search-item ${isStopped ? 'is-stopped' : ''}`}
                                                onClick={() => { toggleStopList(dish.id); setSearchQuery(''); }}>
                                                <span>{dish.name}</span>
                                                <span className={isStopped ? 'action-text text-secondary' : 'action-text text-primary'}>
                                                    {isStopped ? 'УБРАТЬ' : 'В СТОП'}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            {stopList.length > 0 ? (
                                <div className="active-stoplist" style={{ marginTop: '16px' }}>
                                    <h3 className="text-secondary" style={{ fontSize: '12px', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>В стопе:</h3>
                                    <div className="stopped-items-list">
                                        {stopList.map(id => {
                                            const dish = dishes.find(d => d.id === id);
                                            if (!dish) return null;
                                            return (
                                                <div key={id} className="stopped-chip">
                                                    <span className="truncate">{dish.name}</span>
                                                    <button className="remove-stop" onClick={() => toggleStopList(id)}>×</button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <Button variant="ghost" fullWidth style={{ marginTop: '16px' }}
                                        onClick={() => { if (window.confirm('Очистить весь стоп-лист?')) clearStopList(); }}>
                                        Очистить всё
                                    </Button>
                                </div>
                            ) : (
                                <p className="text-secondary" style={{ textAlign: 'center', marginTop: '24px', opacity: 0.5 }}>Стоп-лист пуст.</p>
                            )}
                        </Card>
                    </div>
                )}

                {activeTab === 'sync' && (
                    <div className="sync-tab fade-in">
                        <Card padding="24px">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                <ShieldAlert size={24} />
                                <h2>R-Keeper Sync</h2>
                            </div>
                            <p className="text-secondary" style={{ marginBottom: '20px' }}>Синхронизация заказов между приложением и кассой.</p>
                            <Button variant="secondary" fullWidth>Синхронизировать</Button>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
