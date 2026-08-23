// Lightweight language preference + translations. Stores the chosen language,
// sets <html lang> and text direction (RTL for Arabic), and exposes a small
// dictionary used by the appearance settings (extendable page by page).
export type Lang = 'id' | 'en' | 'zh' | 'ar' | 'fr' | 'ja' | 'nl'

const KEY = 'pmd-lang'
const RTL: Lang[] = ['ar']

export const LANGS: { id: Lang; native: string; en: string; flag: string }[] = [
  { id: 'id', native: 'Bahasa Indonesia', en: 'Indonesian', flag: '🇮🇩' },
  { id: 'en', native: 'English', en: 'English', flag: '🇬🇧' },
  { id: 'zh', native: '中文', en: 'Mandarin', flag: '🇨🇳' },
  { id: 'ar', native: 'العربية', en: 'Arabic', flag: '🇸🇦' },
  { id: 'fr', native: 'Français', en: 'French', flag: '🇫🇷' },
  { id: 'ja', native: '日本語', en: 'Japanese', flag: '🇯🇵' },
  { id: 'nl', native: 'Nederlands', en: 'Dutch', flag: '🇳🇱' },
]

export function getLang(): Lang {
  try {
    const v = localStorage.getItem(KEY)
    if (v && (LANGS as { id: Lang }[]).some((l) => l.id === v)) return v as Lang
  } catch {
    /* ignore */
  }
  // English is the app's primary language; Indonesian (and others) remain
  // selectable in Settings. New users default to English for a consistent UI.
  return 'en'
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
  // Kamus kalimatnya dimuat DI SINI, bukan saat komponen pertama memerlukannya:
  // memuatnya belakangan membuat layar sempat tampil dalam bahasa Inggris lalu
  // berkedip berganti — dan kedipan itu terlihat seperti kerusakan.
  void muatKamusKalimat(lang).then(umumkanBahasa)
}

// Translation keys used by the Settings / appearance UI.
type Dict = Record<string, Record<Lang, string>>

