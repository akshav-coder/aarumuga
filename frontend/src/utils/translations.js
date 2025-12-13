import { en } from '../locales/en';
import { ta } from '../locales/ta';

const translations = {
  en,
  ta,
};

export const getTranslation = (language, key) => {
  return translations[language]?.[key] || key;
};

export default translations;

