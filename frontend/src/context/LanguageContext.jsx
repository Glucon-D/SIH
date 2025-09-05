import { createContext, useContext, useState, useEffect } from 'react';
import { i18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';

const LanguageContext = createContext();

const languages = {
  en: { label: 'English', flag: '🇺🇸' },
  hi: { label: 'हिंदी', flag: '🇮🇳' },
  ml: { label: 'മലയാളം', flag: '🇮🇳' },
};

export const LanguageProvider = ({ children }) => {
  const [locale, setLocale] = useState(() => {
    const saved = localStorage.getItem('preferred-language');
    return saved && languages[saved] ? saved : 'en';
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadLocale = async () => {
      setIsLoading(true);
      try {
        const { messages } = await import(`../locales/${locale}/messages.mjs`);
        i18n.load(locale, messages);
        i18n.activate(locale);
        localStorage.setItem('preferred-language', locale);
      } catch {
        console.warn(`Failed to load locale ${locale}, falling back to en`);
        const { messages } = await import('../locales/en/messages.mjs');
        i18n.load('en', messages);
        i18n.activate('en');
        setLocale('en');
      }
      setIsLoading(false);
    };

    loadLocale();
  }, [locale]);

  const changeLanguage = (newLocale) => {
    if (languages[newLocale]) {
      setLocale(newLocale);
    }
  };

  const value = {
    locale,
    languages,
    changeLanguage,
    isLoading,
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <LanguageContext.Provider value={value}>
      <I18nProvider i18n={i18n}>
        {children}
      </I18nProvider>
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};