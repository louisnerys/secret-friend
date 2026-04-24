'use client';

import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <div className="flex gap-2 bg-surface-container rounded-full p-1 border border-outline-variant shadow-sm" role="group" aria-label="Language selection">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => i18n.changeLanguage(lang.code)}
          className={`px-2 py-1 rounded-full text-sm transition-all duration-200 flex items-center gap-1 ${
            i18n.language.startsWith(lang.code)
              ? 'bg-primary text-on-primary shadow-md'
              : 'hover:bg-surface-container-high text-on-surface-variant'
          }`}
          aria-pressed={i18n.language.startsWith(lang.code)}
          aria-label={lang.label}
        >
          <span aria-hidden="true">{lang.flag}</span>
          <span className="hidden sm:inline font-medium">{lang.code.toUpperCase()}</span>
        </button>
      ))}
    </div>
  );
}
