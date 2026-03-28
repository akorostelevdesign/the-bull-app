import React, { createContext, useContext, useState, useEffect } from 'react';

const OrderContext = createContext();

const getCourseWeight = (category) => {
    if (!category) return 10;
    const cat = category.toUpperCase();
    if (cat.includes('НАПИТКИ') || cat.includes('ПИВО') || cat.includes('БАР') || cat.includes('КОКТЕЙЛЬ') || cat.includes('ВИНТ')) return 0;
    if (cat.includes('ХЛЕБ')) return 11;
    if (cat.includes('ХОЛОДНЫЕ ЗАКУСКИ') || cat.includes('ХОЛОДНАЯ ЗАКУСКА')) return 12;
    if (cat.includes('ГОРЯЧИЕ ЗАКУСКИ') || cat.includes('ГОРЯЧАЯ ЗАКУСКА')) return 13;
    if (cat.includes('ХОЛОДНЫЕ САЛАТЫ') || cat.includes('ХОЛОДНЫЙ САЛАТ')) return 14;
    if (cat.includes('ТЕПЛЫЕ САЛАТЫ') || cat.includes('ТЁПЛЫЕ САЛАТЫ') || cat.includes('ТЕПЛЫЙ САЛАТ')) return 15;
    if (cat.includes('ЗАКУСК') || cat.includes('САЛАТ')) return 16;
    if (cat.includes('СУП')) return 20;
    if (cat.includes('РЫБА')) return 31;
    if (cat.includes('МЯСО') || cat.includes('СТЕЙК') || cat.includes('БУРГЕР')) return 32;
    if (cat.includes('ПТИЦА') || cat.includes('КУРИЦА')) return 33;
    if (cat.includes('ГАРНИР') || cat.includes('ОВОЩИ')) return 34;
    if (cat.includes('ГОРЯЧЕЕ') || cat.includes('ОСНОВНОЕ')) return 35;
    if (cat.includes('ДЕСЕРТ')) return 40;
    return 50;
};

const getMonthKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const emptyMonthStats = () => ({ revenue: 0, tables: 0, dishes: {} });

