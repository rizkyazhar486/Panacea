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
  save: { id: 'Simpan', en: 'Save', zh: '保存', ar: 'حفظ' },
  aiSettings: { id: 'Pengaturan AI Co-Physician', en: 'AI Co-Physician Settings', zh: 'AI 协同医生设置', ar: 'إعدادات الذكاء الاصطناعي' },

  // Notifications
  notifications: { id: 'Notifikasi', en: 'Notifications', zh: '通知', ar: 'الإشعارات' },
  notifSub: { id: 'Pilih pemberitahuan yang ingin Anda terima', en: 'Choose which alerts you receive', zh: '选择您想接收的提醒', ar: 'اختر التنبيهات التي تتلقاها' },
  notifVitals: { id: 'Peringatan Tanda Vital', en: 'Vitals Alerts', zh: '生命体征警报', ar: 'تنبيهات العلامات الحيوية' },
  notifVitalsSub: { id: 'Pemberitahuan langsung untuk anomali biometrik', en: 'Immediate alerts for biometric anomalies', zh: '生物指标异常即时通知', ar: 'تنبيهات فورية للشذوذ الحيوي' },
  notifEmail: { id: 'Notifikasi Email', en: 'Email Notifications', zh: '电子邮件通知', ar: 'إشعارات البريد' },
  notifEmailSub: { id: 'Ringkasan kesehatan & laporan mingguan', en: 'Weekly health summaries & reports', zh: '每周健康摘要和报告', ar: 'ملخصات صحية أسبوعية' },
  notifSms: { id: 'Peringatan SMS', en: 'SMS Alerts', zh: '短信提醒', ar: 'تنبيهات الرسائل' },
  notifSmsSub: { id: 'Darurat SOS & pembaruan mendesak', en: 'Emergency SOS & urgent updates', zh: '紧急 SOS 和紧急更新', ar: 'الطوارئ والتحديثات العاجلة' },
  notifAi: { id: 'Wawasan AI Kesehatan', en: 'AI Health Insights', zh: 'AI 健康洞察', ar: 'رؤى الذكاء الاصطناعي' },
  notifAiSub: { id: 'Rekomendasi gaya hidup harian dari PanaceaAI', en: 'Daily lifestyle tips from PanaceaAI', zh: '来自 PanaceaAI 的每日建议', ar: 'نصائح يومية من PanaceaAI' },
  notifBroadcast: { id: 'Siaran Jaringan', en: 'Network Broadcasts', zh: '网络广播', ar: 'بث الشبكة' },
  notifBroadcastSub: { id: 'Pembaruan dari penyedia layanan medis Anda', en: 'Updates from your medical providers', zh: '来自您的医疗机构的更新', ar: 'تحديثات من مقدمي الرعاية' },

  // Account & security
  security: { id: 'Akun & Keamanan', en: 'Account & Security', zh: '账户与安全', ar: 'الحساب والأمان' },
  securitySub: { id: 'Profil, kata sandi & autentikasi', en: 'Profile, password & authentication', zh: '资料、密码和验证', ar: 'الملف وكلمة المرور والمصادقة' },
  editProfile: { id: 'Edit Profil', en: 'Edit Profile', zh: '编辑资料', ar: 'تعديل الملف' },
  editProfileSub: { id: 'Avatar, bio & ID kesehatan', en: 'Avatar, bio & health IDs', zh: '头像、简介和健康 ID', ar: 'الصورة والسيرة والمعرفات' },
  password: { id: 'Ubah Kata Sandi', en: 'Change Password', zh: '更改密码', ar: 'تغيير كلمة المرور' },
  passwordSub: { id: 'Amankan akses akun Anda', en: 'Secure your account access', zh: '保护您的账户访问', ar: 'تأمين الوصول لحسابك' },
  twoFactor: { id: 'Autentikasi 2 Faktor', en: 'Two-Factor Auth', zh: '双重验证', ar: 'المصادقة الثنائية' },
  twoFactorSub: { id: 'Lapisan keamanan tambahan saat masuk', en: 'Extra security layer at sign-in', zh: '登录时的额外安全层', ar: 'طبقة أمان إضافية' },
  biometric: { id: 'Kunci Biometrik', en: 'Biometric Lock', zh: '生物识别锁', ar: 'القفل الحيوي' },
  biometricSub: { id: 'FaceID / sidik jari untuk membuka aplikasi', en: 'FaceID / fingerprint to unlock', zh: '使用 FaceID/指纹解锁', ar: 'بصمة الوجه / الإصبع' },
  enabled: { id: 'Aktif', en: 'Enabled', zh: '已启用', ar: 'مُفعّل' },
  disabled: { id: 'Nonaktif', en: 'Disabled', zh: '已禁用', ar: 'مُعطّل' },

  // Privacy / data
  privacy: { id: 'Privasi & Data', en: 'Privacy & Data', zh: '隐私与数据', ar: 'الخصوصية والبيانات' },
  privacySub: { id: 'Unduh atau kelola data kesehatan Anda', en: 'Download or manage your health data', zh: '下载或管理您的健康数据', ar: 'تنزيل أو إدارة بياناتك' },
  exportData: { id: 'Unduh Data Saya', en: 'Download My Data', zh: '下载我的数据', ar: 'تنزيل بياناتي' },
  exportSub: { id: 'Ekspor seluruh data akun (JSON) ke perangkat Anda', en: 'Export all account data (JSON) to your device', zh: '将所有账户数据导出为 JSON', ar: 'تصدير جميع البيانات (JSON)' },

  appInfo: { id: 'Dibuat untuk Vitalitas & Presisi', en: 'Built for Vitality & Precision', zh: '为活力与精准而打造', ar: 'مصمم للحيوية والدقة' },
}

export function t(key: keyof typeof DICT, lang: Lang = getLang()): string {
  return DICT[key]?.[lang] ?? DICT[key]?.id ?? String(key)
}
