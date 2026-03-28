import { useState, useEffect } from 'react';
import { UPSELL_RULES } from '../data/upsell-rules';

const STORAGE_KEY = 'upsell-settings';

function getDefaults() {
  return UPSELL_RULES.reduce((acc, rule) => {
    acc[rule.id] = true;
    return acc;
  }, {});
}

export function useUpsellSettings() {
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults — ignore stale keys, add new ones
        const defaults = getDefaults();
        const merged = { ...defaults };
        Object.keys(defaults).forEach(id => {
          if (parsed[id] !== undefined) merged[id] = parsed[id];
        });
        return merged;
      }
    } catch (_) {}
    return getDefaults();
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const toggle = (ruleId) => {
    setSettings(prev => ({ ...prev, [ruleId]: !prev[ruleId] }));
  };

  return { settings, toggle };
}
