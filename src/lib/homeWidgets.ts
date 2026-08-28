// ─────────────────────────────────────────────────────────────────────────────
// Pilihan kartu di Beranda.
//
// Fitur sudah banyak, dan tidak semua orang memakai bagian yang sama. Alih-alih
// menebak mana yang penting bagi setiap orang, biarkan pengguna memilih sendiri
// apa yang muncul di Beranda.
//
// Bawaannya sengaja sedikit — tiga kartu — karena beranda yang penuh sejak awal
// justru membuat orang berhenti membacanya. Sisanya tinggal dinyalakan.
//
// PENTING SAAT MENAMBAH HALAMAN BARU: daftar ini ditulis manual dan TIDAK
// diturunkan dari navigasi, karena tiap kartu punya label dan ringkasan yang
// digubah khusus untuk beranda. Akibatnya halaman baru tidak muncul di sini
// sampai didaftarkan — itu yang sempat terjadi pada CrossFit, Peregangan dan
// Harada. Kalau Anda menambah halaman yang layak jadi pintasan beranda,
// tambahkan barisnya di sini juga.
// ─────────────────────────────────────────────────────────────────────────────

export interface WidgetDef {
  id: string
  label: string
  ringkas: string
  ke: string
  emoji: string
  /** Kelompok pada pemilih widget. Menentukan urutan dan judul bagiannya. */
  kategori: string
  /** Nyala secara bawaan bagi pengguna baru. */
  bawaan?: boolean
}

