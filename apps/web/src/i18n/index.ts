import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'

import enAdmin from './locales/en/admin.json'
import enAuth from './locales/en/auth.json'
import enBrowse from './locales/en/browse.json'
import enCommon from './locales/en/common.json'
import enCommunity from './locales/en/community.json'
import enCreate from './locales/en/create.json'
import enDashboard from './locales/en/dashboard.json'
import enDetail from './locales/en/detail.json'
import enErrors from './locales/en/errors.json'
import enHome from './locales/en/home.json'
import enInquiry from './locales/en/inquiry.json'
import enMessages from './locales/en/messages.json'
import enNav from './locales/en/nav.json'
import enPolicy from './locales/en/policy.json'
import enProfile from './locales/en/profile.json'
import koAdmin from './locales/ko/admin.json'
import koAuth from './locales/ko/auth.json'
import koBrowse from './locales/ko/browse.json'
import koCommon from './locales/ko/common.json'
import koCommunity from './locales/ko/community.json'
import koCreate from './locales/ko/create.json'
import koDashboard from './locales/ko/dashboard.json'
import koDetail from './locales/ko/detail.json'
import koErrors from './locales/ko/errors.json'
import koHome from './locales/ko/home.json'
import koInquiry from './locales/ko/inquiry.json'
import koMessages from './locales/ko/messages.json'
import koNav from './locales/ko/nav.json'
import koPolicy from './locales/ko/policy.json'
import koProfile from './locales/ko/profile.json'

export const SUPPORTED_LANGS = ['ko', 'en'] as const
export type Lang = (typeof SUPPORTED_LANGS)[number]

/** Korea-first. English is the secondary locale, never the fallback. */
export const DEFAULT_LANG: Lang = 'ko'
export const LANG_STORAGE_KEY = 'pm_lang'

export const NS = [
  'common',
  'nav',
  'home',
  'browse',
  'detail',
  'auth',
  'dashboard',
  'profile',
  'create',
  'errors',
  'admin',
  'policy',
  'community',
  'messages',
  'inquiry',
] as const

export const resources = {
  ko: {
    common: koCommon,
    nav: koNav,
    home: koHome,
    browse: koBrowse,
    detail: koDetail,
    auth: koAuth,
    dashboard: koDashboard,
    profile: koProfile,
    create: koCreate,
    errors: koErrors,
    admin: koAdmin,
    policy: koPolicy,
    community: koCommunity,
    messages: koMessages,
    inquiry: koInquiry,
  },
  en: {
    common: enCommon,
    nav: enNav,
    home: enHome,
    browse: enBrowse,
    detail: enDetail,
    auth: enAuth,
    dashboard: enDashboard,
    profile: enProfile,
    create: enCreate,
    errors: enErrors,
    admin: enAdmin,
    policy: enPolicy,
    community: enCommunity,
    messages: enMessages,
    inquiry: enInquiry,
  },
} as const

/** BCP-47 tag for the Intl APIs (number/currency/date formatting). */
const INTL_LOCALE: Record<Lang, string> = {
  ko: 'ko-KR',
  en: 'en-US',
}

export function normalizeLang(value: string | undefined | null): Lang {
  const base = (value ?? '').toLowerCase().split('-')[0]
  return (SUPPORTED_LANGS as readonly string[]).includes(base) ? (base as Lang) : DEFAULT_LANG
}

/** Active Intl locale, derived from the current i18next language. */
export function activeIntlLocale(): string {
  return INTL_LOCALE[normalizeLang(i18n.resolvedLanguage ?? i18n.language)]
}

/** Keep <html lang> in sync so screen readers, hyphenation, and CJK line
 *  breaking pick the right rules. */
function syncHtmlLang(lng: string): void {
  if (typeof document === 'undefined') return
  document.documentElement.lang = normalizeLang(lng)
}

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    supportedLngs: [...SUPPORTED_LANGS],
    fallbackLng: DEFAULT_LANG,
    defaultNS: 'common',
    ns: [...NS],
    load: 'languageOnly',
    nonExplicitSupportedLngs: true,
    detection: {
      order: ['localStorage', 'htmlTag'],
      lookupLocalStorage: LANG_STORAGE_KEY,
      caches: ['localStorage'],
    },
    interpolation: {
      // React already escapes values, so i18next must not double-escape.
      escapeValue: false,
    },
    returnEmptyString: false,
    react: {
      useSuspense: false,
    },
  })

syncHtmlLang(i18n.resolvedLanguage ?? i18n.language ?? DEFAULT_LANG)
i18n.on('languageChanged', syncHtmlLang)

export default i18n