const DICT: Dict = {
  appearance: { id: 'Tampilan', en: 'Appearance', zh: '外观', ar: 'المظهر', fr: 'Apparence', ja: '表示', nl: 'Weergave' },
  appearanceSub: {
    id: 'Atur tema, bahasa, ukuran teks & animasi',
    en: 'Theme, language, text size & motion',
    zh: '主题、语言、文字大小和动画',
    ar: 'السمة واللغة وحجم النص والحركة', fr: 'Thème, langue, taille du texte et animations', ja: 'テーマ・言語・文字サイズ・アニメーション', nl: 'Thema, taal, tekstgrootte en animatie',
  },
  theme: { id: 'Tema', en: 'Theme', zh: '主题', ar: 'السمة', fr: 'Thème', ja: 'テーマ', nl: 'Thema' },
  light: { id: 'Terang', en: 'Light', zh: '浅色', ar: 'فاتح', fr: 'Clair', ja: 'ライト', nl: 'Licht' },
  dark: { id: 'Gelap', en: 'Dark', zh: '深色', ar: 'داكن', fr: 'Sombre', ja: 'ダーク', nl: 'Donker' },
  system: { id: 'Sistem', en: 'System', zh: '系统', ar: 'النظام', fr: 'Système', ja: 'システム', nl: 'Systeem' },
  language: { id: 'Bahasa', en: 'Language', zh: '语言', ar: 'اللغة', fr: 'Langue', ja: '言語', nl: 'Taal' },
  textSize: { id: 'Ukuran Teks', en: 'Text Size', zh: '文字大小', ar: 'حجم النص', fr: 'Taille du texte', ja: '文字サイズ', nl: 'Tekstgrootte' },
  small: { id: 'Kecil', en: 'Small', zh: '小', ar: 'صغير', fr: 'Petit', ja: '小', nl: 'Klein' },
  normal: { id: 'Normal', en: 'Normal', zh: '标准', ar: 'عادي', fr: 'Normal', ja: '標準', nl: 'Normaal' },
  large: { id: 'Besar', en: 'Large', zh: '大', ar: 'كبير', fr: 'Grand', ja: '大', nl: 'Groot' },
  reduceMotion: { id: 'Kurangi Animasi', en: 'Reduce Motion', zh: '减少动画', ar: 'تقليل الحركة', fr: 'Réduire les animations', ja: '動きを減らす', nl: 'Minder animatie' },
  reduceMotionSub: {
    id: 'Nonaktifkan transisi & efek bergerak',
    en: 'Disable transitions & moving effects',
    zh: '禁用过渡和移动效果',
    ar: 'تعطيل التأثيرات المتحركة', fr: 'Désactiver les transitions et effets animés', ja: 'トランジションと動くエフェクトを無効にする', nl: 'Overgangen en bewegende effecten uitschakelen',
  },
  saved: { id: 'Tersimpan ✓', en: 'Saved ✓', zh: '已保存 ✓', ar: 'تم الحفظ ✓', fr: 'Enregistré ✓', ja: '保存しました ✓', nl: 'Opgeslagen ✓' },
  save: { id: 'Simpan', en: 'Save', zh: '保存', ar: 'حفظ', fr: 'Enregistrer', ja: '保存', nl: 'Opslaan' },
  aiSettings: { id: 'Pengaturan AI Co-Physician', en: 'AI Co-Physician Settings', zh: 'AI 协同医生设置', ar: 'إعدادات الذكاء الاصطناعي', fr: 'Paramètres du co-médecin IA', ja: 'AI 副医師の設定', nl: 'Instellingen AI-co-arts' },

  // Notifications
  notifications: { id: 'Notifikasi', en: 'Notifications', zh: '通知', ar: 'الإشعارات', fr: 'Notifications', ja: '通知', nl: 'Meldingen' },
  notifSub: { id: 'Pilih pemberitahuan yang ingin Anda terima', en: 'Choose which alerts you receive', zh: '选择您想接收的提醒', ar: 'اختر التنبيهات التي تتلقاها', fr: 'Choisissez les alertes que vous recevez', ja: '受け取る通知を選択します', nl: 'Kies welke meldingen u ontvangt' },
  notifVitals: { id: 'Peringatan Tanda Vital', en: 'Vitals Alerts', zh: '生命体征警报', ar: 'تنبيهات العلامات الحيوية', fr: 'Alertes des constantes', ja: 'バイタルの警告', nl: 'Waarschuwingen vitale functies' },
  notifVitalsSub: { id: 'Pemberitahuan langsung untuk anomali biometrik', en: 'Immediate alerts for biometric anomalies', zh: '生物指标异常即时通知', ar: 'تنبيهات فورية للشذوذ الحيوي', fr: 'Alertes immédiates en cas d\'anomalie biométrique', ja: '生体データの異常を即時に通知', nl: 'Directe waarschuwing bij afwijkende biometrie' },
  notifEmail: { id: 'Notifikasi Email', en: 'Email Notifications', zh: '电子邮件通知', ar: 'إشعارات البريد', fr: 'Notifications par e-mail', ja: 'メール通知', nl: 'E-mailmeldingen' },
  notifEmailSub: { id: 'Summary kesehatan & laporan mingguan', en: 'Weekly health summaries & reports', zh: '每周健康摘要和报告', ar: 'ملخصات صحية أسبوعية', fr: 'Bilans et rapports de santé hebdomadaires', ja: '週次の健康サマリーとレポート', nl: 'Wekelijkse gezondheidsoverzichten en rapporten' },
  notifSms: { id: 'Peringatan SMS', en: 'SMS Alerts', zh: '短信提醒', ar: 'تنبيهات الرسائل', fr: 'Alertes SMS', ja: 'SMS 通知', nl: 'Sms-waarschuwingen' },
  notifSmsSub: { id: 'Darurat SOS & pembaruan mendesak', en: 'Emergency SOS & urgent updates', zh: '紧急 SOS 和紧急更新', ar: 'الطوارئ والتحديثات العاجلة', fr: 'SOS d\'urgence et informations urgentes', ja: '緊急 SOS と重要なお知らせ', nl: 'Nood-SOS en dringende updates' },
  notifAi: { id: 'Wawasan AI Kesehatan', en: 'AI Health Insights', zh: 'AI 健康洞察', ar: 'رؤى الذكاء الاصطناعي', fr: 'Analyses santé par IA', ja: 'AI による健康インサイト', nl: 'AI-gezondheidsinzichten' },
  notifAiSub: { id: 'Rekomendasi gaya hidup harian dari PanaceaAI', en: 'Daily lifestyle tips from PanaceaAI', zh: '来自 PanaceaAI 的每日建议', ar: 'نصائح يومية من PanaceaAI', fr: 'Conseils quotidiens de PanaceaAI', ja: 'PanaceaAI からの毎日のアドバイス', nl: 'Dagelijkse leefstijltips van PanaceaAI' },
  notifBroadcast: { id: 'Siaran Jaringan', en: 'Network Broadcasts', zh: '网络广播', ar: 'بث الشبكة', fr: 'Annonces du réseau', ja: 'ネットワークからのお知らせ', nl: 'Netwerkberichten' },
  notifBroadcastSub: { id: 'Pembaruan dari penyedia layanan medis Anda', en: 'Updates from your medical providers', zh: '来自您的医疗机构的更新', ar: 'تحديثات من مقدمي الرعاية', fr: 'Informations de vos professionnels de santé', ja: 'かかりつけ医療機関からのお知らせ', nl: 'Updates van uw zorgverleners' },
  notifTx: { id: 'Transaksi & Pembayaran', en: 'Transactions & Payments', zh: '交易与支付', ar: 'المعاملات والمدفوعات', fr: 'Transactions et paiements', ja: '取引と支払い', nl: 'Transacties en betalingen' },
  notifTxSub: { id: 'Konfirmasi top-up & pembelian', en: 'Top-up & purchase confirmations', zh: '充值与购买确认', ar: 'تأكيدات الدفع والشراء', fr: 'Confirmations de recharge et d\'achat', ja: 'チャージと購入の確認', nl: 'Bevestigingen van opwaarderen en aankopen' },

  // Account & security
  security: { id: 'Akun & Keamanan', en: 'Account & Security', zh: '账户与安全', ar: 'الحساب والأمان', fr: 'Compte et sécurité', ja: 'アカウントとセキュリティ', nl: 'Account en beveiliging' },
  securitySub: { id: 'Profil, kata sandi & autentikasi', en: 'Profile, password & authentication', zh: '资料、密码和验证', ar: 'الملف وكلمة المرور والمصادقة', fr: 'Profil, mot de passe et authentification', ja: 'プロフィール・パスワード・認証', nl: 'Profiel, wachtwoord en authenticatie' },
  editProfile: { id: 'Edit Profil', en: 'Edit Profile', zh: '编辑资料', ar: 'تعديل الملف', fr: 'Modifier le profil', ja: 'プロフィールを編集', nl: 'Profiel bewerken' },
  editProfileSub: { id: 'Avatar, bio & ID kesehatan', en: 'Avatar, bio & health IDs', zh: '头像、简介和健康 ID', ar: 'الصورة والسيرة والمعرفات', fr: 'Avatar, bio et identifiants santé', ja: 'アバター・自己紹介・医療 ID', nl: 'Avatar, bio en zorg-ID\'s' },
  password: { id: 'Ubah Kata Sandi', en: 'Change Password', zh: '更改密码', ar: 'تغيير كلمة المرور', fr: 'Changer le mot de passe', ja: 'パスワードを変更', nl: 'Wachtwoord wijzigen' },
  passwordSub: { id: 'Amankan akses akun Anda', en: 'Secure your account access', zh: '保护您的账户访问', ar: 'تأمين الوصول لحسابك', fr: 'Sécurisez l\'accès à votre compte', ja: 'アカウントへのアクセスを保護します', nl: 'Beveilig de toegang tot uw account' },
  twoFactor: { id: 'Autentikasi 2 Faktor', en: 'Two-Factor Auth', zh: '双重验证', ar: 'المصادقة الثنائية', fr: 'Authentification à deux facteurs', ja: '二段階認証', nl: 'Tweefactorauthenticatie' },
  twoFactorSub: { id: 'Lapisan keamanan tambahan saat masuk', en: 'Extra security layer at sign-in', zh: '登录时的额外安全层', ar: 'طبقة أمان إضافية', fr: 'Une couche de sécurité supplémentaire à la connexion', ja: 'ログイン時の追加のセキュリティ', nl: 'Extra beveiligingslaag bij inloggen' },
  biometric: { id: 'Kunci Biometrik', en: 'Biometric Lock', zh: '生物识别锁', ar: 'القفل الحيوي', fr: 'Verrouillage biométrique', ja: '生体認証ロック', nl: 'Biometrische vergrendeling' },
  biometricSub: { id: 'FaceID / sidik jari untuk membuka aplikasi', en: 'FaceID / fingerprint to unlock', zh: '使用 FaceID/指纹解锁', ar: 'بصمة الوجه / الإصبع', fr: 'FaceID / empreinte pour déverrouiller', ja: 'FaceID・指紋でロック解除', nl: 'FaceID / vingerafdruk om te ontgrendelen' },
  enabled: { id: 'Aktif', en: 'Enabled', zh: '已启用', ar: 'مُفعّل', fr: 'Activé', ja: 'オン', nl: 'Aan' },
  disabled: { id: 'Nonaktif', en: 'Disabled', zh: '已禁用', ar: 'مُعطّل', fr: 'Désactivé', ja: 'オフ', nl: 'Uit' },

  // Privacy / data
  privacy: { id: 'Privasi & Data', en: 'Privacy & Data', zh: '隐私与数据', ar: 'الخصوصية والبيانات', fr: 'Confidentialité et données', ja: 'プライバシーとデータ', nl: 'Privacy en gegevens' },
  privacySub: { id: 'Unduh atau kelola data kesehatan Anda', en: 'Download or manage your health data', zh: '下载或管理您的健康数据', ar: 'تنزيل أو إدارة بياناتك', fr: 'Téléchargez ou gérez vos données de santé', ja: '健康データのダウンロードと管理', nl: 'Download of beheer uw gezondheidsgegevens' },
  exportData: { id: 'Unduh Data Saya', en: 'Download My Data', zh: '下载我的数据', ar: 'تنزيل بياناتي', fr: 'Télécharger mes données', ja: 'データをダウンロード', nl: 'Mijn gegevens downloaden' },
  exportSub: { id: 'Ekspor seluruh data akun (JSON) ke perangkat Anda', en: 'Export all account data (JSON) to your device', zh: '将所有账户数据导出为 JSON', ar: 'تصدير جميع البيانات (JSON)', fr: 'Exporter toutes les données du compte (JSON) sur votre appareil', ja: 'アカウントの全データ (JSON) を端末に書き出す', nl: 'Exporteer alle accountgegevens (JSON) naar uw apparaat' },

  appInfo: { id: 'Dibuat untuk Vitalitas & Presisi', en: 'Built for Vitality & Precision', zh: '为活力与精准而打造', ar: 'مصمم للحيوية والدقة', fr: 'Conçu pour la vitalité et la précision', ja: '活力と精度のために', nl: 'Gebouwd voor vitaliteit en precisie' },
}

