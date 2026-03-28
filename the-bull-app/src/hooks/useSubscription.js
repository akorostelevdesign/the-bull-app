import { useState, useEffect, useCallback, useMemo } from 'react';

/**
 * Subscription tiers and their features
 */
const SUBSCRIPTION_TIERS = {
  basic: {
    name: 'Basic',
    price: 500,
    currency: '₽',
    period: 'месяц',
    features: [
      'Доступ к меню',
      'Просмотр блюд',
      'Базовая информация',
    ],
    color: '#95E1D3',
  },
  standard: {
    name: 'Standard',
    price: 750,
    currency: '₽',
    period: 'месяц',
    features: [
      'Всё из Basic',
      'Доступ к обучению',
      'Отслеживание прогресса',
      'Статистика',
    ],
    color: '#FFE66D',
    recommended: true,
  },
  premium: {
    name: 'Premium',
    price: 1000,
    currency: '₽',
    period: 'месяц',
    features: [
      'Всё из Standard',
      'Приоритетная поддержка',
      'Расширенная аналитика',
      'Доступ к премиум материалам',
      'Персональный коучинг',
    ],
    color: '#FF6B6B',
  },
};

/**
 * Feature access matrix
 * Defines which features are available in each tier
 */
const FEATURE_ACCESS = {
  // Menu features
  viewMenu: { basic: true, standard: true, premium: true },
  searchDishes: { basic: true, standard: true, premium: true },
  viewDishDetails: { basic: true, standard: true, premium: true },
  
  // Learning features
  accessLearning: { basic: false, standard: true, premium: true },
  viewProgress: { basic: false, standard: true, premium: true },
  downloadMaterials: { basic: false, standard: false, premium: true },
  
  // Stats features
  viewStats: { basic: false, standard: true, premium: true },
  exportStats: { basic: false, standard: false, premium: true },
  
  // Support features
  prioritySupport: { basic: false, standard: false, premium: true },
  personalCoaching: { basic: false, standard: false, premium: true },
};

/**
 * Subscription system hook
 * Manages user subscription tier and feature access
 */
export function useSubscription() {
  const [subscription, setSubscription] = useState(() => {
    const saved = localStorage.getItem('userSubscription');
    return saved ? JSON.parse(saved) : { tier: 'basic', active: true, expiresAt: null };
  });

  // Save subscription to localStorage
  useEffect(() => {
    localStorage.setItem('userSubscription', JSON.stringify(subscription));
  }, [subscription]);

  /**
   * Check if a feature is available
   */
  const hasFeature = useCallback((featureName) => {
    if (!subscription.active) return false;
    const feature = FEATURE_ACCESS[featureName];
    if (!feature) return false;
    return feature[subscription.tier] === true;
  }, [subscription]);

  /**
   * Check if subscription is expired
   */
  const isExpired = useMemo(() => {
    if (!subscription.expiresAt) return false;
    return new Date(subscription.expiresAt) < new Date();
  }, [subscription.expiresAt]);

  /**
   * Get current tier info
   */
  const tierInfo = useMemo(() => {
    return SUBSCRIPTION_TIERS[subscription.tier] || SUBSCRIPTION_TIERS.basic;
  }, [subscription.tier]);

  /**
   * Upgrade subscription tier
   */
  const upgradeTier = useCallback((newTier) => {
    if (!SUBSCRIPTION_TIERS[newTier]) {
      console.error('Invalid tier:', newTier);
      return false;
    }
    
    // Calculate expiry date (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    setSubscription({
      tier: newTier,
      active: true,
      expiresAt: expiresAt.toISOString(),
    });

    return true;
  }, []);

  /**
   * Cancel subscription
   */
  const cancelSubscription = useCallback(() => {
    setSubscription({
      tier: 'basic',
      active: false,
      expiresAt: new Date().toISOString(),
    });
  }, []);

  /**
   * Reactivate subscription
   */
  const reactivateSubscription = useCallback((tier = 'standard') => {
    upgradeTier(tier);
  }, [upgradeTier]);

  /**
   * Get all available tiers
   */
  const getAllTiers = useCallback(() => {
    return Object.entries(SUBSCRIPTION_TIERS).map(([key, value]) => ({
      id: key,
      ...value,
    }));
  }, []);

  /**
   * Get days remaining in subscription
   */
  const daysRemaining = useMemo(() => {
    if (!subscription.expiresAt) return null;
    const expiryDate = new Date(subscription.expiresAt);
    const today = new Date();
    const diffTime = expiryDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }, [subscription.expiresAt]);

  /**
   * Check if subscription is about to expire (within 7 days)
   */
  const isExpiringSoon = useMemo(() => {
    return daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0;
  }, [daysRemaining]);

  return {
    // State
    subscription,
    tier: subscription.tier,
    isActive: subscription.active && !isExpired,
    isExpired,
    isExpiringSoon,
    daysRemaining,
    tierInfo,

    // Methods
    hasFeature,
    upgradeTier,
    cancelSubscription,
    reactivateSubscription,
    getAllTiers,

    // Constants
    SUBSCRIPTION_TIERS,
    FEATURE_ACCESS,
  };
}

/**
 * Higher-order component to protect features behind subscription
 */
export function withSubscriptionGate(Component, requiredTier = 'standard') {
  return function ProtectedComponent(props) {
    const { tier, hasFeature } = useSubscription();
    const tierHierarchy = { basic: 0, standard: 1, premium: 2 };

    const hasAccess = tierHierarchy[tier] >= tierHierarchy[requiredTier];

    if (!hasAccess) {
      return (
        <div className="subscription-gate">
          <div className="gate-content">
            <h2>🔒 Premium Feature</h2>
            <p>This feature requires a {requiredTier} subscription or higher.</p>
            <button className="upgrade-btn">Upgrade Now</button>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}
