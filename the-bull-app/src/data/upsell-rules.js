// Правила допродаж
// trigger: { type: 'category' | 'name', value: string | string[] }
// recommendations: [{ name, price? }]

export const UPSELL_RULES = [
  {
    id: 'steaks-prime',
    label: 'Прайм стейки',
    trigger: { type: 'category', value: 'Прайм' },
    recommendations: [
      { name: 'Мальбек' },
      { name: 'Каберне Совиньон' },
    ],
  },
  {
    id: 'steaks-alt',
    label: 'Альтернативные стейки',
    trigger: { type: 'category', value: 'Альтернативные стейки' },
    recommendations: [
      { name: 'Мальбек' },
      { name: 'Каберне Совиньон' },
    ],
  },
  {
    id: 'vitello',
    label: 'Вителло тоннато',
    trigger: { type: 'name', value: 'Вителло тоннато' },
    recommendations: [
      { name: 'Фокачча с розмарином' },
    ],
  },
  {
    id: 'tartar',
    label: 'Тартар из говядины',
    trigger: { type: 'name', value: 'Тартар из говядины' },
    recommendations: [
      { name: 'Яйцо перепелиное' },
      { name: 'Гренки' },
      { name: 'Чипсы из бекона' },
    ],
  },
  {
    id: 'cocktails',
    label: 'Коктейли',
    trigger: { type: 'category', value: 'КОКТЕЙЛИ' },
    recommendations: [
      { name: 'Двойная порция' },
    ],
  },
  {
    id: 'tea',
    label: 'Чай',
    trigger: { type: 'category', value: 'ЧАЙ' },
    recommendations: [
      { name: 'Мёд' },
      { name: 'Мята' },
      { name: 'Чабрец' },
      { name: 'Сахар' },
      { name: 'Лимон' },
    ],
  },
  {
    id: 'beer',
    label: 'Пиво',
    trigger: { type: 'category', value: 'ПИВО' },
    recommendations: [
      { name: 'Чесночные гренки' },
      { name: 'Крылья куриные' },
      { name: 'Куриные стрипсы' },
    ],
  },
  {
    id: 'burgers',
    label: 'Бургеры',
    trigger: { type: 'category', value: 'Бургеры' },
    recommendations: [
      { name: 'Картофель фри' },
      { name: 'EVERVESS КОЛА' },
    ],
  },
  {
    id: 'desserts',
    label: 'Десерты',
    trigger: { type: 'category', value: 'Десерты' },
    recommendations: [
      { name: 'Американо' },
      { name: 'Капучино' },
      { name: 'Чай черный' },
    ],
  },
];

/**
 * Returns matching upsell rules for a given dish order.
 * @param {Object} order - order item with { name, category }
 * @param {Object} settings - { [ruleId]: boolean }
 * @returns {Array} array of matching active rules
 */
export function getUpsellsForOrder(order, settings) {
  return UPSELL_RULES.filter(rule => {
    // Skip disabled rules
    if (settings[rule.id] === false) return false;

    const { type, value } = rule.trigger;
    if (type === 'name') {
      return order.name?.toLowerCase() === value.toLowerCase();
    }
    if (type === 'category') {
      return order.category?.toUpperCase().includes(value.toUpperCase());
    }
    return false;
  });
}
