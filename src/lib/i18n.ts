// Lightweight language preference + translations. Stores the chosen language,
// sets <html lang> and text direction (RTL for Arabic), and exposes a small
// dictionary used by the appearance settings (extendable page by page).
export type Lang = 'id' | 'en' | 'zh' | 'ar'

const KEY = 'pmd-lang'
const RTL: Lang[] = ['ar']

export const LANGS: { id: Lang; native: string; en: string; flag: string }[] = [
  { id: 'id', native: 'Bahasa Indonesia', en: 'Indonesian', flag: '🇮🇩' },
  { id: 'en', native: 'English', en: 'English', flag: '🇬🇧' },
  { id: 'zh', native: '中文', en: 'Mandarin', flag: '🇨🇳' },
  { id: 'ar', native: 'العربية', en: 'Arabic', flag: '🇸🇦' },
]

export function getLang(): Lang {
  try {
    const v = localStorage.getItem(KEY)
    if (v === 'id' || v === 'en' || v === 'zh' || v === 'ar') return v
  } catch {
    /* ignore */
  }
  return 'id'
}

export function isRtl(lang: Lang = getLang()): boolean {
  return RTL.includes(lang)
}

export function applyLang(lang: Lang) {
  const root = document.documentElement
  root.lang = lang
  root.dir = isRtl(lang) ? 'rtl' : 'ltr'
}

export function setLang(lang: Lang) {
  try {
    localStorage.setItem(KEY, lang)
  } catch {
    /* ignore */
  }
  applyLang(lang)
}

// Translation keys used by the Settings / appearance UI.
type Dict = Record<string, Record<Lang, string>>

const DICT: Dict = {
  appearance: { id: 'Tampilan', en: 'Appearance', zh: '外观', ar: 'المظهر' },
  appearanceSub: {
    id: 'Atur tema, bahasa, ukuran teks & animasi',
    en: 'Theme, language, text size & motion',
    zh: '主题、语言、文字大小和动画',
    ar: 'السمة واللغة وحجم النص والحركة',
  },
  theme: { id: 'Tema', en: 'Theme', zh: '主题', ar: 'السمة' },
  light: { id: 'Terang', en: 'Light', zh: '浅色', ar: 'فاتح' },
  dark: { id: 'Gelap', en: 'Dark', zh: '深色', ar: 'داكن' },
  system: { id: 'Sistem', en: 'System', zh: '系统', ar: 'النظام' },
  language: { id: 'Bahasa', en: 'Language', zh: '语言', ar: 'اللغة' },
  textSize: { id: 'Ukuran Teks', en: 'Text Size', zh: '文字大小', ar: 'حجم النص' },
  small: { id: 'Kecil', en: 'Small', zh: '小', ar: 'صغير' },
  normal: { id: 'Normal', en: 'Normal', zh: '标准', ar: 'عادي' },
  large: { id: 'Besar', en: 'Large', zh: '大', ar: 'كبير' },
  reduceMotion: { id: 'Kurangi Animasi', en: 'Reduce Motion', zh: '减少动画', ar: 'تقليل الحركة' },
  reduceMotionSub: {
    id: 'Nonaktifkan transisi & efek bergerak',
    en: 'Disable transitions & moving effects',
    zh: '禁用过渡和移动效果',
    ar: 'تعطيل التأثيرات المتحركة',
  },
  saved: { id: 'Tersimpan ✓', en: 'Saved ✓', zh: '已保存 ✓', ar: 'تم الحفظ ✓' },
  aiSettings: { id: 'Pengaturan AI Co-Physician', en: 'AI Co-Physician Settings', zh: 'AI 协同医生设置', ar: 'إعدادات الذكاء الاصطناعي' },
}

export function t(key: keyof typeof DICT, lang: Lang = getLang()): string {
  return DICT[key]?.[lang] ?? DICT[key]?.id ?? String(key)
}
