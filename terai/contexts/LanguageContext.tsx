import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { translations, type Language } from '../i18n';

interface LanguageContextType {
    lang: Language;
    setLang: (lang: Language) => void;
    t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [lang, setLangState] = useState<Language>(() => {
        const saved = localStorage.getItem('app_language');
        return (saved === 'en' || saved === 'id') ? saved : 'id';
    });

    const setLang = useCallback((newLang: Language) => {
        setLangState(newLang);
        localStorage.setItem('app_language', newLang);
    }, []);

    const t = useCallback((key: string, params?: Record<string, string | number>): string => {
        let value = translations[lang]?.[key] || translations['en']?.[key] || key;
        if (params) {
            Object.entries(params).forEach(([k, v]) => {
                value = value.replace(`{${k}}`, String(v));
            });
        }
        return value;
    }, [lang]);

    return (
        <LanguageContext.Provider value={{ lang, setLang, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = (): LanguageContextType => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};

export default LanguageContext;