export function t(key: keyof typeof DICT, lang: Lang = getLang()): string {
  return DICT[key]?.[lang] ?? DICT[key]?.id ?? String(key)
}

// ─────────────────────────────────────────────────────────────────────────────
// Lapisan kedua: TERJEMAHAN BERKUNCI KALIMAT INGGRISNYA SENDIRI.
//
// DICT di atas berkunci nama pendek ('appearance') dan cocok untuk satu layar
// yang seluruh kuncinya ditulis sekaligus. Untuk mengubah SELURUH aplikasi —
// seribu kalimat lebih yang dikerjakan layar demi layar — kunci buatan justru
// berbahaya: satu kunci yang belum sempat diisi tampil di layar orang sebagai
// 'settings.notif.quota.title'. Di sini kuncinya adalah kalimat Inggrisnya
// sendiri, sehingga yang belum diterjemahkan tampil sebagai INGGRIS YANG BENAR,
// dan kamus yang tertinggal zaman gagal dengan cara yang aman.
//
// Harganya: mengubah kalimat Inggrisnya membuat terjemahannya yatim. Itu harga
// yang tepat — terjemahan yatim menampilkan bahasa Inggris, sedangkan kunci
// yang hilang menampilkan omong kosong.
// ─────────────────────────────────────────────────────────────────────────────

