// ─────────────────────────────────────────────────────────────────────────────
// Katalog jenis olahraga — satu sumber untuk seluruh aplikasi.
//
// KENAPA DIPINDAHKAN KE SINI. Daftar ini sebelumnya berupa const lokal di
// dalam halaman Gizi, sehingga satu-satunya layar yang dapat memakainya adalah
// layar yang kebetulan memuatnya. Pencatat latihan, pengingat, dan papan atlet
// semuanya memerlukan daftar yang sama, dan menyalinnya berarti tiga daftar
// yang akan berbeda dalam beberapa bulan.
//
// TENTANG NILAI MET. Angkanya mengikuti Compendium of Physical Activities
// (Ainsworth dkk.), yang menyatakan biaya energi sebagai kelipatan metabolisme
// istirahat. Ia RATA-RATA POPULASI, bukan pengukuran pada satu orang: dua
// orang yang berenang "santai" dapat berbeda jauh, dan MET tidak melihat
// perbedaan itu. Karena itu kalori yang diturunkan darinya selalu perkiraan,
// dan di layar disebut demikian.
//
// MET JUGA MEREMEHKAN LATIHAN BEBAN. Angkat beban berat menuntut jauh lebih
// banyak daripada yang diakui denyut jantung maupun MET, sebab sebagian besar
// biayanya datang sesudah setnya selesai. Ini disebutkan di layar yang
// memakainya, bukan dipendam di sini.
// ─────────────────────────────────────────────────────────────────────────────

export interface JenisOlahraga {
  name: string
  emoji: string
  /** Kelipatan metabolisme istirahat (Compendium of Physical Activities). */
  met: number
  int: string
  /** Layak dilacak GPS — menentukan apakah jarak dan pace masuk akal. */
  gps: boolean
  cat: string
  hiit: boolean
}

