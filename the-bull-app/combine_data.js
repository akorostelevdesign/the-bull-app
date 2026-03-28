import fs from 'fs';
import path from 'path';

const dataDir = './src/data';
const outputFile = path.join(dataDir, 'db.js');

let dishesRaw = fs.readFileSync(path.join(dataDir, 'dishes-data.js'), 'utf8');
let barRaw = fs.readFileSync(path.join(dataDir, 'bar_drinks.js'), 'utf8');
let extrasRaw = fs.readFileSync(path.join(dataDir, 'extra-dishes-config.js'), 'utf8');

dishesRaw = dishesRaw.replace(/export const .* = |const DISHES_DATA = /, 'const dishesData = ');
barRaw = barRaw.replace(/export const .* = |const BAR_DRINKS_DATA = /, 'const barDrinksData = ');
extrasRaw = extrasRaw.replace(/export const .* = |const EXTRA_DISHES_CONFIG = /, 'const EXTRA_DISHES_CONFIG = ');

// Strip out existing exports/requires because running as a module gets messy
extrasRaw = extrasRaw.replace(/if\s*\(\s*typeof module !== 'undefined'[^]*?}/g, '');
dishesRaw = dishesRaw.replace(/if\s*\(\s*typeof window !== 'undefined'[^]*?}/g, '');
barRaw = barRaw.replace(/if\s*\(\s*typeof window !== 'undefined'[^]*?}/g, '');

const output = `
${extrasRaw}
${dishesRaw}
${barRaw}

export const getAllItems = () => {
  const allDishes = typeof dishesData !== 'undefined' && dishesData.dishes ? dishesData.dishes : [];
  const allBar = typeof barDrinksData !== 'undefined' && barDrinksData.drinks ? barDrinksData.drinks : [];
  
  const formattedDishes = allDishes.map((d, i) => ({
    id: 'dish_' + i,
    name: d.name,
    price: d.price ? parseInt(d.price) : 0,
    code: d.R_keeper || '-',
    category: d.category || 'Блюда',
    isBar: false,
    raw: d,
    upsell: d.name
  }));

  const formattedBar = allBar.map((d, i) => ({
    id: 'bar_' + i,
    name: d.name,
    price: d.price ? parseInt(d.price) : 0,
    code: d.R_keeper || '-',
    category: d.category || 'Бар',
    isBar: true,
    raw: d,
    upsell: d.name
  }));

  return [...formattedDishes, ...formattedBar];
};

export const dishes = getAllItems();
export const upsellChains = typeof EXTRA_DISHES_CONFIG !== 'undefined' && EXTRA_DISHES_CONFIG.quickSelect ? 
    Object.keys(EXTRA_DISHES_CONFIG.quickSelect).reduce((acc, key) => {
      acc[key] = {
        steps: [{
          title: 'Добавки',
          options: EXTRA_DISHES_CONFIG.quickSelect[key].map(optName => {
            const extraObj = EXTRA_DISHES_CONFIG.allExtras.find(e => e.name === optName);
            return {
              name: optName,
              price: extraObj && extraObj.price !== '-' ? parseInt(extraObj.price) : 0
            };
          })
        }]
      };
      return acc;
    }, {}) : {};

export const categories = [
  { id: 'all', name: 'Все' }
];
`;

fs.writeFileSync(outputFile, output);
console.log('Replaced db.js with real data');