export function OrderProvider({ children }) {
    const [tables, setTables] = useState(() => {
        const saved = localStorage.getItem('bull_tables');
        return saved ? JSON.parse(saved) : [];
    });

    const [stopList, setStopList] = useState(() => {
        const saved = localStorage.getItem('bull_stoplist');
        return saved ? JSON.parse(saved) : [];
    });

    const [courseSettings, setCourseSettings] = useState(() => {
        const saved = localStorage.getItem('bull_course_settings');
        if (saved) {
            const parsed = JSON.parse(saved);
            // Миграция старых значений mode
            if (parsed.mode === 'buttons') {
                parsed.mode = 'manual';
                parsed.manualType = 'buttons';
            } else if (parsed.mode === 'drag') {
                parsed.mode = 'manual';
                parsed.manualType = 'drag';
            }
            if (!parsed.manualType) parsed.manualType = 'buttons';
            return parsed;
        }
        return {
            mode: 'auto',
            manualType: 'buttons',
            courses: { 0: true, 1: true, 2: true, 3: true, 4: true }
        };
    });

    // Stats: { [monthKey]: { revenue, tables, dishes: { [name]: count } } }
    const [allStats, setAllStats] = useState(() => {
        const saved = localStorage.getItem('bull_stats');
        return saved ? JSON.parse(saved) : {};
    });

    // Table history: array of { id, name, closedAt, orders: [{name, quantity, price}], total }
    const [tableHistory, setTableHistory] = useState(() => {
        const saved = localStorage.getItem('bull_table_history');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => { localStorage.setItem('bull_course_settings', JSON.stringify(courseSettings)); }, [courseSettings]);
    useEffect(() => { localStorage.setItem('bull_tables', JSON.stringify(tables)); }, [tables]);
    useEffect(() => { localStorage.setItem('bull_stoplist', JSON.stringify(stopList)); }, [stopList]);
    useEffect(() => { localStorage.setItem('bull_stats', JSON.stringify(allStats)); }, [allStats]);
    useEffect(() => { localStorage.setItem('bull_table_history', JSON.stringify(tableHistory)); }, [tableHistory]);

    const monthKey = getMonthKey();
    const stats = allStats[monthKey] || emptyMonthStats();

    // Record table close (clear or delete) into stats + history
    const recordTableClose = (table) => {
        if (!table || !table.orders.length) return;

        const total = table.orders.reduce((sum, o) => sum + (o.price * o.quantity), 0);

        // Save to history
        const historyEntry = {
            id: Date.now().toString(),
            tableName: table.name,
            closedAt: new Date().toISOString(),
            orders: table.orders.map(o => ({ name: o.name, quantity: o.quantity, price: o.price })),
            total
        };
        setTableHistory(prev => [historyEntry, ...prev].slice(0, 200)); // keep last 200

        // Update monthly stats
        setAllStats(prev => {
            const key = getMonthKey();
            const month = prev[key] || emptyMonthStats();
            return {
                ...prev,
                [key]: {
                    revenue: month.revenue + total,
                    tables: month.tables + 1,
                    dishes: month.dishes
                }
            };
        });
    };

    // Record dish sent (галочка → В R-keeper) for top dishes
    const recordDishSent = (dishName) => {
        setAllStats(prev => {
            const key = getMonthKey();
            const month = prev[key] || emptyMonthStats();
            const dishes = { ...month.dishes, [dishName]: (month.dishes[dishName] || 0) + 1 };
            return { ...prev, [key]: { ...month, dishes } };
        });
    };

    const resetMonthStats = () => {
        setAllStats(prev => ({ ...prev, [getMonthKey()]: emptyMonthStats() }));
    };

    // Table management
    const addTable = (name) => {
        const newTable = {
            id: Date.now().toString(),
            name,
            createdAt: new Date().toISOString(),
            orders: []
        };
        setTables(prev => [...prev, newTable]);
        return newTable.id;
    };

    const removeTable = (id) => {
        const table = tables.find(t => t.id === id);
        if (table) recordTableClose(table);
        setTables(prev => prev.filter(t => t.id !== id));
    };

    const updateTable = (id, newName) => {
        setTables(prev => prev.map(t => t.id === id ? { ...t, name: newName } : t));
    };

    // Order management
    const addOrderToTable = (tableId, dishes, quantity = 1, bundleId = null) => {
        const dishesArray = Array.isArray(dishes) ? dishes : [dishes];
        const effectiveBundleId = bundleId || (dishesArray.length > 1 ? `bundle_${Date.now()}` : null);

        setTables(prev => prev.map(t => {
            if (t.id === tableId) {
                const newOrders = dishesArray.map(dish => ({
                    id: (Date.now() + Math.random()).toString(),
                    dishId: dish.id,
                    name: dish.name,
                    price: typeof dish.price === 'string' ? parseInt(dish.price) : (dish.price || 0),
                    quantity,
                    category: dish.category,
                    image: dish.image,
                    code: dish.R_keeper || dish.code,
                    status: 'new',
                    toGo: false,
                    note: '',
                    doneness: dish.doneness || null,
                    bundleId: effectiveBundleId
                }));
                return { ...t, orders: [...t.orders, ...newOrders] };
            }
            return t;
        }));
    };

    const updateOrderStatus = (tableId, orderId, status) => {
        setTables(prev => prev.map(t => {
            if (t.id !== tableId) return t;

            const order = t.orders.find(o => o.id === orderId);
            if (!order) return t;
            if (order.status === 'served' && status !== 'served') return t;

            const movingIds = order.bundleId
                ? t.orders.filter(o => o.bundleId === order.bundleId).map(o => o.id)
                : [orderId];

            // Record dish sent for top dishes stat
            if (status === 'sent') {
                t.orders.filter(o => movingIds.includes(o.id)).forEach(o => {
                    recordDishSent(o.name);
                });
            }

            const updatedOrders = t.orders.map(o =>
                movingIds.includes(o.id) ? { ...o, status } : o
            );

            if (status === 'sent' || status === 'served') {
                const staying = updatedOrders.filter(o => !movingIds.includes(o.id));
                const moving = updatedOrders.filter(o => movingIds.includes(o.id));
                return { ...t, orders: [...staying, ...moving] };
            }

            return { ...t, orders: updatedOrders };
        }));
    };

    const updateOrderNote = (tableId, orderId, note) => {
        setTables(prev => prev.map(t => {
            if (t.id === tableId) {
                return { ...t, orders: t.orders.map(o => o.id === orderId ? { ...o, note } : o) };
            }
            return t;
        }));
    };

    const toggleOrderToGo = (tableId, orderId) => {
        setTables(prev => prev.map(t => {
            if (t.id === tableId) {
                return { ...t, orders: t.orders.map(o => o.id === orderId ? { ...o, toGo: !o.toGo } : o) };
            }
            return t;
        }));
    };

    const updateOrderQuantity = (tableId, orderId, delta) => {
        setTables(prev => prev.map(t => {
            if (t.id === tableId) {
                return {
                    ...t,
                    orders: t.orders.map(o => {
                        if (o.id === orderId) {
                            const newQ = Math.max(1, o.quantity + delta);
                            return { ...o, quantity: newQ };
                        }
                        return o;
                    })
                };
            }
            return t;
        }));
    };

    const removeOrder = (tableId, orderId) => {
        setTables(prev => prev.map(t => {
            if (t.id === tableId) {
                return { ...t, orders: t.orders.filter(o => o.id !== orderId) };
            }
            return t;
        }));
    };

    const addModifierToOrder = (tableId, targetOrder, dish) => {
        const bundleId = targetOrder.bundleId || `bundle_${Date.now()}`;
        setTables(prev => prev.map(t => {
            if (t.id === tableId) {
                const updatedOrders = t.orders.map(o =>
                    o.id === targetOrder.id ? { ...o, bundleId } : o
                );
                const newOrder = {
                    id: (Date.now() + Math.random()).toString(),
                    dishId: dish.id,
                    name: dish.name,
                    price: typeof dish.price === 'string' ? parseInt(dish.price) : (dish.price || 0),
                    image: dish.image,
                    category: dish.category,
                    code: dish.R_keeper || dish.code,
                    quantity: targetOrder.quantity,
                    status: targetOrder.status,
                    toGo: targetOrder.toGo,
                    note: '',
                    bundleId
                };
                return { ...t, orders: [...updatedOrders, newOrder] };
            }
            return t;
        }));
    };

    const clearTable = (tableId) => {
        const table = tables.find(t => t.id === tableId);
        if (table) recordTableClose(table);
        setTables(prev => prev.map(t => t.id === tableId ? { ...t, orders: [] } : t));
    };

    // Ручная перестановка — принимает новый массив orders (уже переупорядоченный)
    const reorderTableOrders = (tableId, newOrders) => {
        setTables(prev => prev.map(t => t.id === tableId ? { ...t, orders: newOrders } : t));
    };

    const sortTableOrders = (tableId) => {
        setTables(prev => prev.map(t => {
            if (t.id !== tableId) return t;
            const sorted = [...t.orders].sort((a, b) => {
                const aBottom = a.status === 'sent' || a.status === 'served' ? 1 : 0;
                const bBottom = b.status === 'sent' || b.status === 'served' ? 1 : 0;
                if (aBottom !== bBottom) return aBottom - bBottom;
                return getCourseWeight(a.category) - getCourseWeight(b.category);
            });
            return { ...t, orders: sorted };
        }));
    };

    const toggleStopList = (dishId) => {
        setStopList(prev =>
            prev.includes(dishId) ? prev.filter(id => id !== dishId) : [...prev, dishId]
        );
    };

    const clearStopList = () => setStopList([]);

    const updateCourseSettings = (newSettings) => {
        setCourseSettings(prev => ({ ...prev, ...newSettings }));
    };

    return (
        <OrderContext.Provider value={{
            tables,
            stopList,
            addTable,
            removeTable,
            updateTable,
            addOrderToTable,
            updateOrderStatus,
            updateOrderNote,
            toggleOrderToGo,
            updateOrderQuantity,
            addModifierToOrder,
            removeOrder,
            clearTable,
            toggleStopList,
            clearStopList,
            courseSettings,
            updateCourseSettings,
            sortTableOrders,
            reorderTableOrders,
            stats,
            tableHistory,
            resetMonthStats
        }}>
            {children}
        </OrderContext.Provider>
    );
}

export const useOrder = () => useContext(OrderContext);
