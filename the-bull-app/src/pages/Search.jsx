import React, { useState, useMemo } from 'react';
import { Search as SearchIcon, Filter } from 'lucide-react';
import { dishes, categories } from '../data/db';
import Input from '../components/Input';
import Card from '../components/Card';
import '../styles/Search.css';

export default function Search() {
    const [query, setQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');

    // We'll extract unique categories from the dishes list since we imported real data
    const realCategories = useMemo(() => {
        const cats = new Set(dishes.map(d => d.category));
        return ['all', ...Array.from(cats)].filter(Boolean);
    }, []);

    const searchResults = useMemo(() => {
        return dishes.filter(d => {
            const matchesSearch = d.name.toLowerCase().includes(query.toLowerCase()) || d.code.includes(query);
            const matchesCategory = activeCategory === 'all' || d.category === activeCategory;
            return matchesSearch && matchesCategory;
        });
    }, [query, activeCategory]);

    return (
        <div className="page-container search-page">
            <div className="header-row">
                <h1 className="page-title" style={{ marginBottom: 0 }}>Меню и Бар</h1>
            </div>

            <div className="search-bar-sticky">
                <Input
                    icon
                    placeholder="Поиск по названию или коду..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                />

                <div className="category-scroll">
                    {realCategories.map(cat => (
                        <button
                            key={cat}
                            className={`cat-chip ${activeCategory === cat ? 'active' : ''}`}
                            onClick={() => setActiveCategory(cat)}
                        >
                            {cat === 'all' ? 'Все' : cat}
                        </button>
                    ))}
                </div>
            </div>

            <div className="search-grid">
                {searchResults.length === 0 ? (
                    <div className="empty-results text-secondary">
                        <SearchIcon size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                        <p>Ничего не найдено</p>
                    </div>
                ) : (
                    searchResults.map(dish => (
                        <Card key={dish.id} className="dish-catalog-card" padding="12px">
                            <div className="catalog-row">
                                {dish.image && (
                                    <div className="catalog-img-wrapper">
                                        <img src={dish.image.startsWith('http') ? dish.image : window.location.origin + '/' + dish.image} alt={dish.name} className="catalog-thumbnail" onError={(e) => e.target.style.display = 'none'} />
                                    </div>
                                )}
                                <div className="catalog-content">
                                    <div className="catalog-main">
                                        <h3 className="catalog-title">{dish.name}</h3>
                                        <div className="catalog-price">{dish.price} ₽</div>
                                    </div>

                                    <div className="catalog-meta text-secondary">
                                        <span>Код: <strong>{dish.code}</strong></span>
                                        <span className="cat-tag">{dish.category}</span>
                                    </div>
                                </div>
                            </div>

                            {dish.raw?.composition && (
                                <div className="catalog-composition text-secondary">
                                    {dish.raw.composition.join(', ')}
                                </div>
                            )}
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
