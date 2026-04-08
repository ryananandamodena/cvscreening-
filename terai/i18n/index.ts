import id from './id';
import en from './en';

export type Language = 'id' | 'en';

export const translations: Record<Language, Record<string, string>> = { id, en };

export { id, en };