export type KamusKalimat = Record<string, string>

const kamusKalimat: Partial<Record<Lang, KamusKalimat>> = {}
const pendengarBahasa = new Set<() => void>()

/** Muat kamus kalimat satu bahasa. Inggris tidak memerlukannya. */
export async function muatKamusKalimat(lang: Lang = getLang()): Promise<void> {
  if (lang === 'en' || kamusKalimat[lang]) return
  try {
    // Peta pemuat yang DITULIS SATU PER SATU, bukan import bertemplat.
    // `import(`../locales/${lang}.ts`)` memang berjalan saat pengembangan,
    // tetapi pada hasil build berkasnya sudah bernama .js dan permintaannya
    // gagal — lalu ditelan oleh catch di bawah, sehingga aplikasinya tampil
    // dalam bahasa Inggris tanpa satu pun tanda bahwa kamusnya tidak termuat.
    const pemuat: Record<string, () => Promise<{ default?: KamusKalimat }>> = {
      id: () => import('../locales/id'),
      ar: () => import('../locales/ar'),
      zh: () => import('../locales/zh'),
      fr: () => import('../locales/fr'),
      ja: () => import('../locales/ja'),
      nl: () => import('../locales/nl'),
    }
    const mod = await pemuat[lang]()
    kamusKalimat[lang] = (mod.default ?? {}) as KamusKalimat
  } catch {
    // Kamus yang hilang atau rusak tidak boleh menjatuhkan aplikasi: bahasa
    // Inggris berdiri sebagai penggantinya.
    kamusKalimat[lang] = {}
  }
  for (const f of pendengarBahasa) f()
}