export const WIDGETS: WidgetDef[] = [
  { id: 'medStudy', label: 'Med Study Hub', ringkas: 'Question bank, OSCE technique, and exam plans', ke: '/med-study', emoji: '📚', kategori: 'Clinical & Learning', bawaan: true },
  { id: 'tatalaksana', label: 'SKDI Therapy', ringkas: 'Find drugs and doses by disease', ke: '/med-study?bagian=therapy', emoji: '💊', kategori: 'Clinical & Learning', bawaan: true },
  { id: 'penyakit', label: 'SKDI Disease List', ringkas: 'Full notes for each disease', ke: '/med-study?bagian=diseases', emoji: '📖', kategori: 'Clinical & Learning' },
  { id: 'osce', label: 'OSCE UKMPPD Stations', ringkas: 'Recap of 1,416 stations, 32 sittings', ke: '/osce-ukmppd', emoji: '🩺', kategori: 'Clinical & Learning' },
  { id: 'caseBank', label: 'OSCE Case Bank', ringkas: 'Cases and how often they appear', ke: '/med-study?bagian=case-bank', emoji: '📋', kategori: 'Clinical & Learning' },
  { id: 'simulator', label: 'Station Simulator', ringkas: 'Practise a station against the clock', ke: '/med-study?bagian=station-sim', emoji: '🎭', kategori: 'Clinical & Learning' },
  { id: 'mnemonik', label: 'Mnemonics', ringkas: 'Shorthand that actually sticks', ke: '/med-study?bagian=mnemonik', emoji: '🔤', kategori: 'Clinical & Learning' },
  { id: 'evidence', label: 'Clinical Evidence', ringkas: 'Clinical questions, answers graded by evidence', ke: '/evidence', emoji: '🔬', kategori: 'Clinical & Learning' },
  { id: 'emr', label: 'AI-EMR', ringkas: 'SOAP medical records with AI assistance', ke: '/emr', emoji: '📝', kategori: 'Clinical & Learning' },
  { id: 'drugInfo', label: 'Drug Information', ringkas: 'Look up drugs and their interactions', ke: '/drug-info', emoji: '💉', kategori: 'Clinical & Learning' },
  { id: 'empirik', label: 'Empirical Therapy', ringkas: 'Empirical antibiotics by source of infection', ke: '/empiric-therapy-reference', emoji: '🦠', kategori: 'Clinical & Learning' },
  { id: 'lesi', label: 'Skin Lesion Mapper', ringkas: 'Recognise lesion morphology', ke: '/dermatology-lesion-mapper', emoji: '🔎', kategori: 'Clinical & Learning' },
  { id: 'psikiatri', label: 'Mental State Exam', ringkas: 'Structured psychiatric examination', ke: '/psychiatric-status-exam', emoji: '🧠', kategori: 'Clinical & Learning' },
  { id: 'neonatus', label: 'Neonatal Resuscitation', ringkas: 'The algorithm, step by step', ke: '/neonatal-resuscitation-guide', emoji: '👶', kategori: 'Clinical & Learning' },
  { id: 'trials', label: 'Clinical Trials', ringkas: 'Studies currently recruiting', ke: '/trials', emoji: '🧪', kategori: 'Clinical & Learning' },
  { id: 'geneInfo', label: 'Gene Information', ringkas: 'Look up genes and disease links', ke: '/gene-info', emoji: '🧬', kategori: 'Clinical & Learning' },
  { id: 'edukasiPasien', label: 'Patient Education', ringkas: 'Explaining material to hand to patients', ke: '/education', emoji: '🗣️', kategori: 'Clinical & Learning' },
  { id: 'kalkulator', label: 'Clinical Calculators', ringkas: 'Every score in one place', ke: '/clinical-calculators', emoji: '🧮', kategori: 'Calculators & Scores' },
  { id: 'kalkulatorHub', label: 'Calculator Hub', ringkas: 'General health calculators', ke: '/calculator-hub', emoji: '🔢', kategori: 'Calculators & Scores' },
  { id: 'sofa', label: 'SOFA Score', ringkas: 'Organ dysfunction in sepsis', ke: '/sofa-score', emoji: '⚕️', kategori: 'Calculators & Scores' },
  { id: 'wells', label: 'Wells Score', ringkas: 'Likelihood of DVT and pulmonary embolism', ke: '/wells-score', emoji: '🫁', kategori: 'Calculators & Scores' },
  { id: 'news2', label: 'NEWS2', ringkas: 'Early warning of deterioration', ke: '/news2-score', emoji: '🚨', kategori: 'Calculators & Scores' },
  { id: 'childPugh', label: 'Child-Pugh', ringkas: 'Severity of liver cirrhosis', ke: '/child-pugh-score', emoji: '🫀', kategori: 'Calculators & Scores' },
  { id: 'meld', label: 'MELD Score', ringkas: 'Liver transplant priority', ke: '/meld-score', emoji: '🩸', kategori: 'Calculators & Scores' },
  { id: 'grace', label: 'GRACE Score', ringkas: 'Risk in acute coronary syndrome', ke: '/grace-score', emoji: '❤️‍🩹', kategori: 'Calculators & Scores' },
  { id: 'timi', label: 'TIMI', ringkas: 'Risk in chest pain', ke: '/timi-risk-score', emoji: '📉', kategori: 'Calculators & Scores' },
  { id: 'hasbled', label: 'HAS-BLED', ringkas: 'Bleeding risk on anticoagulation', ke: '/has-bled-score', emoji: '🩹', kategori: 'Calculators & Scores' },
  { id: 'qtc', label: 'QTc', ringkas: 'Corrected QT interval', ke: '/qtc-calculator', emoji: '📈', kategori: 'Calculators & Scores' },
  { id: 'kreatinin', label: 'Creatinine Clearance', ringkas: 'Adjust doses to kidney function', ke: '/creatinine-clearance', emoji: '🫘', kategori: 'Calculators & Scores' },
  { id: 'cairan', label: 'Fluid Calculator', ringkas: 'Fluid requirements and deficit', ke: '/fluid-calculators', emoji: '💧', kategori: 'Calculators & Scores' },
  { id: 'ottawa', label: 'Ottawa Rules', ringkas: 'Whether an X-ray is needed at all', ke: '/ottawa-ankle', emoji: '🦴', kategori: 'Calculators & Scores' },
  { id: 'ldl', label: 'LDL & Lipids', ringkas: 'Calculate LDL and risk', ke: '/ldl-calculator', emoji: '🧈', kategori: 'Calculators & Scores' },
  { id: 'braden', label: 'Braden Scale', ringkas: 'Pressure injury risk', ke: '/braden-scale', emoji: '🛏️', kategori: 'Calculators & Scores' },
  { id: 'risiko', label: 'Risk Calculators', ringkas: 'Cardiovascular risk, and others', ke: '/risk', emoji: '⚖️', kategori: 'Calculators & Scores' },
  { id: 'pelatih', label: 'Training Coach', ringkas: 'Your next session and current form', ke: '/riwayat-latihan', emoji: '🏃', kategori: 'Training', bawaan: true },
  { id: 'targetLatihan', label: 'Training Targets', ringkas: 'Progress against your weekly or monthly target', ke: '/analisis-pro', emoji: '🎯', kategori: 'Training' },
  { id: 'kebugaran', label: 'Training Today', ringkas: 'Fitness, fatigue, form — and today\'s call', ke: '/analisis-pro', emoji: '📊', kategori: 'Training', bawaan: true },
  { id: 'usahaTerbaik', label: 'Personal Bests', ringkas: 'Fastest times per distance', ke: '/analisis-pro', emoji: '🏅', kategori: 'Training' },
  { id: 'grafikOlahraga', label: 'Exercise Charts', ringkas: 'Distance, steps, pace, heart rate, zones, cadence', ke: '/riwayat-latihan', emoji: '📈', kategori: 'Training' },
  { id: 'latihanTerpandu', label: 'Guided Workouts', ringkas: 'Guided sessions with movement videos', ke: '/workout', emoji: '🏋️', kategori: 'Training' },
  { id: 'pusatLatihan', label: 'Training Hub', ringkas: 'All your training tools', ke: '/latihan', emoji: '🏟️', kategori: 'Training' },
  { id: 'crossfit', label: 'CrossFit & AMRAP', ringkas: 'Benchmarks with a clock and round tapper', ke: '/crossfit', emoji: '🔥', kategori: 'Training' },
  { id: 'teknikLari', label: 'Running Technique', ringkas: 'Cadence, stride, breathing', ke: '/teknik-lari', emoji: '👟', kategori: 'Training' },
  { id: 'multisport', label: 'Run, Bike, Swim', ringkas: 'Three-discipline training', ke: '/lari-sepeda-renang', emoji: '🚴', kategori: 'Training' },
  { id: 'alatFitness', label: 'Gym Equipment', ringkas: 'How to use each machine', ke: '/alat-fitness', emoji: '🏋️‍♀️', kategori: 'Training' },
  { id: 'peregangan', label: 'Stretching & Posture', ringkas: 'Before and after routines', ke: '/peregangan', emoji: '🧘', kategori: 'Training' },
  { id: 'rencanaLatihan', label: 'Training Plan', ringkas: 'A programme for the weeks ahead', ke: '/training-plan', emoji: '🗓️', kategori: 'Training' },
  { id: 'ujiKebugaran', label: 'Fitness Tests', ringkas: 'Measure your capacity', ke: '/fitness-test', emoji: '⏱️', kategori: 'Training' },
  { id: 'gerak', label: 'Movement Analysis', ringkas: 'Examine your movement patterns', ke: '/analisis-gerak', emoji: '🎥', kategori: 'Training' },
  { id: 'sportsLab', label: 'Sports Lab', ringkas: 'Exercise physiology in depth', ke: '/sports-lab', emoji: '🔬', kategori: 'Training' },
  { id: 'latihanBeban', label: 'Weight Training', ringkas: 'Sets, reps, volume, and PRs per lift', ke: '/latihan-beban', emoji: '🏋️', kategori: 'Training' },
  // Grafik tujuh hari di beranda. Terdaftar sebagai widget tersendiri supaya
  // dapat dimatikan: sebelumnya kelimanya tampil apa pun pilihan pemakainya,
  // sehingga "Atur widget" terasa tidak berfungsi — orang mematikan Pola Tidur
  // dan grafik tidurnya tetap ada di layar.
  { id: 'grafikLatihan', label: '7-Day Training Chart', ringkas: 'Training minutes per day', ke: '/latihan', emoji: '📊', kategori: 'Training', bawaan: true },
  { id: 'grafikTidur', label: '7-Day Sleep Chart', ringkas: 'Hours slept per night', ke: '/pola-tidur', emoji: '🌙', kategori: 'Sleep & Recovery', bawaan: true },
  { id: 'grafikLangkah', label: '7-Day Steps Chart', ringkas: 'Steps per day', ke: '/tubuh', emoji: '👣', kategori: 'Body & Data', bawaan: true },
  { id: 'grafikGizi', label: '7-Day Nutrition Chart', ringkas: 'Calories logged per day', ke: '/nutrition', emoji: '🍽️', kategori: 'Nutrition', bawaan: true },
  { id: 'grafikDenyut', label: '14-Day Heart Rate Chart', ringkas: 'Resting heart rate over time', ke: '/tubuh', emoji: '❤️', kategori: 'Body & Data', bawaan: true },
  { id: 'pantauan', label: 'Watchlist', ringkas: 'The conditions, drugs, and scores you picked yourself', ke: '/cari', emoji: '★', kategori: 'Clinical & Learning', bawaan: true },
  { id: 'harian', label: 'Daily', ringkas: 'Any day you like: what was measured and what was felt', ke: '/harian', emoji: '📅', kategori: 'Body & Data', bawaan: true },
  { id: 'ikhtisar', label: 'Overview', ringkas: 'Every body number and its chart on one screen', ke: '/ikhtisar', emoji: '📈', kategori: 'Body & Data', bawaan: true },
  { id: 'tubuh', label: 'Body Hub', ringkas: 'Body numbers and their reference ranges', ke: '/tubuh', emoji: '🫁', kategori: 'Body & Data', bawaan: true },
  { id: 'bodyBattery', label: 'Body Battery', ringkas: 'Today\'s energy reserve', ke: '/body-battery', emoji: '🔋', kategori: 'Body & Data' },
  { id: 'detakJantung', label: 'Heart Rate', ringkas: 'Latest samples from your watch', ke: '/log-detak-jantung', emoji: '❤️', kategori: 'Body & Data' },
  { id: 'healthData', label: 'Health Data', ringkas: 'Which metrics your devices actually fill in', ke: '/health-data', emoji: '📲', kategori: 'Body & Data' },
  { id: 'komposisi', label: 'Body Composition', ringkas: 'Fat, muscle, and body water', ke: '/body', emoji: '⚖️', kategori: 'Body & Data' },
  { id: 'usiaBiologis', label: 'Biological Age', ringkas: 'An estimate of your body\'s age', ke: '/biological-age', emoji: '🕰️', kategori: 'Body & Data' },
  { id: 'organ', label: 'Organ Vitality', ringkas: 'How each organ system is doing', ke: '/organ-vitality', emoji: '🫀', kategori: 'Body & Data' },
  { id: 'labDecoder', label: 'Read Your Lab Report', ringkas: 'Translate laboratory numbers', ke: '/lab-decoder', emoji: '🧾', kategori: 'Body & Data' },
  { id: 'rppg', label: 'Camera Heart Rate', ringkas: 'Measure your pulse through your face', ke: '/rppg-heart-rate', emoji: '📷', kategori: 'Body & Data' },
  { id: 'vokal', label: 'Voice Biomarkers', ringkas: 'Health signals in the voice', ke: '/vocal-biomarkers', emoji: '🎙️', kategori: 'Body & Data' },
  { id: 'tenaga', label: 'Energy Today', ringkas: 'Self-reported, across 14 days', ke: '/harian', emoji: '🔋', kategori: 'Body & Data', bawaan: true },
  { id: 'hidrasi2', label: 'Fluids Today', ringkas: 'Against your own baseline', ke: '/hydration', emoji: '💧', kategori: 'Nutrition', bawaan: true },
  { id: 'cahaya', label: 'Morning Light', ringkas: 'Days in a row', ke: '/harian', emoji: '🌅', kategori: 'Body & Data', bawaan: true },
  { id: 'tangga', label: 'Floors Climbed', ringkas: 'Today\'s stairs vs your usual', ke: '/tubuh', emoji: '🪜', kategori: 'Training', bawaan: true },
  { id: 'vo2tren', label: 'VO₂max', ringkas: 'How your readings have moved', ke: '/longevity', emoji: '🫁', kategori: 'Training', bawaan: true },
  { id: 'komposisi', label: 'Body Composition', ringkas: 'Weight, fat, skeletal muscle', ke: '/tubuh', emoji: '⚖️', kategori: 'Body & Data', bawaan: true },
  { id: 'suplemen', label: 'Supplements', ringkas: 'Your own list — no recommendations', ke: '/harian', emoji: '💊', kategori: 'Nutrition', bawaan: true },
  { id: 'suhuEkstrem', label: 'Heat & Cold', ringkas: 'Sauna and cold immersion', ke: '/harian', emoji: '🔥', kategori: 'Sleep & Recovery', bawaan: true },
  { id: 'pangan', label: 'Packaged Food Lookup', ringkas: 'Barcode or name, from Open Food Facts', ke: '/nutrition', emoji: '🔎', kategori: 'Nutrition', bawaan: true },
  { id: 'obatPengingat', label: 'Medication', ringkas: 'Next dose and active reminders', ke: '/med-reminders', emoji: '💊', kategori: 'Services & Emergency', bawaan: true },
  { id: 'beban', label: 'Lifting Volume', ringkas: 'Eight weeks and per-lift records', ke: '/latihan-beban', emoji: '🏋️', kategori: 'Training', bawaan: true },
  { id: 'ukurBerkala', label: 'Periodic Measures', ringkas: 'Grip strength and balance', ke: '/tubuh', emoji: '✊', kategori: 'Body & Data', bawaan: true },
  { id: 'skrining', label: 'Screening & Vaccines', ringkas: 'What\'s due, on your own schedule', ke: '/tubuh', emoji: '🗓️', kategori: 'Clinical & Learning', bawaan: true },
  { id: 'amsler', label: 'Amsler Grid', ringkas: 'Central-vision self-monitoring', ke: '/tubuh', emoji: '👁️', kategori: 'Clinical & Learning', bawaan: true },
  { id: 'layar', label: 'Focus Sessions Logged', ringkas: 'Focused minutes today and this week', ke: '/harian', emoji: '🖥️', kategori: 'Body & Data', bawaan: true },
  { id: 'peregangan', label: '3-Minute Stretch', ringkas: 'Five guided movements', ke: '/latihan', emoji: '🤸', kategori: 'Training', bawaan: true },
  { id: 'tekananSebar', label: 'Blood Pressure Spread', ringkas: 'Mean and range across readings', ke: '/tubuh', emoji: '📉', kategori: 'Body & Data', bawaan: true },
  { id: 'rangkaian', label: 'Habit Streaks', ringkas: 'Days in a row, with no punishment', ke: '/harian', emoji: '🔗', kategori: 'Body & Data', bawaan: true },
  { id: 'jetlag', label: 'Jet Lag', ringkas: 'Shift your sleep before you fly', ke: '/harian', emoji: '✈️', kategori: 'Sleep & Recovery', bawaan: true },
  { id: 'nadiPanjang', label: 'Resting HR, 30 Days', ringkas: 'Against your own usual band', ke: '/tubuh', emoji: '❤️', kategori: 'Body & Data', bawaan: true },
  { id: 'tidur14', label: 'Sleep, 14 Nights', ringkas: 'Median, and the nights that fell short', ke: '/pola-tidur', emoji: '🌙', kategori: 'Sleep & Recovery', bawaan: true },
  { id: 'muatanPekan', label: 'Training Minutes per Week', ringkas: 'The last eight weeks', ke: '/latihan', emoji: '📈', kategori: 'Training', bawaan: true },
  { id: 'kaloriBanding', label: 'Logged Today', ringkas: 'Food and training you\'ve recorded', ke: '/nutrisi', emoji: '🍽️', kategori: 'Nutrition', bawaan: true },
  { id: 'tdee', label: 'Daily Energy', ringkas: 'BMR, TDEE, calorie target and macros', ke: '/macro-lab', emoji: '🔥', kategori: 'Nutrition', bawaan: true },
  { id: 'aturanAngka', label: 'How Your Numbers Work', ringkas: 'What each number reads, what moves it, and what to do', ke: '/how-numbers-work', emoji: '🎯', kategori: 'Body & Data' },
  { id: 'kalistenik', label: 'Calisthenics Ladder', ringkas: 'Beginner to advanced — 109 movements, 4 phases', ke: '/calisthenics', emoji: '🤸', kategori: 'Training' },
  { id: 'ayatHarian', label: 'Verse of the Day', ringkas: 'One verse, both translations, recitation and commentary', ke: '/scripture', emoji: '📖', kategori: 'Faith & Life' },
  { id: 'kepatuhan', label: 'Adherence, 14 Days', ringkas: 'Complete days, partial days, and missed', ke: '/harian', emoji: '💊', kategori: 'Body & Data', bawaan: true },
  { id: 'beratTren', label: 'Weight, 90 Days', ringkas: 'The three-month direction, not day-to-day noise', ke: '/tubuh', emoji: '⚖️', kategori: 'Body & Data', bawaan: true },
  { id: 'lab', label: 'Lab Results', ringkas: 'HbA1c, ApoB, eGFR — and how they\'ve moved', ke: '/tubuh', emoji: '🧪', kategori: 'Clinical & Learning', bawaan: true },
  { id: 'lingkungan', label: 'Air & UV', ringkas: 'AQI and UV index for your city', ke: '/tubuh', emoji: '🌤️', kategori: 'Body & Data', bawaan: true },
  { id: 'hrv', label: 'Overnight HRV', ringkas: 'Against your 14-day usual', ke: '/tubuh?t=jantung', emoji: '💓', kategori: 'Sleep & Recovery', bawaan: true },
  { id: 'tahapTidur', label: 'Sleep Stages', ringkas: 'Deep, REM, and core', ke: '/pola-tidur', emoji: '🛌', kategori: 'Sleep & Recovery', bawaan: true },
  { id: 'efisiensiTidur', label: 'Sleep Efficiency', ringkas: 'Sleep ÷ time in bed', ke: '/pola-tidur', emoji: '📊', kategori: 'Sleep & Recovery', bawaan: true },
  { id: 'lajuNapas', label: 'Respiratory Rate', ringkas: 'Breaths per minute overnight', ke: '/tubuh', emoji: '🌬️', kategori: 'Body & Data', bawaan: true },
  { id: 'saturasi', label: 'Oxygen Saturation', ringkas: 'Overnight SpO₂', ke: '/tubuh', emoji: '🩸', kategori: 'Body & Data', bawaan: true },
  { id: 'suhu', label: 'Body Temperature', ringkas: 'Deviation from your usual', ke: '/tubuh', emoji: '🌡️', kategori: 'Body & Data', bawaan: true },
  { id: 'zona2', label: 'Zone 2 This Week', ringkas: 'Minutes at 60–70% of max HR', ke: '/latihan?t=analisis', emoji: '🫀', kategori: 'Training', bawaan: true },
  { id: 'hrr', label: 'Heart Rate Recovery', ringkas: 'How many bpm it drops in one minute', ke: '/latihan?t=analisis', emoji: '📉', kategori: 'Training', bawaan: true },
  { id: 'utangTidur', label: 'Sleep Debt', ringkas: 'Seven nights against your usual', ke: '/pola-tidur', emoji: '😴', kategori: 'Sleep & Recovery', bawaan: true },
  { id: 'tekanan', label: 'Blood Pressure', ringkas: 'Systolic and diastolic', ke: '/tubuh', emoji: '🩸', kategori: 'Body & Data', bawaan: true },
  { id: 'napas', label: '2-Minute Breathing', ringkas: 'A guided breathing pattern', ke: '/harian', emoji: '🌬️', kategori: 'Body & Data', bawaan: true },
  { id: 'duduk', label: 'Sitting', ringkas: 'A stand-up nudge every 30 minutes', ke: '/harian', emoji: '🪑', kategori: 'Body & Data', bawaan: true },
  { id: 'mata', label: 'Eyes 20-20-20', ringkas: 'An eye break every 20 minutes', ke: '/tubuh', emoji: '👁️', kategori: 'Body & Data', bawaan: true },
  { id: 'fokus', label: 'Focus Session', ringkas: 'A countdown for work or screen time', ke: '/harian', emoji: '🎯', kategori: 'Body & Data', bawaan: true },
  { id: 'kopi', label: 'Coffee', ringkas: 'Last coffee and caffeine still on board', ke: '/pola-tidur', emoji: '☕', kategori: 'Nutrition', bawaan: true },
  { id: 'puasa', label: 'Fasting', ringkas: 'Time to Maghrib and your eating window', ke: '/prayer-times', emoji: '🌙', kategori: 'Faith & Life', bawaan: true },
  { id: 'pewaktu', label: 'Timers', ringkas: 'Naps and AMRAP', ke: '/latihan', emoji: '⏱️', kategori: 'Training', bawaan: true },
  { id: 'pengingat', label: 'Reminders', ringkas: 'Training, team goals, and the call to prayer', ke: '/settings', emoji: '🔔', kategori: 'Services & Emergency', bawaan: true },
  { id: 'ringkasanKarya', label: 'Book & Film Summaries', ringkas: 'One paragraph per book and film', ke: '/ringkasan-karya', emoji: '📚', kategori: 'Faith & Life', bawaan: true },
  { id: 'inspirasi', label: 'Inspiration', ringkas: 'Stories and quotes, changing daily', ke: '/resilience-stories', emoji: '✨', kategori: 'Faith & Life', bawaan: true },
  { id: 'kartuBelajar', label: 'Study Cards', ringkas: 'Diagnosis → management, answer hidden first', ke: '/med-study?bagian=therapy', emoji: '🗂️', kategori: 'Clinical & Learning', bawaan: true },
  { id: 'soalHarian', label: 'Question of the Day', ringkas: 'One question, with the reasoning', ke: '/med-study', emoji: '❓', kategori: 'Clinical & Learning', bawaan: true },
  { id: 'skorTim', label: 'Your Teams\' Scores', ringkas: 'Matches for the teams you follow', ke: '/sports-scores', emoji: '⚽', kategori: 'Faith & Life', bawaan: true },
  { id: 'tidurLebar', label: 'Sleep, 14 Nights', ringkas: 'Tonight against your usual', ke: '/pola-tidur', emoji: '🌙', kategori: 'Sleep & Recovery', bawaan: true },
  { id: 'giziLebar', label: 'Intake Today', ringkas: 'Calories and macro split', ke: '/nutrition', emoji: '🥗', kategori: 'Nutrition', bawaan: true },
  { id: 'motivasi', label: 'This Week', ringkas: 'Days in a row and training minutes', ke: '/harian', emoji: '🔥', kategori: 'Body & Data', bawaan: true },
  { id: 'obatCepat', label: 'Drugs & Doses', ringkas: 'Look up a dose straight from the home screen', ke: '/med-study?bagian=therapy', emoji: '💊', kategori: 'Clinical & Learning', bawaan: true },
  { id: 'kalkulatorCepat', label: 'Quick Maths', ringkas: 'BMI, MAP, BSA, dose per kg', ke: '/clinical-calculators', emoji: '🧮', kategori: 'Clinical & Learning', bawaan: true },
  { id: 'stasiunSering', label: 'Most Frequent Stations', ringkas: 'OSCE cases by system', ke: '/osce-ukmppd', emoji: '🩺', kategori: 'Clinical & Learning', bawaan: true },
  { id: 'konsistensi', label: 'Consistency', ringkas: 'Days logged over 12 weeks', ke: '/harian', emoji: '🟩', kategori: 'Body & Data', bawaan: true },
  { id: 'longevity', label: 'Longevity', ringkas: 'Evidence-based longevity', ke: '/longevity', emoji: '🌱', kategori: 'Body & Data' },
  { id: 'nutrisi', label: 'Nutrition', ringkas: 'Today\'s intake', ke: '/nutrition', emoji: '🥗', kategori: 'Nutrition', bawaan: true },
  { id: 'macroLab', label: 'Macro Lab', ringkas: 'Build macros around your goal', ke: '/macro-lab', emoji: '🍽️', kategori: 'Nutrition' },
  { id: 'hidrasi', label: 'Hydration', ringkas: 'Daily fluid requirement', ke: '/hydration', emoji: '🚰', kategori: 'Nutrition' },
  { id: 'kafein', label: 'Caffeine', ringkas: 'Safe limits and half-life', ke: '/caffeine', emoji: '☕', kategori: 'Nutrition' },
  { id: 'alkohol', label: 'Alcohol', ringkas: 'Count units and the risk that comes with them', ke: '/alcohol', emoji: '🍷', kategori: 'Nutrition' },
  { id: 'puasa', label: 'Fasting Timer', ringkas: 'Eating and fasting windows', ke: '/fasting', emoji: '⏳', kategori: 'Nutrition' },
  { id: 'suplemen', label: 'Supplements', ringkas: 'What holds up, and what doesn\'t', ke: '/supplements', emoji: '💊', kategori: 'Nutrition' },
  { id: 'carbonDiet', label: 'Food Carbon Footprint', ringkas: 'The environmental cost of how you eat', ke: '/carbon-diet', emoji: '🌍', kategori: 'Nutrition' },
  { id: 'tidur', label: 'Sleep Patterns', ringkas: 'Last night\'s duration and stages', ke: '/pola-tidur', emoji: '😴', kategori: 'Sleep & Recovery' },
  { id: 'utangTidur', label: 'Sleep Debt', ringkas: 'The shortfall as it accumulates', ke: '/sleep-debt', emoji: '🌙', kategori: 'Sleep & Recovery' },
  { id: 'kronotipe', label: 'Chronotype', ringkas: 'Your body clock', ke: '/chronotype', emoji: '🦉', kategori: 'Sleep & Recovery' },
  { id: 'apneaTidur', label: 'Sleep Apnoea Screen', ringkas: 'Snoring and pauses in breathing', ke: '/sleep-apnea-screen', emoji: '💤', kategori: 'Sleep & Recovery' },
  { id: 'epworth', label: 'Epworth Scale', ringkas: 'Excessive daytime sleepiness', ke: '/epworth-sleepiness', emoji: '😪', kategori: 'Sleep & Recovery' },
  { id: 'kesiapan', label: 'Readiness Today', ringkas: 'Ready to train, or in need of recovery', ke: '/readiness', emoji: '🔆', kategori: 'Sleep & Recovery' },
  { id: 'pemulihan', label: 'Recovery', ringkas: 'Tools for recovering after training', ke: '/recovery', emoji: '🛌', kategori: 'Sleep & Recovery' },
  { id: 'termal', label: 'Thermal Therapy', ringkas: 'Sauna and cold showers', ke: '/thermal-therapy', emoji: '🔥', kategori: 'Sleep & Recovery' },
  { id: 'napas', label: 'Breathwork', ringkas: 'Breathing patterns for calm and focus', ke: '/breathwork', emoji: '🌬️', kategori: 'Sleep & Recovery' },
  { id: 'jedaPostur', label: 'Posture Break', ringkas: 'A nudge to get up from your chair', ke: '/posture-breaks', emoji: '🪑', kategori: 'Sleep & Recovery' },
  { id: 'mentalHealth', label: 'Mental Health Screening', ringkas: 'PHQ-9 and GAD-7', ke: '/mental-health-screen', emoji: '🧩', kategori: 'Mind & Habits' },
  { id: 'syukur', label: 'Gratitude Journal', ringkas: 'Three things, every day', ke: '/gratitude', emoji: '🙏', kategori: 'Mind & Habits' },
  { id: 'perubahan', label: 'Change a Habit', ringkas: 'One habit at a time', ke: '/change', emoji: '🔁', kategori: 'Mind & Habits' },
  { id: 'ikigai', label: 'Ikigai', ringkas: 'Find your reason to get up in the morning', ke: '/ikigai', emoji: '🎋', kategori: 'Mind & Habits' },
  { id: 'harada', label: 'Harada 9×9 Grid', ringkas: 'One goal, 64 actions', ke: '/harada', emoji: '🧱', kategori: 'Mind & Habits' },
  { id: 'kompasHidup', label: 'Life Compass', ringkas: 'The direction and values you hold', ke: '/life-compass', emoji: '🧭', kategori: 'Mind & Habits' },
  { id: 'zat', label: 'Substance Use Screening', ringkas: 'Tobacco, alcohol, and the rest', ke: '/substance-use-screen', emoji: '🚭', kategori: 'Mind & Habits' },
  { id: 'nyeri', label: 'Pain Diary', ringkas: 'Record how your pain behaves', ke: '/pain-diary', emoji: '📔', kategori: 'Mind & Habits' },
  { id: 'vaksin', label: 'Vaccination Record', ringkas: 'Schedule and what you\'ve already had', ke: '/vaccine-tracker', emoji: '💉', kategori: 'Prevention & Screening' },
  { id: 'alergi', label: 'Allergy Record', ringkas: 'Your allergy history', ke: '/allergy-tracker', emoji: '⚠️', kategori: 'Prevention & Screening' },
  { id: 'obatPengingat', label: 'Medication Reminders', ringkas: 'When the next dose is due', ke: '/med-reminders', emoji: '⏰', kategori: 'Prevention & Screening' },
  { id: 'keluarga', label: 'Family Health', ringkas: 'Family history of disease', ke: '/family-health', emoji: '👨‍👩‍👧', kategori: 'Prevention & Screening' },
  { id: 'tumbuhAnak', label: 'Child Growth', ringkas: 'Weight and height curves', ke: '/child-growth', emoji: '🧒', kategori: 'Prevention & Screening' },
  { id: 'findrisc', label: 'FINDRISC', ringkas: '10-year diabetes risk', ke: '/findrisc', emoji: '🍬', kategori: 'Prevention & Screening' },
  { id: 'stroke', label: 'Stroke Risk', ringkas: 'Estimate it, then lower it', ke: '/stroke-risk', emoji: '🧠', kategori: 'Prevention & Screening' },
  { id: 'donorDarah', label: 'Blood Donation', ringkas: 'When you can give again', ke: '/blood-donation', emoji: '🩸', kategori: 'Prevention & Screening' },
  { id: 'donorOrgan', label: 'Organ Donor Card', ringkas: 'State your wishes', ke: '/organ-donor', emoji: '💗', kategori: 'Prevention & Screening' },
  { id: 'matahari', label: 'Sun Exposure', ringkas: 'Vitamin D, and where the safe limit sits', ke: '/sun-exposure', emoji: '☀️', kategori: 'Prevention & Screening' },
  { id: 'udara', label: 'Air Quality', ringkas: 'The air around you right now', ke: '/air-quality', emoji: '🌫️', kategori: 'Prevention & Screening' },
  { id: 'seksual', label: 'Sexual Health', ringkas: 'Information and screening', ke: '/sexual-health', emoji: '🫶', kategori: 'Prevention & Screening' },
  { id: 'darurat', label: 'Emergency Card', ringkas: 'Your details when it matters most', ke: '/emergency', emoji: '🆘', kategori: 'Services & Emergency', bawaan: true },
  { id: 'p3k', label: 'First Aid', ringkas: 'What to do in an emergency', ke: '/first-aid', emoji: '🚑', kategori: 'Services & Emergency' },
  { id: 'rumahSakit', label: 'Hospitals', ringkas: 'Nearest facilities', ke: '/hospitals', emoji: '🏥', kategori: 'Services & Emergency' },
  { id: 'apotek', label: 'Pharmacy', ringkas: 'Find and order medicine', ke: '/pharmacy', emoji: '🏪', kategori: 'Services & Emergency' },
  { id: 'konsultasi', label: 'Consultation', ringkas: 'Talk to a health professional', ke: '/consult', emoji: '💬', kategori: 'Services & Emergency' },
  { id: 'opiniKedua', label: 'Second Opinion', ringkas: 'A review by another doctor', ke: '/second-opinion', emoji: '🔁', kategori: 'Services & Emergency' },
  { id: 'siapKunjungan', label: 'Ready for the Doctor', ringkas: 'Your questions, written before you go', ke: '/visit-prep', emoji: '📋', kategori: 'Services & Emergency' },
  { id: 'pesanan', label: 'Orders', ringkas: 'Your order history', ke: '/orders', emoji: '📦', kategori: 'Services & Emergency' },
  { id: 'keuangan', label: 'Money', ringkas: 'Wallet and transactions', ke: '/keuangan', emoji: '💰', kategori: 'Services & Emergency' },
  { id: 'salat', label: 'Prayer Times', ringkas: 'Today\'s prayer times and the Qibla', ke: '/prayer-times', emoji: '🕌', kategori: 'Faith & Life' },
  { id: 'kitab', label: 'Scripture', ringkas: 'Daily reading', ke: '/scripture', emoji: '📜', kategori: 'Faith & Life' },
  { id: 'hadis', label: 'Hadith', ringkas: 'A hadith collection', ke: '/hadith', emoji: '🕋', kategori: 'Faith & Life' },
  { id: 'komunitas', label: 'Community', ringkas: 'News and discussion', ke: '/community', emoji: '👥', kategori: 'Faith & Life' },
  { id: 'klub', label: 'Clubs', ringkas: 'Groups that train together', ke: '/clubs', emoji: '🏆', kategori: 'Faith & Life' },
  { id: 'skorOlahraga', label: 'Sports Scores', ringkas: 'Your teams\' matches', ke: '/sports-scores', emoji: '⚽', kategori: 'Faith & Life' },
  { id: 'kisah', label: 'Stories of Resilience', ringkas: 'People who kept going', ke: '/resilience-stories', emoji: '📻', kategori: 'Faith & Life' },
  { id: 'jelajah', label: 'Explore', ringkas: 'Places and routes near you', ke: '/jelajah', emoji: '🗺️', kategori: 'Faith & Life' },

  // ───────────────────────────────────────────────────────────────────────────
  // GELOMBANG SUSULAN: halaman yang sudah ada tetapi hanya terjangkau lewat
  // beberapa lapis menu. Selama tidak terdaftar di sini, satu-satunya jalan ke
  // sana adalah menebak namanya di /semua-fitur — dan fitur yang harus ditebak
  // sama saja dengan fitur yang tidak ada. Semua tetap MATI secara bawaan;
  // yang berubah hanyalah dapat-tidaknya dinyalakan dari Beranda.
  //
  // Halaman pengurus (admin, owner, verifikator, editor), halaman akun
  // (billing, settings, legal, pricing) dan halaman sistem sengaja TIDAK
  // dimasukkan: tempatnya di menu samping, bukan di pintasan beranda.
  // ───────────────────────────────────────────────────────────────────────────
  { id: 'semuaFitur', label: 'All Features', ringkas: 'Every page, and what each is for', ke: '/semua-fitur', emoji: '🧭', kategori: 'Clinical & Learning' },
  { id: 'cariGlobal', label: 'Search', ringkas: 'Find anything in the app from one box', ke: '/search', emoji: '🔎', kategori: 'Clinical & Learning' },
  { id: 'clinicalHub', label: 'Other Clinical Tools', ringkas: 'The door to every clinical tool and AI assist', ke: '/clinical-hub', emoji: '🩺', kategori: 'Clinical & Learning' },
  { id: 'chatbot', label: 'Ask About Health', ringkas: 'Plain-language answers, with their sources', ke: '/chatbot', emoji: '💬', kategori: 'Clinical & Learning' },
  { id: 'panduanPakai', label: 'Getting Started', ringkas: 'Six steps for your first time here', ke: '/tutorial', emoji: '🗺️', kategori: 'Clinical & Learning' },
  { id: 'catatanLog', label: 'Logs & Stats', ringkas: 'Daily records and the numbers they add up to', ke: '/logs', emoji: '🗒️', kategori: 'Body & Data' },
  { id: 'profilSaya', label: 'My Profile', ringkas: 'Your height, weight, and health history', ke: '/profile', emoji: '🙋', kategori: 'Body & Data' },

  // Skor klinis yang selama ini hanya ada di dalam Kalkulator Hub.
  { id: 'perc', label: 'PERC Rule', ringkas: 'Rule out pulmonary embolism in low-risk patients', ke: '/perc-rule', emoji: '🫁', kategori: 'Calculators & Scores' },
  { id: 'padua', label: 'Padua Score', ringkas: 'Whether medical inpatients need VTE prophylaxis', ke: '/padua-score', emoji: '🩸', kategori: 'Calculators & Scores' },
  { id: 'caprini', label: 'Caprini Score', ringkas: 'Whether surgical patients need VTE prophylaxis', ke: '/caprini-score', emoji: '🩹', kategori: 'Calculators & Scores' },
  { id: 'duke', label: 'Duke Criteria', ringkas: 'Diagnosing infective endocarditis', ke: '/duke-criteria', emoji: '❤️‍🩹', kategori: 'Calculators & Scores' },
  { id: 'lights', label: "Kriteria Light", ringkas: 'Eksudat atau transudat pada efusi pleura', ke: '/lights-criteria', emoji: '💧', kategori: 'Calculators & Scores' },
  { id: 'ranson', label: 'Ranson Criteria', ringkas: 'Pancreatitis severity on admission and at 48 hours', ke: '/ranson-criteria', emoji: '🧪', kategori: 'Calculators & Scores' },
  { id: 'bisap', label: 'BISAP Score', ringkas: 'Pancreatitis severity within the first 24 hours', ke: '/bisap-score', emoji: '⏱️', kategori: 'Calculators & Scores' },
  { id: 'blatchford', label: 'Glasgow-Blatchford', ringkas: 'Who needs admission in upper GI bleeding', ke: '/glasgow-blatchford-score', emoji: '🩸', kategori: 'Calculators & Scores' },
  { id: 'rockall', label: 'Rockall Score', ringkas: 'Rebleeding risk after endoscopy', ke: '/rockall-score', emoji: '🔬', kategori: 'Calculators & Scores' },
  { id: 'maddrey', label: 'Maddrey DF', ringkas: 'Whether steroids are indicated in alcoholic hepatitis', ke: '/maddrey-score', emoji: '🫀', kategori: 'Calculators & Scores' },
  { id: 'charlson', label: 'Charlson Index', ringkas: 'Comorbidity burden and 10-year survival', ke: '/charlson-index', emoji: '📊', kategori: 'Calculators & Scores' },
  { id: 'fourTs', label: '4Ts Score', ringkas: 'Likelihood of heparin-induced thrombocytopenia', ke: '/4ts-score', emoji: '🧫', kategori: 'Calculators & Scores' },
  { id: 'aaGradient', label: 'A-a Gradient', ringkas: 'Where hypoxaemia comes from: lung or hypoventilation', ke: '/aa-gradient', emoji: '🌬️', kategori: 'Calculators & Scores' },
  { id: 'fena', label: 'FeNa', ringkas: 'Pre-renal AKI or acute tubular necrosis', ke: '/fena-calculator', emoji: '🚰', kategori: 'Calculators & Scores' },
  { id: 'kalsiumKoreksi', label: 'Corrected Calcium', ringkas: 'Adjust calcium when albumin is low', ke: '/corrected-calcium', emoji: '🦴', kategori: 'Calculators & Scores' },
  { id: 'osmolalitas', label: 'Serum Osmolality', ringkas: 'Osmolal gap, to screen for alcohol poisoning', ke: '/serum-osmolality', emoji: '⚗️', kategori: 'Calculators & Scores' },
  { id: 'kadAnak', label: 'Paediatric DKA', ringkas: 'Bolus, deficit, maintenance, potassium, and insulin', ke: '/pediatric-dka-calculator', emoji: '🧒', kategori: 'Calculators & Scores' },

  // Latihan dan sains olahraga.
  { id: 'fitnessHub', label: 'Fitness Hub', ringkas: 'The door to every fitness and training tool', ke: '/fitness-hub', emoji: '🏃', kategori: 'Training' },
  { id: 'athlete', label: 'Athlete Board', ringkas: 'Heart-rate zones, load, and GPS runs', ke: '/athlete', emoji: '🏅', kategori: 'Training' },
  { id: 'fisiologiLatihan', label: 'Exercise Physiology', ringkas: 'Load, status, recovery time, and readiness', ke: '/fisiologi-latihan', emoji: '📈', kategori: 'Training' },
  { id: 'sportsScience', label: 'Sports Science', ringkas: 'The evidence behind your numbers', ke: '/sports-science', emoji: '🔬', kategori: 'Training' },
  { id: 'labLatihan', label: 'Performance Lab', ringkas: 'Training load, VO₂max, and performance measures', ke: '/lab', emoji: '🧬', kategori: 'Training' },
  { id: 'latihanDasar', label: 'Foundation Training', ringkas: 'Pace zones, push-ups, pull-ups, sit-ups, posture', ke: '/latihan-dasar', emoji: '💪', kategori: 'Training' },
  { id: 'alatEndurance', label: 'Endurance Tools', ringkas: 'Fuelling, sweat rate, FTP, heat adaptation', ke: '/alat-endurance', emoji: '🚴', kategori: 'Training' },
  { id: 'assessmentAwal', label: 'Initial Assessment', ringkas: 'Your starting point: fitness and movement patterns', ke: '/assessment', emoji: '📋', kategori: 'Training' },
  { id: 'shapeForming', label: 'Shape Forming', ringkas: 'A structured programme for body composition', ke: '/shape-forming', emoji: '🧗', kategori: 'Training' },
  { id: 'movementToolkit', label: 'Movement Toolkit', ringkas: 'Grip, balance, zone 2, short sessions', ke: '/movement-toolkit', emoji: '🤸', kategori: 'Training' },

  // Longevity dan data tubuh.
  { id: 'longevitySains', label: 'The Science of Ageing', ringkas: 'Hallmarks of ageing, NAD+, sirtuins, rapamycin', ke: '/longevity-science', emoji: '🧪', kategori: 'Body & Data' },
  { id: 'longevityKurikulum', label: 'Longevity Curriculum', ringkas: 'A structured syllabus in longevity medicine', ke: '/longevity-curriculum', emoji: '🎓', kategori: 'Body & Data' },
  { id: 'simulatorSehat', label: 'What-If Simulator', ringkas: 'Today\'s choices against ten-year risk', ke: '/health-simulator', emoji: '🔮', kategori: 'Body & Data' },
  { id: 'dataLab', label: 'Data Lab', ringkas: 'Upload your health data, turn it into charts', ke: '/data-lab', emoji: '📂', kategori: 'Body & Data' },
  { id: 'dataLabLanjut', label: 'Advanced Data Lab', ringkas: 'Blood trends, PhenoAge, an encrypted vault', ke: '/data-lab-advanced', emoji: '🔐', kategori: 'Body & Data' },
  { id: 'snp', label: 'SNP Profiler', ringkas: 'Raw DNA data processed in your own browser', ke: '/snp-profiler', emoji: '🧬', kategori: 'Body & Data' },
  { id: 'bioSimulator', label: 'Bio Simulator', ringkas: 'mTOR/AMPK, circadian rhythm, and telomeres', ke: '/bio-simulators', emoji: '⚙️', kategori: 'Body & Data' },
  { id: 'modelPrediktif', label: 'Predictive Models', ringkas: 'Autophagy timing, cortisol curves, glycaemic load', ke: '/predictive-models-toolkit', emoji: '📐', kategori: 'Body & Data' },
  { id: 'vitapulse', label: 'VitaPulse', ringkas: 'Track heart rate, blood pressure, and body signs', ke: '/vitapulse', emoji: '💓', kategori: 'Body & Data' },
  { id: 'pelacakKlinis', label: 'Clinical Trackers', ringkas: 'SpO₂, ECG, jet lag, pregnancy, wheelchair use', ke: '/pelacak-klinis', emoji: '📟', kategori: 'Body & Data' },
  { id: 'penilaianDiri', label: 'Self-Assessments', ringkas: 'Telomere quiz, inflammation score, waist-to-height', ke: '/self-assessment-toolkit', emoji: '📝', kategori: 'Body & Data' },

  // Pencegahan, gizi, tidur, jiwa.
  { id: 'toksin', label: 'Toxin Checklist', ringkas: 'Cut exposure to plastics, cleaners, dirty air', ke: '/toxin-checklist', emoji: '☣️', kategori: 'Prevention & Screening' },
  { id: 'realityCheck', label: 'Reality Check', ringkas: 'CAGE screening and pack-year arithmetic', ke: '/reality-check', emoji: '🪞', kategori: 'Prevention & Screening' },
  { id: 'aesthetic', label: 'Skincare', ringkas: 'How to look after your skin and face', ke: '/aesthetic', emoji: '🧴', kategori: 'Prevention & Screening' },
  { id: 'bodyToolkit', label: 'Body Toolkit', ringkas: 'Skin routines, symptom maps, movement notes', ke: '/body-toolkit', emoji: '🧰', kategori: 'Prevention & Screening' },
  { id: 'gizisToolkit', label: 'Nutrition Toolkit', ringkas: 'Mediterranean, sugar log, plant diversity', ke: '/nutrition-toolkit', emoji: '🥗', kategori: 'Nutrition' },
  { id: 'sleepToolkit', label: 'Sleep Toolkit', ringkas: 'Cycle alarm, naps, dream journal, soundscapes', ke: '/sleep-toolkit', emoji: '🌙', kategori: 'Sleep & Recovery' },
  { id: 'mindToolkit', label: 'Mind Toolkit', ringkas: 'Brain training, memory, reaction time, stress', ke: '/mind-toolkit', emoji: '🧠', kategori: 'Mind & Habits' },
  { id: 'sehatSibuk', label: 'Healthy While Busy', ringkas: 'Healthy habits that fit a packed schedule', ke: '/sehat-sibuk', emoji: '⏳', kategori: 'Mind & Habits' },
  { id: 'gameLongevity', label: 'Game Center', ringkas: 'Habit bingo, report cards, and a daily quote', ke: '/longevity-game-center', emoji: '🎲', kategori: 'Mind & Habits' },

  // Sosial dan layanan.
  { id: 'kabarTeman', label: 'Friends\' Feed', ringkas: 'What the people you follow are doing', ke: '/feed', emoji: '📰', kategori: 'Services & Emergency' },
  { id: 'pesanPribadi', label: 'Messages', ringkas: 'Private conversations with other users', ke: '/messages', emoji: '✉️', kategori: 'Services & Emergency' },
  { id: 'pasarMateri', label: 'Marketplace', ringkas: 'Buy and sell notes and material between users', ke: '/marketplace', emoji: '🛍️', kategori: 'Services & Emergency' },
  { id: 'materiSaya', label: 'My Material', ringkas: 'What you\'ve written, and what you\'ve saved', ke: '/my-materials', emoji: '📚', kategori: 'Services & Emergency' },
]

