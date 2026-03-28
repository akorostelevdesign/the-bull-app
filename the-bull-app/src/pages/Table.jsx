import React, { useState, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Minus, Trash2, Check, ExternalLink, ShoppingBag, RotateCw, GlassWater, ChevronUp, ChevronDown } from 'lucide-react';
import { useOrder } from '../contexts/OrderContext';
import { dishes, upsellChains } from '../data/db';
import { getUpsellsForOrder } from '../data/upsell-rules';
import { useUpsellSettings } from '../hooks/useUpsellSettings';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Modal from '../components/Modal';
import {
    DndContext,
    closestCenter,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
    arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import '../styles/Table.css';

function SortableItem({ id, children }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    const style = {
        // Только вертикальное смещение — X фиксируем в 0
        transform: transform ? `translate3d(0, ${transform.y}px, 0)` : undefined,
        transition,
        opacity: isDragging ? 0.5 : 1,
        position: 'relative',
        zIndex: isDragging ? 999 : 'auto',
        touchAction: 'pan-y',
    };
    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            {children()}
        </div>
    );
}

export default function Table() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { tables, addOrderToTable, updateOrderQuantity, removeOrder, updateOrderStatus, updateOrderNote, toggleOrderToGo, addModifierToOrder, stopList, courseSettings, sortTableOrders, reorderTableOrders } = useOrder();

    const syncBundleAction = (tableId, order, actionFn) => {
        if (order.bundleId) {
            const bundleItems = table.orders.filter(o => o.bundleId === order.bundleId);
            bundleItems.forEach(item => actionFn(tableId, item.id));
        } else {
            actionFn(tableId, order.id);
        }
    };

    const handleSyncQuantity = (order, delta) => {
        // Для связанных блюд работаем только с конкретным блюдом, а не со всей связкой
        const currentOrder = table.orders.find(o => o.id === order.id);

        if (delta === -1 && currentOrder.quantity === 1) {
            setConfirmDialog({
                isOpen: true,
                title: 'Удалить блюдо?',
                message: `Вы действительно хотите удалить "${order.name}" из заказа?`,
                onConfirm: () => removeOrder(table.id, order.id)
            });
        } else {
            updateOrderQuantity(table.id, order.id, delta);
        }
    };

    const [searchQuery, setSearchQuery] = useState('');
    const [upsellModal, setUpsellModal] = useState({ isOpen: false, dish: null, currentStep: 0, selections: [] });
    const [additionModal, setAdditionModal] = useState({ isOpen: false, targetOrder: null, searchQuery: '' });
    const [zoomImage, setZoomImage] = useState(null); // { src, order } | '__placeholder__' | null
    const [dishDetailModal, setDishDetailModal] = useState(null); // order object
    const [compositionModal, setCompositionModal] = useState({ isOpen: false, order: null });
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
    const [swipingId, setSwipingId] = useState(null);
    const [swipeX, setSwipeX] = useState(0);
    const [isSorted, setIsSorted] = useState(false);
    // courseOverrides: { [itemKey]: courseNum } — ручное переопределение курса для auto_manual
    const [courseOverrides, setCourseOverrides] = useState({});
    const touchStart = useRef(0);
    const potentialSwipingId = useRef(null);
    const { settings: upsellSettings } = useUpsellSettings();

    // dnd-kit sensors
    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 1000, tolerance: 10 } })
    );

    // Кнопки ▲▼ — перемещаем элемент (или всю связку) на одну позицию
    const moveItem = (itemKey, direction) => {
        const orders = table.orders;
        const seen = new Set();
        const logical = [];
        orders.forEach(o => {
            const key = o.bundleId || o.id;
            if (!seen.has(key)) { seen.add(key); logical.push(key); }
        });
        const idx = logical.indexOf(itemKey);
        if (idx === -1) return;
        const newIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (newIdx < 0 || newIdx >= logical.length) return;

        const doMove = (overrides = courseOverrides) => {
            const reordered = arrayMove(logical, idx, newIdx);
            const newOrders = reordered.flatMap(k => orders.filter(o => (o.bundleId || o.id) === k));
            reorderTableOrders(table.id, newOrders);
        };

        // В auto_manual при активной сортировке — проверяем пересечение курса
        if (courseSettings.mode === 'auto_manual' && sortingActive) {
            // Находим курс текущего и соседнего элемента
            const getCourseForKey = (k, overrides) => {
                if (overrides[k] !== undefined) return overrides[k];
                const o = orders.find(ord => (ord.bundleId || ord.id) === k);
                if (!o) return 5;
                if (o.bundleId) {
                    const items = orders.filter(ord => ord.bundleId === o.bundleId);
                    return Math.max(...items.map(i => getCourseNumber(i.category, i.name)));
                }
                return getCourseNumber(o.category, o.name);
            };
            const currentCourse = getCourseForKey(itemKey, courseOverrides);
            const neighborCourse = getCourseForKey(logical[newIdx], courseOverrides);

            if (currentCourse !== neighborCourse) {
                setConfirmDialog({
                    isOpen: true,
                    title: 'Перенести в другой курс?',
                    message: `Переместить блюдо в "${COURSE_NAMES[neighborCourse] || 'Прочее'}"?`,
                    onConfirm: () => {
                        setCourseOverrides(prev => ({ ...prev, [itemKey]: neighborCourse }));
                        doMove();
                    }
                });
                return;
            }
        }

        doMove();
    };

    // dnd-kit drag end
    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const orders = table.orders;
        const seen = new Set();
        const logical = [];
        orders.forEach(o => {
            const key = o.bundleId || o.id;
            if (!seen.has(key)) { seen.add(key); logical.push(key); }
        });
        const oldIdx = logical.indexOf(active.id);
        const newIdx = logical.indexOf(over.id);
        if (oldIdx === -1 || newIdx === -1) return;

        const doMove = () => {
            const reordered = arrayMove(logical, oldIdx, newIdx);
            const newOrders = reordered.flatMap(k => orders.filter(o => (o.bundleId || o.id) === k));
            reorderTableOrders(table.id, newOrders);
        };

        // В auto_manual при активной сортировке — проверяем пересечение курса
        if (courseSettings.mode === 'auto_manual' && sortingActive) {
            const getCourseForKey = (k, overrides) => {
                if (overrides[k] !== undefined) return overrides[k];
                const o = orders.find(ord => (ord.bundleId || ord.id) === k);
                if (!o) return 5;
                if (o.bundleId) {
                    const items = orders.filter(ord => ord.bundleId === o.bundleId);
                    return Math.max(...items.map(i => getCourseNumber(i.category, i.name)));
                }
                return getCourseNumber(o.category, o.name);
            };
            const activeCourse = getCourseForKey(active.id, courseOverrides);
            const overCourse = getCourseForKey(over.id, courseOverrides);

            if (activeCourse !== overCourse) {
                setConfirmDialog({
                    isOpen: true,
                    title: 'Перенести в другой курс?',
                    message: `Переместить блюдо в "${COURSE_NAMES[overCourse] || 'Прочее'}"?`,
                    onConfirm: () => {
                        setCourseOverrides(prev => ({ ...prev, [active.id]: overCourse }));
                        doMove();
                    }
                });
                return;
            }
        }

        doMove();
    };

    const table = tables.find(t => t.id === id);

    if (!table) {
        return (
            <div className="page-container" style={{ textAlign: 'center', marginTop: '50px' }}>
                <h2>Стол не найден</h2>
                <Button onClick={() => navigate('/')} style={{ marginTop: '20px' }}>На главную</Button>
            </div>
        );
    }

    // Filter dishes by search
    const searchResults = useMemo(() => {
        if (!searchQuery.trim()) return [];
        return dishes.filter(d =>
            d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            d.code.includes(searchQuery)
        );
    }, [searchQuery]);

    const handleAddDish = (dish) => {
        const proceedAdd = () => {
            if (dish.upsell && upsellChains[dish.upsell]) {
                setUpsellModal({ isOpen: true, dish, currentStep: 0, selections: [] });
            } else {
                addOrderToTable(table.id, dish);
                setSearchQuery('');
            }
        };

        if (stopList.includes(dish.id)) {
            setConfirmDialog({
                isOpen: true,
                title: 'Блюдо в стоп-листе',
                message: `Блюдо "${dish.name}" находится в стоп-листе. Добавить всё равно?`,
                onConfirm: proceedAdd
            });
            return;
        }
        proceedAdd();
    };

    const handleQuantity = (order, delta) => {
        if (delta === -1 && order.quantity === 1) {
            setConfirmDialog({
                isOpen: true,
                title: 'Удалить блюдо?',
                message: `Вы действительно хотите удалить "${order.name}" из заказа?`,
                onConfirm: () => removeOrder(table.id, order.id)
            });
        } else {
            updateOrderQuantity(table.id, order.id, delta);
        }
    };

    const handleTouchStart = (e, id) => {
        touchStart.current = e.touches[0].clientX;
        potentialSwipingId.current = id;
    };

    const handleTouchMove = (e) => {
        if (!touchStart.current) return;
        const currentX = e.touches[0].clientX;
        const diff = currentX - touchStart.current;

        if (Math.abs(diff) > 45) { // Threshold to start swiping
            if (swipingId !== potentialSwipingId.current) {
                setSwipingId(potentialSwipingId.current);
            }
            if (diff < 0) { // Swipe left
                setSwipeX(Math.max(diff, -140));
            }
        }
    };

    const handleTouchEnd = (orderId) => {
        if (swipingId && swipeX < -65) {
            const order = table.orders.find(o => o.id === orderId);
            setConfirmDialog({
                isOpen: true,
                title: 'Удалить блюдо',
                message: `Удалить "${order?.name || 'блюдо'}" из заказа?`,
                onConfirm: () => removeOrder(table.id, orderId)
            });
        }
        touchStart.current = null;
        potentialSwipingId.current = null;
        setSwipingId(null);
        setSwipeX(0);
    };

    const handleUpsellSelection = (opt) => {
        const chain = upsellChains[upsellModal.dish.upsell];
        const newSelections = [...upsellModal.selections, opt];

        if (upsellModal.currentStep < chain.steps.length - 1) {
            setUpsellModal({ ...upsellModal, currentStep: upsellModal.currentStep + 1, selections: newSelections });
        } else {
            // Finish
            addEverything(upsellModal.dish, newSelections);
        }
    };

    const addEverything = (mainDish, selections) => {
        // Clone to avoid mutating internal db objects
        const steak = { ...mainDish };
        const bundle = [steak];

        selections.forEach(sel => {
            if (sel.type === 'doneness') {
                steak.doneness = sel.name;
            } else {
                const found = dishes.find(d => d.name === sel.name);
                if (found) {
                    bundle.push({ ...found });
                } else {
                    // Use selection data if not found in main dishes (e.g. sauces)
                    bundle.push({
                        id: `mod_${Date.now()}_${Math.random()}`,
                        name: sel.name,
                        price: typeof sel.price === 'string' ? parseInt(sel.price) : (sel.price || 0),
                        image: sel.image || '',
                        category: sel.type === 'sauce' ? 'Соусы' : 'Гарниры',
                        code: sel.code || 'MOD'
                    });
                }
            }
        });

        // Ensure we always have a bundleId if selections were made
        addOrderToTable(table.id, bundle);
        setUpsellModal({ isOpen: false, dish: null, currentStep: 0, selections: [] });
        setSearchQuery('');
    };

    const skipUpsell = () => {
        const chain = upsellChains[upsellModal.dish.upsell];
        const currentStep = chain.steps[upsellModal.currentStep];

        // Doneness is always mandatory
        if (currentStep.type === 'doneness') return;

        // Sauce for King Size is mandatory
        if (upsellModal.dish.mandatorySauce && currentStep.type === 'sauce') return;

        if (upsellModal.currentStep < chain.steps.length - 1) {
            setUpsellModal({ ...upsellModal, currentStep: upsellModal.currentStep + 1 });
        } else {
            addEverything(upsellModal.dish, upsellModal.selections);
        }
    };




    const getCourseNumber = (category, name = '') => {
        if (!category) return 5;
        const cat = category.toUpperCase();
        const nm = name.toUpperCase();

        // Курс 0 — напитки (все виды)
        if (
            cat.includes('НАПИТКИ') || cat.includes('ЛИМОНАДЫ') || cat.includes('ПИВО') ||
            cat.includes('БАР') || cat.includes('КОКТЕЙЛЬ') || cat.includes('ЧАЙ') ||
            cat.includes('КОФЕ') || cat.includes('ГАЗ.') || cat.includes('ВИНО') ||
            cat.includes('ВИСКИ') || cat.includes('ВОДКА') || cat.includes('ТЕКИЛА') ||
            cat.includes('ЛИКЁР') || cat.includes('ЛИКЕР') || cat.includes('ДЖИН') ||
            cat.includes('РОМ') || cat.includes('КОНЬЯК') || cat.includes('ШАМПАНСКОЕ') ||
            cat.includes('БЕЗАЛКОГОЛЬНЫЕ')
        ) return 0;

        // Курс 1 — закуски, хлеб, салаты
        if (cat.includes('ЗАКУСК') || cat.includes('САЛАТ') || cat.includes('ХЛЕБ')) return 1;

        // Гарниры: пюре → курс 3, остальные → курс 1
        if (cat.includes('ГАРНИР')) {
            if (nm.includes('ПЮР')) return 3;
            return 1;
        }

        // Курс 2 — супы
        if (cat.includes('СУП')) return 2;

        // Курс 3 — горячее
        if (
            cat.includes('ГОРЯЧЕЕ') || cat.includes('ОСНОВНОЕ') || cat.includes('СТЕЙК') ||
            cat.includes('БУРГЕР') || cat.includes('РЫБА') || cat.includes('МЯСО') ||
            cat.includes('ПТИЦА') || cat.includes('ПАСТА') || cat.includes('ПИЦЦА') ||
            cat.includes('ПРАЙМ') || cat.includes('АЛЬТЕРНАТИВ') || cat.includes('ШАШЛЫК') ||
            cat.includes('СЕТЫ')
        ) return 3;

        // Курс 4 — десерты
        if (cat.includes('ДЕСЕРТ')) return 4;

        return 5;
    };

    const COURSE_NAMES = {
        0: 'Нулевой курс',
        1: 'Первый курс',
        2: 'Второй курс',
        3: 'Третий курс',
        4: 'Четвёртый курс',
        5: 'Прочее'
    };

    // Режим сортировки активен только если isSorted=true и mode не ручной
    const isManualMode = courseSettings.mode === 'auto_manual' || courseSettings.mode === 'manual';
    const isDragMode = isManualMode && courseSettings.manualType === 'drag';
    const isButtonsMode = isManualMode && courseSettings.manualType === 'buttons';
    const sortingActive = isSorted && courseSettings.mode !== 'manual';

    const groupedOrders = useMemo(() => {
        if (!table.orders.length) return [];

        const groups = new Map();
        const processedBundleIds = new Set();

        table.orders.forEach(order => {
            if (order.bundleId) {
                if (processedBundleIds.has(order.bundleId)) return;
                processedBundleIds.add(order.bundleId);

                const bundleItems = table.orders.filter(o => o.bundleId === order.bundleId);
                // Берём максимальный курс из всей связки (стейк+гарнир → курс стейка)
                let courseNum = Math.max(...bundleItems.map(i => getCourseNumber(i.category, i.name)));

                // Ручное переопределение курса
                if (courseOverrides[order.bundleId] !== undefined) {
                    courseNum = courseOverrides[order.bundleId];
                }

                // Если курс отключён — кладём в "Прочее"
                if (sortingActive && courseNum !== 5 && courseSettings.courses[courseNum] === false) {
                    courseNum = 5;
                }

                if (!groups.has(courseNum)) groups.set(courseNum, []);
                groups.get(courseNum).push({ isBundle: true, bundleId: order.bundleId, items: bundleItems });
            } else {
                let courseNum = getCourseNumber(order.category, order.name);

                // Ручное переопределение курса
                if (courseOverrides[order.id] !== undefined) {
                    courseNum = courseOverrides[order.id];
                }

                if (sortingActive && courseNum !== 5 && courseSettings.courses[courseNum] === false) {
                    courseNum = 5;
                }

                if (!groups.has(courseNum)) groups.set(courseNum, []);
                groups.get(courseNum).push(order);
            }
        });

        // Если сортировка не активна — показываем одной группой без заголовка курса
        if (!sortingActive) {
            const allItems = [];
            groups.forEach(items => allItems.push(...items));
            // Пробитые/вынесенные — в конец
            allItems.sort((a, b) => {
                const aStatus = a.isBundle ? a.items[0]?.status : a.status;
                const bStatus = b.isBundle ? b.items[0]?.status : b.status;
                const aDown = aStatus === 'sent' || aStatus === 'served' ? 1 : 0;
                const bDown = bStatus === 'sent' || bStatus === 'served' ? 1 : 0;
                return aDown - bDown;
            });
            return [{ name: null, items: allItems }];
        }

        return Array.from(groups.entries())
            .sort(([a], [b]) => a - b)
            .map(([courseNum, items]) => {
                // Группа считается "пробитой" если все блюда в ней sent или served
                const allDone = items.every(item => {
                    if (item.isBundle) return item.items.every(o => o.status === 'sent' || o.status === 'served');
                    return item.status === 'sent' || item.status === 'served';
                });
                return { name: COURSE_NAMES[courseNum] || 'Прочее', courseNum, items, allDone };
            })
            .sort((a, b) => {
                if (a.allDone === b.allDone) return 0;
                return a.allDone ? 1 : -1;
            });
    }, [table.orders, sortingActive, courseSettings, courseOverrides]);

    return (
        <div className="page-container table-page">
            <div className="table-header-nav">
                <div className="nav-left">
                    <button className="nav-rect-btn" onClick={() => navigate('/')}>
                        <span>Назад</span>
                    </button>
                </div>
                <h1 className="table-title">{table.name}</h1>
                <div className="nav-right">
                    <button className="nav-rect-btn" onClick={() => {
                        if (courseSettings.mode !== 'manual') {
                            sortTableOrders(table.id);
                            setIsSorted(true);
                        }
                    }} style={{ opacity: courseSettings.mode === 'manual' ? 0.3 : 1 }}>
                        <RotateCw size={18} />
                    </button>
                </div>
            </div>

            <div className="search-section">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (searchResults.length > 0) {
                            handleAddDish(searchResults[0]);
                        }
                    }}
                    className="search-form"
                >
                    <Input
                        icon
                        placeholder="Название или код R_keeper..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </form>

                {searchResults.length > 0 && (
                    <div className="search-results-container">
                        <div className="search-results glass-panel">
                            {searchResults.map((dish, index) => (
                                <div
                                    key={dish.id}
                                    className={`search-result-item ${stopList.includes(dish.id) ? 'stop-listed' : ''}`}
                                    onClick={() => handleAddDish(dish)}
                                    style={{ '--index': index }}
                                >
                                    <div className="dish-info">
                                        <span className="dish-name">{dish.name}</span>
                                    </div>
                                    <span className="dish-price">{dish.price} ₽</span>
                                    {stopList.includes(dish.id) && <span className="stop-badge">СТОП</span>}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="orders-list">
                {groupedOrders.length === 0 ? (
                    <div className="empty-orders text-secondary">
                        <ShoppingBag size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
                        <p>Нет заказов. Воспользуйтесь поиском, чтобы добавить блюда.</p>
                    </div>
                ) : (() => {
                    // Для drag режима — плоский список логических ключей
                    const seen = new Set();
                    const logicalKeys = [];
                    table.orders.forEach(o => {
                        const key = o.bundleId || o.id;
                        if (!seen.has(key)) { seen.add(key); logicalKeys.push(key); }
                    });

                    const renderGroup = (group) => group.items.map((item) => {
                        const isBundle = item.isBundle;
                        const bundleItems = isBundle ? item.items : [item];
                        const itemKey = isBundle ? item.bundleId : item.id;

                        const bundleContent = () => (
                            <div className={`order-bundle-container ${isBundle ? 'is-fused' : ''}`}>
                                {/* Кнопки ▲▼ над связкой — только в режиме buttons */}
                                {isButtonsMode && (
                                    <div className="move-btn-row">
                                        <button className="move-btn" onClick={() => moveItem(itemKey, 'up')}>
                                            <ChevronUp size={16} />
                                        </button>
                                        <button className="move-btn" onClick={() => moveItem(itemKey, 'down')}>
                                            <ChevronDown size={16} />
                                        </button>
                                    </div>
                                )}
                                {bundleItems.map((order, orderIdx) => (
                                    <div
                                        key={order.id}
                                        className={`order-swipe-wrapper bundle-item-${orderIdx} ${orderIdx === 0 ? 'is-top' : ''} ${orderIdx === bundleItems.length - 1 ? 'is-bottom' : ''} ${orderIdx > 0 && orderIdx < bundleItems.length - 1 ? 'is-middle' : ''} ${swipingId === order.id ? 'swiping' : ''}`}
                                        onTouchStart={(e) => !isManualMode && handleTouchStart(e, order.id)}
                                        onTouchMove={(e) => !isManualMode && handleTouchMove(e)}
                                        onTouchEnd={() => !isManualMode && handleTouchEnd(order.id)}
                                    >
                                        <div className="swipe-delete-bg">
                                            <Trash2 size={24} />
                                        </div>
                                        <Card
                                            className={`order-card ${order.toGo ? 'order-togo' : ''} ${order.status === 'served' ? 'served' : ''}`}
                                            padding="16px"
                                            style={{ transform: swipingId === order.id ? `translateX(${swipeX}px)` : 'none' }}
                                        >
                                            <div className="order-main-row">
                                                <div className="order-image-box" onClick={() => {
                                                    if (order.image && !order.image.includes('-.jpg') && !order.image.includes('images/-')) {
                                                        setZoomImage({ src: order.image, order });
                                                    } else {
                                                        setZoomImage({ src: '__placeholder__', order });
                                                    }
                                                }}>
                                                    {order.image && !order.image.includes('-.jpg') && !order.image.includes('images/-') ? (
                                                        <img src={order.image.startsWith('http') ? order.image : window.location.origin + '/' + order.image} alt={order.name} className="order-thumbnail" />
                                                    ) : (
                                                        <div className="no-image-placeholder">
                                                            {order.category && (order.category.toUpperCase().includes('ЧАЙ') || order.category.toUpperCase().includes('НАПИТКИ') || order.category.toUpperCase().includes('ЛИМОНАДЫ') || order.category.toUpperCase().includes('ПИВО') || order.category.toUpperCase().includes('КОФЕ') || order.category.toUpperCase().includes('ГАЗ.') || order.category.toUpperCase().includes('БАР'))
                                                                ? <GlassWater size={24} />
                                                                : <ShoppingBag size={24} />
                                                            }
                                                        </div>
                                                    )}
                                                    <div className="image-rk-badge-large">{order.code}</div>
                                                </div>
                                                <div className="order-content">
                                                    <div className="order-title-row">
                                                        <div className="title-stack">
                                                            <div className="order-title-header">
                                                                <h3 className={order.status === 'served' ? 'text-muted' : ''}>{order.name}</h3>
                                                                {order.doneness && <span className="order-doneness-tag">{order.doneness}</span>}
                                                            </div>
                                                            <div className="exclusion-list">
                                                                {order.note && order.note.split(' ').map((word, i) =>
                                                                    word === 'БЕЗ' ? null : (order.note.split(' ')[i - 1] === 'БЕЗ' ? <span key={i} className="excl-item">БЕЗ {word}</span> : null)
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="status-price-stack">
                                                            <span className="order-price">
                                                                {order.price * order.quantity} ₽
                                                            </span>
                                                            <span className={`status-tag status-${order.status}`}>
                                                                {order.status === 'new' && 'Новый'}
                                                                {order.status === 'sent' && 'В R-keeper'}
                                                                {order.status === 'served' && 'Вынесен'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="order-bottom-row">
                                                <div className="quantity-controls">
                                                    <button className="q-btn" onClick={() => handleSyncQuantity(order, -1)} disabled={order.status === 'served'}>
                                                        <Minus size={16} />
                                                    </button>
                                                    <span className="q-value">{order.quantity}</span>
                                                    <button className="q-btn" onClick={() => handleSyncQuantity(order, 1)} disabled={order.status === 'served'}>
                                                        <Plus size={16} />
                                                    </button>
                                                </div>

                                                <div className="action-buttons">
                                                    <button className="act-btn btn-exclusion" onClick={() => setCompositionModal({ isOpen: true, order })}>
                                                        <Minus size={20} />
                                                    </button>
                                                    <button
                                                        className={`act-btn ${order.toGo ? 'togo-active' : ''}`}
                                                        onClick={() => {
                                                            if (isBundle) bundleItems.forEach(bi => syncBundleAction(table.id, bi, toggleOrderToGo));
                                                            else toggleOrderToGo(table.id, order.id);
                                                        }}
                                                    >
                                                        <ShoppingBag size={20} />
                                                    </button>
                                                    <button className="act-btn btn-addition" onClick={() => setAdditionModal({ isOpen: true, targetOrder: order, searchQuery: '' })}>
                                                        <Plus size={20} />
                                                    </button>
                                                    {order.status === 'new' && (
                                                        <button className="act-btn success" onClick={() => updateOrderStatus(table.id, order.id, 'sent')}>
                                                            <Check size={20} />
                                                        </button>
                                                    )}
                                                    {(order.status === 'sent' || order.status === 'served') && (
                                                        <button
                                                            className={`act-btn success-fill ${order.status === 'served' ? 'disabled' : ''}`}
                                                            onClick={() => updateOrderStatus(table.id, order.id, 'served')}
                                                            disabled={order.status === 'served'}
                                                        >
                                                            <Check size={20} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="order-note-section">
                                                <textarea
                                                    className="order-note-input"
                                                    placeholder="Заметка к блюду..."
                                                    value={order.note || ''}
                                                    onChange={(e) => updateOrderNote(table.id, order.id, e.target.value)}
                                                />
                                            </div>

                                            {/* Upsell chips */}
                                            {order.status !== 'served' && (() => {
                                                const rules = getUpsellsForOrder(order, upsellSettings);
                                                if (!rules.length) return null;
                                                const allRecs = rules.flatMap(r => r.recommendations);
                                                return (
                                                    <div className="upsell-chips-row">
                                                        {allRecs.map((rec, i) => {
                                                            const isDouble = rec.name === 'Двойная порция';
                                                            const alreadyAdded = !isDouble && table.orders.some(o => o.name === rec.name);
                                                            return (
                                                                <button
                                                                    key={i}
                                                                    className={`upsell-chip ${alreadyAdded ? 'upsell-chip--added' : ''}`}
                                                                    onClick={() => {
                                                                        if (alreadyAdded) return;
                                                                        if (isDouble) {
                                                                            updateOrderQuantity(table.id, order.id, 1);
                                                                            return;
                                                                        }
                                                                        const found = dishes.find(d => d.name.toLowerCase() === rec.name.toLowerCase());
                                                                        if (found) {
                                                                            addOrderToTable(table.id, found);
                                                                        } else {
                                                                            addOrderToTable(table.id, {
                                                                                id: `upsell_${Date.now()}_${i}`,
                                                                                name: rec.name,
                                                                                price: rec.price || 0,
                                                                                code: '-',
                                                                                category: 'Добавки',
                                                                                image: '',
                                                                            });
                                                                        }
                                                                    }}
                                                                >
                                                                    {alreadyAdded ? '✓ ' : '+ '}{rec.name}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                );
                                            })()}
                                        </Card>
                                    </div>
                                ))}
                            </div>
                        );

                        if (isDragMode) {
                            return (
                                <SortableItem key={itemKey} id={itemKey}>
                                    {() => bundleContent()}
                                </SortableItem>
                            );
                        }
                        return <React.Fragment key={itemKey}>{bundleContent()}</React.Fragment>;
                    });

                    if (isDragMode) {
                        return (
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                <SortableContext items={logicalKeys} strategy={verticalListSortingStrategy}>
                                    {groupedOrders.map(group => (
                                        <div key={group.name ?? 'unsorted'} className="order-group">
                                            {group.name && (
                                                <div className="category-header">
                                                    <span className="cat-line"></span>
                                                    <h4>{group.name}</h4>
                                                    <span className="cat-line"></span>
                                                </div>
                                            )}
                                            {renderGroup(group)}
                                        </div>
                                    ))}
                                </SortableContext>
                            </DndContext>
                        );
                    }

                    return groupedOrders.map(group => (
                        <div key={group.name ?? 'unsorted'} className="order-group">
                            {group.name && (
                                <div className="category-header">
                                    <span className="cat-line"></span>
                                    <h4>{group.name}</h4>
                                    <span className="cat-line"></span>
                                </div>
                            )}
                            {renderGroup(group)}
                        </div>
                    ));
                })()}
            </div>

            {/* Image Zoom Modal */}
            {zoomImage && (
                <div className="zoom-overlay" onClick={() => setZoomImage(null)}>
                    {zoomImage.src === '__placeholder__' ? (
                        <div className="zoom-placeholder">
                            <GlassWater size={64} />
                            <span>Фото недоступно</span>
                        </div>
                    ) : (
                        <img src={zoomImage.src.startsWith('http') ? zoomImage.src : window.location.origin + '/' + zoomImage.src} alt="Zoom" className="zoom-img" />
                    )}
                    <button
                        className="zoom-details-btn"
                        onClick={e => { e.stopPropagation(); setDishDetailModal(zoomImage.order); setZoomImage(null); }}
                    >
                        Подробнее
                    </button>
                    <button className="zoom-close" onClick={() => setZoomImage(null)}>×</button>
                </div>
            )}

            {/* Dish Detail Modal */}
            {dishDetailModal && (() => {
                const dbDish = dishes.find(d => d.id === dishDetailModal.dishId);
                const raw = dbDish?.raw || {};
                return (
                    <div className="dish-detail-overlay" onClick={() => setDishDetailModal(null)}>
                        <div className="dish-detail-sheet" onClick={e => e.stopPropagation()}>
                            <button className="dish-detail-close" onClick={() => setDishDetailModal(null)}>×</button>

                            {dishDetailModal.image && !dishDetailModal.image.includes('-.jpg') && !dishDetailModal.image.includes('images/-') ? (
                                <div className="dish-detail-hero-img-wrap">
                                    <img
                                        src={dishDetailModal.image.startsWith('http') ? dishDetailModal.image : window.location.origin + '/' + dishDetailModal.image}
                                        alt={dishDetailModal.name}
                                        className="dish-detail-hero-img"
                                    />
                                </div>
                            ) : (
                                <div className="dish-detail-hero-placeholder-sheet">
                                    <GlassWater size={48} />
                                </div>
                            )}

                            <div className="dish-detail-sheet-body">
                                <div className="dish-detail-sheet-title-row">
                                    <h2 className="dish-detail-sheet-name">{dishDetailModal.name}</h2>
                                    <span className="dish-detail-sheet-price">{dishDetailModal.price}<br /><span className="dish-detail-sheet-rub">рублей</span></span>
                                </div>

                                {dishDetailModal.category && (
                                    <div className="dish-detail-info-block bordered">
                                        <span className="dish-detail-info-label">КАТЕГОРИЯ:</span>
                                        <span className="dish-detail-info-value">{dishDetailModal.category}</span>
                                    </div>
                                )}

                                {(raw.gramm || raw.kbju) && (
                                    <div className="dish-detail-info-block dish-detail-row">
                                        {raw.gramm && (
                                            <div className="dish-detail-col">
                                                <span className="dish-detail-info-label">ВЕС:</span>
                                                <span className="dish-detail-info-value plain">{raw.gramm}</span>
                                            </div>
                                        )}
                                        {raw.kbju && (
                                            <div className="dish-detail-col">
                                                <span className="dish-detail-info-label">КБЖУ:</span>
                                                <span className="dish-detail-info-value plain">{raw.kbju}</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {raw.composition && raw.composition.length > 0 && (
                                    <div className="dish-detail-info-block">
                                        <span className="dish-detail-info-label">СОСТАВ:</span>
                                        <span className="dish-detail-info-value plain">{raw.composition.join(', ')}</span>
                                    </div>
                                )}

                                {raw.allergens && raw.allergens.length > 0 && (
                                    <div className="dish-detail-info-block">
                                        <span className="dish-detail-info-label">АЛЛЕРГЕНЫ:</span>
                                        <div className="dish-detail-allergens">
                                            {raw.allergens.map((a, i) => (
                                                <span key={i} className="allergen-chip-sheet">{a}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Composition Modal (Exclusions) */}
            {compositionModal.isOpen && compositionModal.order && (
                <Modal
                    isOpen={true}
                    onClose={() => setCompositionModal({ isOpen: false, order: null })}
                    title="Убрать ингредиент"
                >
                    <div className="composition-list">
                        {(dishes.find(d => d.id === compositionModal.order.dishId)?.composition || []).map((ingredient, idx) => (
                            <div key={idx} className="ingredient-item">
                                <span>{ingredient}</span>
                                <Button variant="secondary" size="sm" onClick={() => {
                                    const currentNote = compositionModal.order.note || '';
                                    const newNote = currentNote.includes(`БЕЗ ${ingredient}`)
                                        ? currentNote.replace(`БЕЗ ${ingredient}`, '').trim()
                                        : `${currentNote} БЕЗ ${ingredient}`.trim();
                                    updateOrderNote(table.id, compositionModal.order.id, newNote);
                                    setCompositionModal({ isOpen: false, order: null });
                                }}>Убрать</Button>
                            </div>
                        ))}
                    </div>
                </Modal>
            )}

            {/* Upsell Modal */}
            {upsellModal.isOpen && upsellModal.dish && (
                <Modal
                    isOpen={true}
                    onClose={() => setUpsellModal({ isOpen: false, dish: null, currentStep: 0, selections: [] })}
                    title={upsellChains[upsellModal.dish.upsell].steps[upsellModal.currentStep].title}
                >
                    {upsellChains[upsellModal.dish.upsell].steps[upsellModal.currentStep].type === 'sauce' && (
                        <>
                            <div className="sauce-hero-wrapper">
                                <img src={`${window.location.origin}/Pictures/menu/Соусы/Соусы.jpg?v=${Date.now()}`} alt="Наши соусы" className="sauce-hero-img" />
                            </div>
                            <div className="sauce-price-badge">Все соусы по 70 ₽</div>
                        </>
                    )}
                    <div className={
                        upsellChains[upsellModal.dish.upsell].steps[upsellModal.currentStep].type === 'doneness' ? "doneness-grid" :
                            upsellChains[upsellModal.dish.upsell].steps[upsellModal.currentStep].type === 'garnish' ? "garnish-list" :
                                "upsell-options compact"
                    }>
                        {upsellChains[upsellModal.dish.upsell].steps[upsellModal.currentStep].options.map((opt, i) => {
                            const stepType = upsellChains[upsellModal.dish.upsell].steps[upsellModal.currentStep].type;

                            if (stepType === 'doneness') {
                                return (
                                    <div key={opt.name} className="doneness-card" onClick={() => handleUpsellSelection({ ...opt, type: 'doneness' })}>
                                        <div className="doneness-img-wrapper">
                                            <img src={window.location.origin + '/' + opt.image} alt={opt.name} />
                                        </div>
                                        <div className="doneness-info">
                                            <div className="doneness-header">
                                                <span className="doneness-name">{opt.name}</span>
                                                <span className="doneness-temp">{opt.temp}</span>
                                            </div>
                                            <div className="doneness-tip">{opt.tip}</div>
                                        </div>
                                    </div>
                                );
                            } else if (stepType === 'garnish') {
                                return (
                                    <div key={i} className="garnish-card" onClick={() => handleUpsellSelection({ ...opt, type: 'garnish' })}>
                                        <div className="garnish-img-wrapper">
                                            <img src={window.location.origin + '/' + opt.image} alt={opt.name} />
                                        </div>
                                        <div className="garnish-info">
                                            <span className="garnish-name">{opt.name}</span>
                                        </div>
                                    </div>
                                );
                            } else {
                                return (
                                    <Button
                                        key={i}
                                        variant="secondary"
                                        fullWidth
                                        className={`upsell-btn ${i < 4 && stepType === 'sauce' ? 'popular-sauce' : ''}`}
                                        onClick={() => handleUpsellSelection({ ...opt, type: stepType })}
                                    >
                                        <div className="upsell-btn-content">
                                            <div className="upsell-btn-main">
                                                <span className="upsell-btn-name">{opt.name}</span>
                                            </div>
                                            {opt.desc && <div className="upsell-btn-desc">{opt.desc}</div>}
                                        </div>
                                    </Button>
                                );
                            }
                        })}
                    </div>
                    {upsellChains[upsellModal.dish.upsell].steps[upsellModal.currentStep].type !== 'doneness' &&
                        (!upsellModal.dish.mandatorySauce || upsellChains[upsellModal.dish.upsell].steps[upsellModal.currentStep].type !== 'sauce') && (
                            <Button variant="ghost" fullWidth onClick={skipUpsell} className="skip-btn" style={{ marginTop: '16px' }}>
                                {upsellModal.currentStep < upsellChains[upsellModal.dish.upsell].steps.length - 1 ? 'Пропустить шаг' : 'Завершить выбор'}
                            </Button>
                        )}
                </Modal>
            )}
            {/* Premium Confirm Modal */}
            {confirmDialog.isOpen && (
                <div className="confirm-overlay" onClick={() => setConfirmDialog(p => ({ ...p, isOpen: false }))}>
                    <div className="confirm-modal glass-panel" onClick={e => e.stopPropagation()}>
                        <div className="confirm-header">
                            <h3>{confirmDialog.title}</h3>
                        </div>
                        <div className="confirm-body">
                            <p>{confirmDialog.message}</p>
                        </div>
                        <div className="confirm-footer">
                            <button
                                className="confirm-btn cancel"
                                onClick={() => setConfirmDialog(p => ({ ...p, isOpen: false }))}
                            >
                                Отмена
                            </button>
                            <button
                                className="confirm-btn confirm"
                                onClick={() => {
                                    confirmDialog.onConfirm();
                                    setConfirmDialog(p => ({ ...p, isOpen: false }));
                                }}
                            >
                                Подтвердить
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Addition Modal (In One Plate) */}
            <Modal
                isOpen={additionModal.isOpen}
                onClose={() => setAdditionModal({ isOpen: false, targetOrder: null, searchQuery: '' })}
                title={`В одну тарелку: ${additionModal.targetOrder?.name}`}
            >
                <div className="addition-modal-content">
                    <Input
                        icon
                        placeholder="Поиск блюда для добавки..."
                        value={additionModal.searchQuery}
                        onChange={(e) => setAdditionModal({ ...additionModal, searchQuery: e.target.value })}
                        autoFocus
                    />
                    <div className="addition-results">
                        {(additionModal.searchQuery.trim() ? dishes.filter(d =>
                            d.name.toLowerCase().includes(additionModal.searchQuery.toLowerCase()) ||
                            d.code.includes(additionModal.searchQuery)
                        ) : dishes.slice(0, 15)).map((dish, idx) => (
                            <div
                                key={dish.id || idx}
                                className="addition-item"
                                onClick={() => {
                                    addModifierToOrder(table.id, additionModal.targetOrder, dish);
                                    setAdditionModal({ isOpen: false, targetOrder: null, searchQuery: '' });
                                }}
                            >
                                <div className="addition-item-info">
                                    <span className="addition-item-name">{dish.name}</span>
                                    <span className="addition-item-code">{dish.code}</span>
                                </div>
                                <span className="addition-item-price">{dish.price} ₽</span>
                            </div>
                        ))}
                    </div>
                </div>
            </Modal>

        </div>
    );
}
