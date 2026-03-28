/**
 * System for portioned content unlocking.
 * Distributes learning materials over a specified number of days.
 */

const KITCHEN_CATEGORIES = [
  "Альтернативные стейки", "Закуски", "Салат", "Римская пицца",
  "Бургеры", "Хоспер", "Прайм", "Супы", "Десерты", 
  "Гарниры", "Хлеб", "Сеты", "Соусы", "Разное"
];

const BAR_CATEGORIES = [
  "НАПИТКИ", "ГАЗ. НАПИТКИ", "ПИВО", "ЛИМОНАДЫ", "ЧАЙ", "КОФЕ", 
  "КОФЕ НА АЛЬТЕРНАТИВНОМ МОЛОКЕ", "БАБЛ ТИ", 
  "ИГРИСТОЕ БРЮТ / SPARKLING BRUT", "SPLIT BOTTLE", 
  "БЕЛОЕ / WHITE", "КРАСНОЕ/RED"
];

const KNOWLEDGE_TOPICS = [
  "grain_vs_grass", "doneness", "last_latte", "sales_methods", 
  "ovuzh", "sales_killers", "marbling", "aging", "breed", "truth_or_myth"
];

/**
 * Distributes items from an array over N days.
 * @param {Array} items - List of item IDs/names
 * @param {number} totalDays - Duration of the plan (e.g., 7, 14, 30, 45)
 * @param {number} startDay - On which day to start releasing these items
 * @param {number} endDay - By which day all items must be released
 * @returns {Object} Map of dayIndex -> Array of new items unlocked on that day
 */
function distributeItems(items, totalDays, startDay, endDay) {
  const schedule = {};
  const duration = endDay - startDay + 1;
  const itemsPerDay = Math.ceil(items.length / duration);

  let currentItemIdx = 0;
  for (let d = 1; d <= totalDays; d++) {
    schedule[d] = [];
    if (d >= startDay && d <= endDay) {
      const dailyCount = (d === endDay) ? items.length - currentItemIdx : itemsPerDay;
      for (let i = 0; i < dailyCount && currentItemIdx < items.length; i++) {
        schedule[d].push(items[currentItemIdx++]);
      }
    }
  }
  return schedule;
}

/**
 * Returns the full schedule for a given plan duration.
 */
export function getSchedule(planDays = 7) {
  // Service is always Day 1
  const serviceUnlocked = { 1: true };

  // Kitchen starts Day 2, ends around Day totalDays/2
  const kitchenEnd = Math.max(2, Math.floor(planDays * 0.6));
  const kitchenDistribution = distributeItems(KITCHEN_CATEGORIES, planDays, 2, kitchenEnd);

  // Bar starts after Kitchen starts, ends around Day totalDays
  const barStart = Math.min(planDays, Math.floor(planDays * 0.4) + 1);
  const barEnd = planDays;
  const barDistribution = distributeItems(BAR_CATEGORIES, planDays, barStart, barEnd);

  // Knowledge starts after Bar starts (delay of 1-3 days)
  const knowledgeStartDelay = planDays <= 7 ? 1 : planDays <= 14 ? 2 : 3;
  const knowledgeStart = Math.min(planDays, barStart + knowledgeStartDelay);
  const knowledgeDistribution = distributeItems(KNOWLEDGE_TOPICS, planDays, knowledgeStart, planDays);

  const fullSchedule = {};
  const unlockedSoFar = {
    service: false,
    kitchenCategories: [],
    barCategories: [],
    knowledgeTopics: []
  };

  for (let d = 1; d <= planDays; d++) {
    if (d === 1) unlockedSoFar.service = true;
    
    unlockedSoFar.kitchenCategories = [
      ...new Set([...unlockedSoFar.kitchenCategories, ...(kitchenDistribution[d] || [])])
    ];
    unlockedSoFar.barCategories = [
      ...new Set([...unlockedSoFar.barCategories, ...(barDistribution[d] || [])])
    ];
    unlockedSoFar.knowledgeTopics = [
      ...new Set([...unlockedSoFar.knowledgeTopics, ...(knowledgeDistribution[d] || [])])
    ];

    fullSchedule[d] = JSON.parse(JSON.stringify(unlockedSoFar));
  }

  return fullSchedule;
}

/**
 * Helper to check if content is unlocked for a user
 */
export function isUnlocked(dayIndex, planDays, type, id) {
  const schedule = getSchedule(planDays);
  const day = Math.min(dayIndex, planDays);
  const current = schedule[day];

  if (!current) return false;

  switch (type) {
    case 'section':
      if (id === 'service') return current.service;
      if (id === 'kitchen') return current.kitchenCategories.length > 0;
      if (id === 'bar') return current.barCategories.length > 0;
      if (id === 'knowledge') return current.knowledgeTopics.length > 0;
      if (id === 'upsell') return true; // Upsell is usually mastery based
      return false;
    case 'kitchenCategory':
      return current.kitchenCategories.includes(id);
    case 'barCategory':
      return current.barCategories.includes(id);
    case 'knowledgeTopic':
      return current.knowledgeTopics.includes(id);
    default:
      return false;
  }
}