/**
 * WIDGET YANG BENAR-BENAR HIDUP.
 *
 * Hanya id di sini yang boleh muncul di papan beranda dan di pemilih widget.
 * Alasannya sederhana dan diminta langsung oleh pemakainya: sebuah widget yang
 * hanya berisi lambang dan nama fitur bukan widget — ia pintu. Pintu sudah ada
 * tempatnya sendiri (kisi fitur dan pencarian), dan menaruhnya di papan widget
 * membuat papan itu penuh oleh benda yang tidak menjawab apa pun.
 *
 * Sisa katalog WIDGETS tetap ada dan tetap dipakai — oleh kisi fitur, oleh
 * halaman Semua Fitur, dan oleh mesin pencari. Yang berubah hanyalah siapa
 * yang berhak menempati beranda.
 */
export const WIDGET_HIDUP = [
  // ── Ringkasan hari ini ──────────────────────────────────────────────────
  'pantauan', 'kebugaran', 'salat', 'konsistensi', 'motivasi',
  // ── Tidur & pemulihan ───────────────────────────────────────────────────
  'tidurLebar', 'utangTidur', 'hrv', 'tahapTidur', 'efisiensiTidur', 'suhuEkstrem',
  // ── Latihan ─────────────────────────────────────────────────────────────
  'zona2', 'hrr', 'vo2tren', 'tangga', 'pewaktu',
  // ── Gizi ────────────────────────────────────────────────────────────────
  'giziLebar', 'hidrasi2', 'pangan', 'kopi', 'puasa', 'suplemen',
  // ── Tubuh & vital ───────────────────────────────────────────────────────
  'komposisi', 'tekanan', 'lajuNapas', 'saturasi', 'suhu', 'lab', 'tenaga',
  'obatPengingat', 'beban', 'ukurBerkala', 'skrining',
  'amsler', 'layar', 'peregangan', 'tekananSebar', 'rangkaian', 'jetlag',
  'nadiPanjang', 'tidur14', 'muatanPekan', 'kaloriBanding', 'tdee', 'kepatuhan', 'beratTren',
  // ── Grafik tujuh hari (kisi dua kolom, bukan tumpukan) ──────────────────
  'grafikLatihan', 'grafikTidur', 'grafikLangkah', 'grafikGizi', 'grafikDenyut',
  // ── Belajar & klinis ────────────────────────────────────────────────────
  'obatCepat', 'kalkulatorCepat', 'stasiunSering', 'kartuBelajar', 'soalHarian', 'inspirasi', 'ringkasanKarya',
  // ── Hidup & lingkungan ──────────────────────────────────────────────────
  'skorTim', 'lingkungan', 'cahaya', 'mata', 'fokus', 'duduk', 'napas', 'pengingat', 'ayatHarian',
] as const