/**
 * Terjemahkan kalimat Inggris. `en` sekaligus kunci dan cadangannya.
 *
 * `vars` mengisi lubang bergaya {nama} supaya kalimat tidak pernah dirangkai
 * dengan penyambungan teks — urutan kata berbeda antarbahasa, dan penyambungan
 * diam-diam memaksakan urutan Inggris kepada semuanya.
 */
export function tr(en: string, vars?: Record<string, string | number>): string {
  const k = kamusKalimat[getLang()]
  let keluar = (k && k[en]) || en
  if (vars) for (const [nama, nilai] of Object.entries(vars)) keluar = keluar.split(`{${nama}}`).join(String(nilai))
  return keluar
}

/*
 * NOMOR URUT, bukan hanya kode bahasanya.
 *
 * useSyncExternalStore hanya menggambar ulang bila POTRETNYA BERUBAH. Saat
 * kamus selesai dimuat, kode bahasanya sudah bernilai 'id' sejak awal — tidak
 * ada yang berubah, jadi React melewatkan penggambaran ulang dan seluruh
 * layar tetap berbahasa Inggris sampai halamannya kebetulan berpindah. Terlihat
 * persis seperti kamus yang gagal dimuat, padahal kamusnya sudah ada di memori.
 */
let versiBahasa = 0
export function potretBahasa(): string { return `${getLang()}#${versiBahasa}` }

/** Beri tahu seluruh aplikasi bahwa bahasanya berganti. */
export function umumkanBahasa(): void {
  versiBahasa += 1
  for (const f of pendengarBahasa) f()
}

export function langgananBahasa(f: () => void): () => void {
  pendengarBahasa.add(f)
  return () => { pendengarBahasa.delete(f) }
}
