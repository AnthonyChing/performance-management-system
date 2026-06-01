import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import zhTWProfile from './locales/zh-TW/profile.json';
import zhTWPerformance from './locales/zh-TW/performance.json';
import zhTWDispute from './locales/zh-TW/dispute.json';
import zhTWGoals from './locales/zh-TW/goals.json';
import zhTWLayout from './locales/zh-TW/layout.json';

import enProfile from './locales/en/profile.json';
import enPerformance from './locales/en/performance.json';
import enDispute from './locales/en/dispute.json';
import enGoals from './locales/en/goals.json';
import enLayout from './locales/en/layout.json';

i18n.use(initReactI18next).init({
  resources: {
    'zh-TW': {
      profile: zhTWProfile,
      performance: zhTWPerformance,
      dispute: zhTWDispute,
      goals: zhTWGoals,
      layout: zhTWLayout,
    },
    en: {
      profile: enProfile,
      performance: enPerformance,
      dispute: enDispute,
      goals: enGoals,
      layout: enLayout,
    },
  },
  lng: localStorage.getItem('language') ?? 'zh-TW',
  fallbackLng: 'zh-TW',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
