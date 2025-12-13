import { useLanguage } from '../contexts/LanguageContext';
import { getTranslation } from '../utils/translations';

export const useTranslation = () => {
  const { language } = useLanguage();
  
  const t = (key) => {
    return getTranslation(language, key);
  };

  return { t, language };
};