export const JENIS_OLAHRAGA: JenisOlahraga[] = [] = [
  // CARDIO - WALKING
  { name: 'Casual walk', emoji: '🚶', met: 2.5, int: 'Low', gps: true, cat: 'Cardio', hiit: false },
  { name: 'Brisk walk', emoji: '🚶‍♂️', met: 3.5, int: 'Moderate', gps: true, cat: 'Cardio', hiit: false },
  { name: 'Nordic walking', emoji: '🚶‍♀️', met: 4.8, int: 'Moderate', gps: true, cat: 'Cardio', hiit: false },
  { name: 'Power walking', emoji: '⚡', met: 5.5, int: 'Moderate', gps: true, cat: 'Cardio', hiit: false },
  // CARDIO - RUNNING
  { name: 'Jogging', emoji: '🏃', met: 7.0, int: 'Moderate', gps: true, cat: 'Cardio', hiit: false },
  { name: 'Easy run', emoji: '🏃‍♂️', met: 8.0, int: 'Moderate', gps: true, cat: 'Cardio', hiit: false },
  { name: 'Running', emoji: '🏃‍♀️', met: 9.8, int: 'High', gps: true, cat: 'Cardio', hiit: false },
  { name: 'Fast run', emoji: '💨', met: 12.5, int: 'Very High', gps: true, cat: 'Cardio', hiit: true },
  { name: '100m sprint', emoji: '⚡', met: 18.0, int: 'Very High', gps: true, cat: 'Cardio', hiit: true },
  { name: '200m sprint', emoji: '⚡', met: 16.0, int: 'Very High', gps: true, cat: 'Cardio', hiit: true },
  { name: '400m sprint', emoji: '🔥', met: 14.0, int: 'Very High', gps: true, cat: 'Cardio', hiit: true },
  { name: 'Fartlek', emoji: '🌀', met: 11.5, int: 'High', gps: true, cat: 'Cardio', hiit: true },
  { name: 'Tempo run', emoji: '🎯', met: 10.8, int: 'High', gps: true, cat: 'Cardio', hiit: false },
  { name: 'Interval run', emoji: '🔄', met: 13.0, int: 'Very High', gps: true, cat: 'Cardio', hiit: true },
  { name: 'Uphill run', emoji: '⛰️', met: 12.0, int: 'Very High', gps: true, cat: 'Cardio', hiit: true },
  { name: 'Trail running', emoji: '🏔️', met: 10.5, int: 'High', gps: true, cat: 'Cardio', hiit: false },
  { name: 'Treadmill walk', emoji: '🚶', met: 3.0, int: 'Low', gps: false, cat: 'Cardio', hiit: false },
  { name: 'Treadmill run', emoji: '🏃', met: 9.0, int: 'High', gps: false, cat: 'Cardio', hiit: false },
  // CARDIO - CYCLING
  { name: 'Casual cycling', emoji: '🚴', met: 6.0, int: 'Moderate', gps: true, cat: 'Cardio', hiit: false },
  { name: 'Moderate cycling', emoji: '🚴‍♂️', met: 8.0, int: 'Moderate', gps: true, cat: 'Cardio', hiit: false },
  { name: 'Intense cycling', emoji: '🚴‍♀️', met: 12.0, int: 'High', gps: true, cat: 'Cardio', hiit: true },
  { name: 'Cycling time trial', emoji: '⏱️', met: 16.0, int: 'Very High', gps: true, cat: 'Cardio', hiit: true },
  { name: 'Indoor cycling', emoji: '🚲', met: 8.5, int: 'High', gps: false, cat: 'Cardio', hiit: false },
  { name: 'Spinning HIIT', emoji: '🔥', met: 14.0, int: 'Very High', gps: false, cat: 'Cardio', hiit: true },
  // CARDIO - SWIMMING
  { name: 'Casual swimming', emoji: '🏊', met: 5.8, int: 'Moderate', gps: false, cat: 'Cardio', hiit: false },
  { name: 'Freestyle swimming', emoji: '🏊‍♂️', met: 8.0, int: 'High', gps: false, cat: 'Cardio', hiit: false },
  { name: 'Butterfly swimming', emoji: '🦋', met: 11.0, int: 'Very High', gps: false, cat: 'Cardio', hiit: true },
  { name: 'HIIT swimming', emoji: '🔥', met: 12.0, int: 'Very High', gps: false, cat: 'Cardio', hiit: true },
  // CARDIO - OTHER
  { name: 'Trekking/Hiking', emoji: '🥾', met: 6.0, int: 'Moderate', gps: true, cat: 'Cardio', hiit: false },
  { name: 'Aerobics', emoji: '💃', met: 6.5, int: 'Moderate', gps: false, cat: 'Cardio', hiit: false },
  { name: 'Zumba', emoji: '🕺', met: 6.5, int: 'Moderate', gps: false, cat: 'Cardio', hiit: false },
  { name: 'Jump rope', emoji: '⏭️', met: 12.3, int: 'High', gps: false, cat: 'Cardio', hiit: true },
  { name: 'Boxing', emoji: '🥊', met: 7.8, int: 'High', gps: false, cat: 'Cardio', hiit: true },
  { name: 'Kickboxing', emoji: '🦵', met: 9.0, int: 'High', gps: false, cat: 'Cardio', hiit: true },
  { name: 'Rowing', emoji: '🚣', met: 7.0, int: 'High', gps: false, cat: 'Cardio', hiit: false },
  { name: 'Elliptical', emoji: '🔄', met: 5.0, int: 'Moderate', gps: false, cat: 'Cardio', hiit: false },
  { name: 'Stair climbing', emoji: '🏗️', met: 9.0, int: 'High', gps: false, cat: 'Cardio', hiit: false },
  { name: 'Jump rope HIIT', emoji: '🔥', met: 14.0, int: 'Very High', gps: false, cat: 'Cardio', hiit: true },
  { name: 'Burpees', emoji: '💪', met: 12.0, int: 'Very High', gps: false, cat: 'Cardio', hiit: true },
  { name: 'Mountain climbers', emoji: '⛰️', met: 10.0, int: 'High', gps: false, cat: 'Cardio', hiit: true },
  { name: 'Jumping jacks', emoji: '⭐', met: 8.0, int: 'High', gps: false, cat: 'Cardio', hiit: false },
  // FLEXIBILITY
  { name: 'Yoga', emoji: '🧘', met: 2.5, int: 'Low', gps: false, cat: 'Flexibility', hiit: false },
  { name: 'Power yoga', emoji: '🧘‍♂️', met: 4.0, int: 'Moderate', gps: false, cat: 'Flexibility', hiit: false },
  { name: 'Pilates', emoji: '🤸', met: 3.0, int: 'Low', gps: false, cat: 'Flexibility', hiit: false },
  { name: 'Stretching', emoji: '🤸‍♀️', met: 2.3, int: 'Low', gps: false, cat: 'Flexibility', hiit: false },
  { name: 'Tai chi', emoji: '☯️', met: 3.0, int: 'Low', gps: false, cat: 'Flexibility', hiit: false },
  // STRENGTH
  { name: 'Light weightlifting', emoji: '🏋️', met: 3.5, int: 'Low', gps: false, cat: 'Strength', hiit: false },
  { name: 'Weightlifting', emoji: '🏋️‍♂️', met: 5.0, int: 'Moderate', gps: false, cat: 'Strength', hiit: false },
  { name: 'Heavy weightlifting', emoji: '🏋️‍♀️', met: 6.0, int: 'High', gps: false, cat: 'Strength', hiit: false },
  { name: 'Crossfit', emoji: '💪', met: 8.0, int: 'High', gps: false, cat: 'Strength', hiit: true },
  { name: 'Circuit training', emoji: '🔄', met: 8.5, int: 'High', gps: false, cat: 'Strength', hiit: true },
  { name: 'Push-ups', emoji: '💪', met: 8.0, int: 'High', gps: false, cat: 'Strength', hiit: false },
  { name: 'Pull-ups', emoji: '💪', met: 8.0, int: 'High', gps: false, cat: 'Strength', hiit: false },
  { name: 'Plank', emoji: '🧱', met: 3.8, int: 'Low', gps: false, cat: 'Strength', hiit: false },
  { name: 'Deadlift', emoji: '🏋️', met: 6.0, int: 'High', gps: false, cat: 'Strength', hiit: false },
  { name: 'Squat', emoji: '🦵', met: 5.0, int: 'Moderate', gps: false, cat: 'Strength', hiit: false },
  { name: 'Kettlebell swing', emoji: '🔔', met: 9.8, int: 'High', gps: false, cat: 'Strength', hiit: true },
  { name: 'Battle ropes', emoji: '🪢', met: 10.0, int: 'High', gps: false, cat: 'Strength', hiit: true },
  // SPORTS
  { name: 'Futsal', emoji: '⚽', met: 10.0, int: 'High', gps: true, cat: 'Sports', hiit: true },
  { name: 'Soccer', emoji: '🏆', met: 10.0, int: 'High', gps: true, cat: 'Sports', hiit: true },
  { name: 'Basketball', emoji: '🏀', met: 6.5, int: 'Moderate', gps: true, cat: 'Sports', hiit: false },
  { name: 'Badminton', emoji: '🏸', met: 5.5, int: 'Moderate', gps: false, cat: 'Sports', hiit: false },
  { name: 'Tennis', emoji: '🎾', met: 7.3, int: 'High', gps: true, cat: 'Sports', hiit: false },
  { name: 'Table tennis', emoji: '🏓', met: 4.0, int: 'Moderate', gps: false, cat: 'Sports', hiit: false },
  { name: 'Volleyball', emoji: '🏐', met: 4.0, int: 'Moderate', gps: false, cat: 'Sports', hiit: false },
  { name: 'Rugby', emoji: '🏈', met: 10.0, int: 'High', gps: true, cat: 'Sports', hiit: true },
  { name: 'Archery', emoji: '🏹', met: 3.5, int: 'Low', gps: false, cat: 'Sports', hiit: false },
  { name: 'Golf', emoji: '⛳', met: 3.5, int: 'Low', gps: true, cat: 'Sports', hiit: false },
  { name: 'Rock climbing', emoji: '🧗', met: 8.0, int: 'High', gps: false, cat: 'Sports', hiit: false },
  { name: 'Skateboarding', emoji: '🛹', met: 5.0, int: 'Moderate', gps: true, cat: 'Sports', hiit: false },
  // AQUATIC
  { name: 'Water polo', emoji: '🤽', met: 10.0, int: 'High', gps: false, cat: 'Aquatic', hiit: true },
  { name: 'Surfing', emoji: '🏄', met: 3.0, int: 'Moderate', gps: true, cat: 'Aquatic', hiit: false },
  { name: 'Snorkeling', emoji: '🤿', met: 4.0, int: 'Low', gps: true, cat: 'Aquatic', hiit: false },
  // RECOVERY
  { name: 'Sweeping', emoji: '🧹', met: 3.3, int: 'Low', gps: false, cat: 'Activity', hiit: false },
  { name: 'Washing', emoji: '🧼', met: 2.0, int: 'Low', gps: false, cat: 'Activity', hiit: false },
  { name: 'Gardening', emoji: '🌱', met: 3.8, int: 'Low', gps: false, cat: 'Activity', hiit: false },
  { name: 'Cycling to work', emoji: '🚲', met: 5.0, int: 'Moderate', gps: true, cat: 'Activity', hiit: false },
  // HIGH-INTENSITY / FUNCTIONAL (Hyrox, CrossFit, etc.)
  { name: 'Hyrox (race)', emoji: '🟥', met: 13.0, int: 'Very High', gps: true, cat: 'HIIT', hiit: true },
  { name: 'CrossFit WOD', emoji: '🏋️‍♀️', met: 12.0, int: 'Very High', gps: false, cat: 'HIIT', hiit: true },
  { name: 'Functional bootcamp', emoji: '🥾', met: 10.0, int: 'High', gps: false, cat: 'HIIT', hiit: true },
  { name: 'Sled push/pull', emoji: '🛷', met: 11.0, int: 'Very High', gps: false, cat: 'HIIT', hiit: true },
  { name: 'Wall balls', emoji: '🧱', met: 9.0, int: 'High', gps: false, cat: 'HIIT', hiit: true },
  { name: 'Rowing erg (sprint)', emoji: '🚣', met: 12.0, int: 'Very High', gps: false, cat: 'HIIT', hiit: true },
  { name: 'SkiErg', emoji: '⛷️', met: 11.0, int: 'Very High', gps: false, cat: 'HIIT', hiit: true },
  { name: 'Assault bike', emoji: '🚴‍♂️', met: 12.5, int: 'Very High', gps: false, cat: 'HIIT', hiit: true },
  { name: 'Farmer carry', emoji: '🧳', met: 8.0, int: 'High', gps: false, cat: 'HIIT', hiit: true },
  { name: 'Box jumps', emoji: '📦', met: 10.0, int: 'Very High', gps: false, cat: 'HIIT', hiit: true },
  // TEAM SPORTS (moderate-high)
  { name: 'American football', emoji: '🏈', met: 8.0, int: 'High', gps: true, cat: 'Sports', hiit: true },
  { name: 'Basketball (competitive)', emoji: '🏀', met: 8.0, int: 'High', gps: true, cat: 'Sports', hiit: true },
  { name: 'Soccer (competitive)', emoji: '⚽', met: 10.3, int: 'Very High', gps: true, cat: 'Sports', hiit: true },
  { name: 'Ice hockey', emoji: '🏒', met: 8.0, int: 'High', gps: true, cat: 'Sports', hiit: true },
  { name: 'Handball', emoji: '🤾', met: 8.0, int: 'High', gps: true, cat: 'Sports', hiit: true },
  // ── Tambahan: cabang yang diminta dan belum ada ────────────────────────
  // Air & bawah air
  { name: 'Scuba diving', emoji: '🤿', met: 7.0, int: 'Moderate', gps: false, cat: 'Aquatic', hiit: false },
  { name: 'Freediving', emoji: '🌊', met: 5.0, int: 'Moderate', gps: false, cat: 'Aquatic', hiit: false },
  { name: 'Spearfishing', emoji: '🔱', met: 7.0, int: 'Moderate', gps: false, cat: 'Aquatic', hiit: false },
  { name: 'Open-water swimming', emoji: '🏊', met: 8.3, int: 'High', gps: true, cat: 'Aquatic', hiit: false },
  { name: 'Kitesurfing', emoji: '🪁', met: 7.0, int: 'Moderate', gps: true, cat: 'Aquatic', hiit: false },
  { name: 'Windsurfing', emoji: '⛵', met: 5.5, int: 'Moderate', gps: true, cat: 'Aquatic', hiit: false },
  { name: 'Kayaking', emoji: '🛶', met: 5.0, int: 'Moderate', gps: true, cat: 'Aquatic', hiit: false },
  { name: 'Canoeing', emoji: '🛶', met: 4.5, int: 'Moderate', gps: true, cat: 'Aquatic', hiit: false },
  { name: 'Rowing (on water)', emoji: '🚣', met: 7.0, int: 'High', gps: true, cat: 'Aquatic', hiit: false },
  { name: 'Stand-up paddleboarding', emoji: '🏄‍♀️', met: 6.0, int: 'Moderate', gps: true, cat: 'Aquatic', hiit: false },
  { name: 'Sailing', emoji: '⛵', met: 3.3, int: 'Low', gps: true, cat: 'Aquatic', hiit: false },
  // Bela diri
  { name: 'Boxing (sparring)', emoji: '🥊', met: 12.8, int: 'Very High', gps: false, cat: 'Sports', hiit: true },
  { name: 'Muay Thai', emoji: '🥋', met: 10.3, int: 'Very High', gps: false, cat: 'Sports', hiit: true },
  { name: 'Brazilian jiu-jitsu', emoji: '🥋', met: 10.3, int: 'Very High', gps: false, cat: 'Sports', hiit: true },
  { name: 'Judo', emoji: '🥋', met: 10.3, int: 'Very High', gps: false, cat: 'Sports', hiit: true },
  { name: 'Karate', emoji: '🥋', met: 10.3, int: 'Very High', gps: false, cat: 'Sports', hiit: true },
  { name: 'Taekwondo', emoji: '🥋', met: 10.3, int: 'Very High', gps: false, cat: 'Sports', hiit: true },
  { name: 'Pencak silat', emoji: '🥋', met: 10.0, int: 'Very High', gps: false, cat: 'Sports', hiit: true },
  { name: 'Wrestling', emoji: '🤼', met: 6.0, int: 'High', gps: false, cat: 'Sports', hiit: true },
  { name: 'Fencing', emoji: '🤺', met: 6.0, int: 'High', gps: false, cat: 'Sports', hiit: true },
  // Raket & bola
  { name: 'Squash', emoji: '🎾', met: 12.0, int: 'Very High', gps: false, cat: 'Sports', hiit: true },
  { name: 'Padel', emoji: '🎾', met: 6.0, int: 'High', gps: false, cat: 'Sports', hiit: true },
  { name: 'Beach volleyball', emoji: '🏐', met: 8.0, int: 'High', gps: true, cat: 'Sports', hiit: true },
  { name: 'Cricket', emoji: '🏏', met: 4.8, int: 'Moderate', gps: true, cat: 'Sports', hiit: false },
  { name: 'Baseball', emoji: '⚾', met: 5.0, int: 'Moderate', gps: true, cat: 'Sports', hiit: false },
  { name: 'Golf (walking)', emoji: '⛳', met: 4.8, int: 'Moderate', gps: true, cat: 'Sports', hiit: false },
  { name: 'Sepak takraw', emoji: '🥎', met: 7.0, int: 'High', gps: false, cat: 'Sports', hiit: true },
  // Luar ruang & ketinggian
  { name: 'Hiking', emoji: '🥾', met: 6.0, int: 'Moderate', gps: true, cat: 'Cardio', hiit: false },
  { name: 'Mountaineering', emoji: '🏔️', met: 8.0, int: 'High', gps: true, cat: 'Cardio', hiit: false },
  { name: 'Bouldering', emoji: '🧗‍♀️', met: 7.0, int: 'High', gps: false, cat: 'Sports', hiit: true },
  { name: 'Mountain biking', emoji: '🚵', met: 8.5, int: 'High', gps: true, cat: 'Cardio', hiit: false },
  { name: 'Gravel cycling', emoji: '🚲', met: 8.0, int: 'High', gps: true, cat: 'Cardio', hiit: false },
  { name: 'Inline skating', emoji: '⛸️', met: 7.5, int: 'High', gps: true, cat: 'Cardio', hiit: false },
  { name: 'Horse riding', emoji: '🐎', met: 5.5, int: 'Moderate', gps: true, cat: 'Sports', hiit: false },
  { name: 'Shooting sports', emoji: '🎯', met: 2.5, int: 'Low', gps: false, cat: 'Sports', hiit: false },
  // Salju & es
  { name: 'Skiing (downhill)', emoji: '⛷️', met: 6.8, int: 'High', gps: true, cat: 'Sports', hiit: false },
  { name: 'Cross-country skiing', emoji: '🎿', met: 9.0, int: 'Very High', gps: true, cat: 'Cardio', hiit: false },
  { name: 'Snowboarding', emoji: '🏂', met: 5.3, int: 'Moderate', gps: true, cat: 'Sports', hiit: false },
  { name: 'Ice skating', emoji: '⛸️', met: 7.0, int: 'High', gps: true, cat: 'Cardio', hiit: false },
  // Gerak & pikiran
  { name: 'Qigong', emoji: '🌀', met: 2.5, int: 'Low', gps: false, cat: 'Flexibility', hiit: false },
  { name: 'Ballet', emoji: '🩰', met: 5.0, int: 'Moderate', gps: false, cat: 'Flexibility', hiit: false },
  { name: 'Traditional dance', emoji: '💃', met: 5.5, int: 'Moderate', gps: false, cat: 'Cardio', hiit: false },
  { name: 'Gymnastics', emoji: '🤸', met: 5.5, int: 'Moderate', gps: false, cat: 'Strength', hiit: false },
  { name: 'Parkour', emoji: '🏃‍♂️', met: 8.0, int: 'High', gps: true, cat: 'Sports', hiit: true },
  // Kekuatan & alat
  { name: 'Calisthenics', emoji: '🤸‍♂️', met: 6.0, int: 'Moderate', gps: false, cat: 'Strength', hiit: false },
  { name: 'Powerlifting', emoji: '🏋️', met: 6.0, int: 'High', gps: false, cat: 'Strength', hiit: false },
  { name: 'Olympic weightlifting', emoji: '🏋️‍♀️', met: 6.0, int: 'High', gps: false, cat: 'Strength', hiit: true },
  { name: 'Strongman', emoji: '🪨', met: 8.0, int: 'Very High', gps: false, cat: 'Strength', hiit: true },
  { name: 'Kettlebell', emoji: '🔔', met: 8.0, int: 'High', gps: false, cat: 'Strength', hiit: true },
  { name: 'Sled push / pull', emoji: '🛷', met: 9.0, int: 'Very High', gps: false, cat: 'Strength', hiit: true },
  { name: 'Sandbag training', emoji: '🎒', met: 7.0, int: 'High', gps: false, cat: 'Strength', hiit: true },
  // Sehari-hari & pemulihan
  { name: 'House cleaning', emoji: '🧹', met: 3.3, int: 'Low', gps: false, cat: 'Activity', hiit: false },
  { name: 'Manual labour', emoji: '🔨', met: 5.5, int: 'Moderate', gps: false, cat: 'Activity', hiit: false },
  { name: 'Carrying a child', emoji: '👶', met: 3.5, int: 'Low', gps: false, cat: 'Activity', hiit: false },
  { name: 'Walking the dog', emoji: '🐕', met: 3.0, int: 'Low', gps: true, cat: 'Activity', hiit: false },
  { name: 'Mobility work', emoji: '🧎', met: 2.5, int: 'Low', gps: false, cat: 'Flexibility', hiit: false },
  { name: 'Foam rolling', emoji: '🎳', met: 2.3, int: 'Low', gps: false, cat: 'Flexibility', hiit: false },
  { name: 'Breathwork', emoji: '🌬️', met: 1.5, int: 'Low', gps: false, cat: 'Flexibility', hiit: false },
  { name: 'Sauna', emoji: '🧖', met: 1.5, int: 'Low', gps: false, cat: 'Flexibility', hiit: false },
  { name: 'Cold plunge', emoji: '🧊', met: 2.0, int: 'Low', gps: false, cat: 'Flexibility', hiit: false },
]

/** Kategori yang benar-benar terpakai, untuk penyaring. */
export const KATEGORI_OLAHRAGA = Array.from(new Set(JENIS_OLAHRAGA.map((e) => e.cat)))

export const JUMLAH_OLAHRAGA = JENIS_OLAHRAGA.length

/** Cari menurut nama atau kategori. */
export function cariOlahraga(q: string): JenisOlahraga[] {
  const s = q.trim().toLowerCase()
  if (!s) return JENIS_OLAHRAGA
  return JENIS_OLAHRAGA.filter((e) => `${e.name} ${e.cat} ${e.int}`.toLowerCase().includes(s))
}

/**
 * Kalori perkiraan: MET x berat (kg) x jam.
 *
 * Disebut PERKIRAAN di tiap layar yang memakainya. Rumus ini tidak melihat
 * kebugaran, teknik, suhu, maupun ketinggian, dan pada latihan beban ia
 * meremehkan secara sistematis.
 */
export function kaloriPerkiraan(met: number, beratKg: number, menit: number): number {
  if (!(met > 0) || !(beratKg > 0) || !(menit > 0)) return 0
  return Math.round(met * beratKg * (menit / 60))
}
