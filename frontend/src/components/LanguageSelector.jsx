import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Globe } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const LanguageSelector = () => {
  const { locale, languages, changeLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleLanguageChange = (newLocale) => {
    changeLanguage(newLocale);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-3 rounded-2xl text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 bg-gray-100/60 dark:bg-gray-800/60 hover:bg-gray-200/80 dark:hover:bg-gray-700/80 transition-all duration-300 group overflow-hidden backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50"
        aria-label="Select language"
      >
        <div className="relative z-10 transform group-hover:scale-110 transition-transform duration-300">
          <Globe className="w-5 h-5" />
        </div>
        <span className="hidden sm:inline text-sm font-medium">
          {languages[locale].flag} {languages[locale].label}
        </span>
        <ChevronDown 
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl py-2 z-50 border border-gray-200/50 dark:border-gray-700/50 animate-in slide-in-from-top-2 duration-200">
          {Object.entries(languages).map(([code, language]) => (
            <button
              key={code}
              onClick={() => handleLanguageChange(code)}
              className={`flex items-center w-full px-4 py-3 text-sm font-medium transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                locale === code
                  ? 'text-green-600 dark:text-green-400 bg-green-50/50 dark:bg-green-900/20'
                  : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              <span className="text-lg mr-3">{language.flag}</span>
              <span>{language.label}</span>
              {locale === code && (
                <div className="ml-auto w-2 h-2 bg-green-500 rounded-full"></div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;