/** Katalog yang boleh menempati beranda. */
export function widgetPapan(): WidgetDef[] {
  return WIDGETS.filter((w) => (WIDGET_HIDUP as readonly string[]).includes(w.id))
}

const KUNCI = 'pmd-home-widgets'

export function widgetBawaan(): string[] {
  return widgetPapan().filter((w) => w.bawaan).map((w) => w.id)
}

export function ambilWidget(): string[] {
  try {
    const raw = localStorage.getItem(KUNCI)
    if (!raw) return widgetBawaan()
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return widgetBawaan()
    // Saring id yang sudah tidak ada lagi, agar kartu yang dihapus dari aplikasi
    // tidak meninggalkan slot kosong di beranda seseorang.
    return arr.filter((id) => typeof id === 'string' && (WIDGET_HIDUP as readonly string[]).includes(id))
  } catch {
    return widgetBawaan()
  }
}

export function simpanWidget(ids: string[]): void {
  try { localStorage.setItem(KUNCI, JSON.stringify(ids)) } catch { /* kuota penuh */ }
  try { window.dispatchEvent(new Event('panacea:home-widgets')) } catch { /* ignore */ }
}

export function alihkanWidget(id: string): string[] {
  const kini = ambilWidget()
  const next = kini.includes(id) ? kini.filter((x) => x !== id) : [...kini, id]
  simpanWidget(next)
  return next
}
