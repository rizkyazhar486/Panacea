// ─────────────────────────────────────────────────────────────────────────────
// Halaman edukasi untuk orang awam.
//
// SATU KALIMAT YANG MENENTUKAN SELURUH BENTUKNYA: ini bukan alat mendiagnosis
// diri sendiri, dan ia disusun supaya TIDAK DAPAT dipakai begitu.
//
// Bagaimana caranya. Tiap keluhan menjawab empat pertanyaan, dan urutannya
// disengaja:
//
//   1. BIASANYA APA — supaya orang tahu bahwa sebagian besar keluhan memang
//      lazim dan sembuh sendiri, dan tidak setiap gejala perlu ditakuti.
//   2. KAPAN HARUS KE DOKTER — ditaruh KEDUA, bukan terakhir. Bila ia
//      diletakkan di bawah setelah paragraf pengobatan mandiri, yang membaca
//      sampai bawah justru orang yang paling tidak cemas.
//   3. YANG BENAR-BENAR MENOLONG — tindakan yang dapat dikerjakan sendiri
//      hari ini, disertai obat bebas beserta batas pemakaiannya.
//   4. YANG TIDAK MENOLONG — anggapan yang beredar luas, disebut apa adanya.
//
// TIDAK ADA "KEMUNGKINAN PENYAKIT ANDA ADALAH". Tidak ada daftar diagnosis
// banding, tidak ada penilaian risiko, dan tidak ada alur yang berujung pada
// nama penyakit. Alat semacam itu di tangan orang awam menghasilkan dua
// kekeliruan yang sama-sama merugikan: menakuti yang sehat, dan menenangkan
// yang sedang sakit.
//
// DOSIS OBAT BEBAS DISEBUTKAN karena tidak menyebutkannya justru berbahaya —
// orang tetap meminumnya, hanya tanpa tahu batasnya. Yang disebut hanya obat
// yang memang dijual bebas, dengan batas hari pemakaian dan dengan keadaan
// yang melarangnya.
// ─────────────────────────────────────────────────────────────────────────────

export interface Keluhan {
  id: string
  judul: string
  emoji: string
  biasanya: string
  /** Tanda yang menuntut pemeriksaan, bukan pengobatan sendiri. */
  keDokter: string[]
  /** Seberapa cepat: 'sekarang' berarti gawat darurat. */
  segera?: string[]
  menolong: string[]
  tidakMenolong: string[]
}

export const KELUHAN_AWAM: Keluhan[] = [
  {
    id: 'demam',
    judul: 'Fever',
    emoji: '🌡️',
    biasanya:
      'Fever is not an illness — it is your body raising its own thermostat, usually against a virus, and it often does more good than harm. Most fevers in otherwise healthy adults and children settle in three to five days. The number on the thermometer matters far less than how the person looks and behaves.',
    keDokter: [
      'Fever lasting more than 3 days without improving',
      'Fever in a baby under 3 months — this one is urgent regardless of how well the baby seems',
      'Fever with a rash that does not fade when you press a glass on it',
      'Fever with severe headache, neck stiffness, or discomfort looking at light',
      'Fever in someone on chemotherapy or with a known weak immune system',
      'Fever returning after it had already gone away',
    ],
    segera: ['Confusion, unusual drowsiness, or a child who cannot be roused properly', 'Difficulty breathing', 'A seizure'],
    menolong: [
      'Paracetamol 500-1000 mg every 4-6 hours, no more than 4 g in a day — check that no other medicine you are taking already contains it, because cold and flu sachets usually do',
      'For children: paracetamol 10-15 mg per kg of body weight per dose, worked out from WEIGHT, never from age',
      'Fluids. Fever increases water loss whether or not you feel thirsty',
      'Rest, and light clothing rather than heavy blankets',
    ],
    tidakMenolong: [
      'Antibiotics. They do nothing against viruses, which cause most fevers, and taking them anyway makes the bacteria in your community harder to treat later',
      'Alternating paracetamol and ibuprofen on a fixed schedule — it confuses the dosing and has not been shown to work better',
      'Cold baths or rubbing with alcohol. They cause shivering, which raises the temperature back up, and alcohol is absorbed through the skin',
    ],
  },
  {
    id: 'batuk',
    judul: 'Cough and cold',
    emoji: '🤧',
    biasanya:
      'A common cold is a virus. It runs its course in about 7-10 days, and the cough can linger for three weeks after everything else has settled — that lingering cough is normal healing, not a failure of treatment. Green or yellow mucus does not mean you need antibiotics; it means white blood cells are doing their job.',
    keDokter: [
      'Cough lasting more than 3 weeks',
      'Coughing up blood',
      'Shortness of breath, or chest pain when you breathe in',
      'Fever that returns after the cold seemed to be ending',
      'Weight loss or night sweats with a long cough — in Indonesia this needs tuberculosis ruled out',
      'Wheezing that keeps coming back, especially at night',
    ],
    menolong: [
      'Fluids and rest. Warm drinks genuinely soothe the throat, and honey works about as well as most cough syrups for adults and children over one year',
      'For a blocked nose: a saline spray or rinse, or a decongestant spray — but NO MORE THAN 3 DAYS. Past that the nose rebounds and becomes more blocked than it started',
      'For an allergic runny nose: cetirizine 10 mg or loratadine 10 mg once daily',
      'For a productive cough, drink more rather than suppressing it — the cough is what clears the mucus',
    ],
    tidakMenolong: [
      'Antibiotics for a normal cold, in any colour of mucus',
      'Cough suppressants for a chesty, productive cough — they trap the mucus you were trying to clear',
      'Vitamin C started after symptoms begin. Taken regularly beforehand it slightly shortens colds; started on day one it does not',
      'Cough and cold medicines for children under 2 — they are not approved for that age and have caused harm',
    ],
  },
  {
    id: 'diare',
    judul: 'Diarrhoea',
    emoji: '💧',
    biasanya:
      'Most diarrhoea is viral and stops within a few days. What actually causes harm is not the illness — it is the fluid lost with it. That is why the treatment is fluid first, and everything else second.',
    keDokter: [
      'Blood or mucus in the stool',
      'Diarrhoea lasting more than 3 days in an adult, or more than 24 hours in a small child',
      'Signs of dehydration: very little urine, dark urine, sunken eyes, dry mouth, dizziness on standing',
      'Severe abdominal pain, or a swollen tender belly',
      'High fever with chills',
    ],
    segera: ['A child who is floppy, unusually sleepy, or cannot keep any fluid down', 'No urine for 8 hours or more'],
    menolong: [
      'Oral rehydration salts (oralit), one sachet in 200 mL of boiled water — never half a sachet, and never with extra sugar added. Adults: 200-400 mL after each loose stool',
      'For children, ZINC 20 mg daily (10 mg if under 6 months) for a FULL 10-14 DAYS, even after the diarrhoea stops on day three. Finishing it is what reduces the next episode',
      'Keep eating. Starving the gut slows recovery, and breastfeeding is never stopped',
      'If you have no oralit: one heaped teaspoon of sugar plus a pinch of salt in 200 mL of water. The proportion matters — a sweeter drink pulls water INTO the gut and makes it worse',
    ],
    tidakMenolong: [
      'Anti-diarrhoea tablets (loperamide) when there is blood or fever — slowing the gut traps the bacteria inside. Never give them to young children at all',
      'Antibiotics for ordinary watery diarrhoea. This is the most common prescribing mistake in Indonesia and it does not shorten the illness',
      'Sports drinks and sweet tea as a substitute for oralit — they are far too sugary',
    ],
  },
  {
    id: 'nyerikepala',
    judul: 'Headache',
    emoji: '🤕',
    biasanya:
      'Most headaches are tension-type or migraine, and neither is dangerous however severe it feels. Migraine tends to be one-sided, throbbing, worse with movement, and often comes with nausea or dislike of light. Tension headache feels like a band tightening around the head.',
    keDokter: [
      'A new headache after age 50',
      'A headache that keeps getting worse over days or weeks',
      'A headache that is worse lying down, or worse when you cough or strain',
      'Headache with fever and a stiff neck',
      'Headaches more than twice a week, or painkillers needed more than 10 days a month',
    ],
    segera: [
      'The worst headache of your life, arriving suddenly like a thunderclap',
      'Headache with weakness, numbness, slurred speech, or a drooping face',
      'Headache after a head injury, especially with vomiting or drowsiness',
    ],
    menolong: [
      'Take the painkiller EARLY, at the first sign — a migraine treated in the first hour responds far better than one treated at its peak',
      'Paracetamol 1000 mg, or ibuprofen 400 mg after food',
      'A dark quiet room, and sleep, for migraine',
      'Water. Mild dehydration is one of the commonest triggers and one of the easiest to fix',
    ],
    tidakMenolong: [
      'Taking painkillers most days. Beyond about 10-15 days a month they start CAUSING a daily headache of their own, which only clears by stopping them — and it gets worse for a week or two first',
      'Waiting to see if it goes away before treating a migraine',
    ],
  },
  {
    id: 'nyeriperut',
    judul: 'Stomach pain and heartburn',
    emoji: '🔥',
    biasanya:
      'Burning behind the breastbone that comes after meals or when lying down is usually acid reflux. Crampy pain that comes and goes is usually the gut muscle contracting. Neither needs an urgent scan, but both need their pattern watching.',
    keDokter: [
      'Difficulty swallowing, or food sticking',
      'Vomiting blood, or black tarry stools',
      'Unexplained weight loss',
      'Pain that wakes you from sleep',
      'New indigestion starting after age 50',
      'Symptoms that keep coming back after 4 weeks of treatment',
    ],
    segera: [
      'Sudden severe abdominal pain with a rigid, board-like belly',
      'Chest pain with sweating, breathlessness, or pain into the jaw or arm — heartburn and a heart attack can feel the same, and this is the one you cannot afford to guess about',
    ],
    menolong: [
      'Antacids for immediate relief — they work within minutes, but only last about half an hour',
      'Omeprazole 20 mg once daily, taken 30-60 MINUTES BEFORE BREAKFAST. Taken after food it barely works, and that single detail is the commonest reason people think it failed',
      'Smaller meals, and not lying down for 3 hours after eating',
      'Raising the head of the bed, if symptoms are worst at night',
    ],
    tidakMenolong: [
      'Milk. It soothes for a few minutes then stimulates more acid',
      'Staying on acid tablets for years without review',
      'Antacids taken at the same time as other medicines — they block the absorption of several, including iron, thyroid tablets and some antibiotics. Leave 2 hours between',
    ],
  },
  {
    id: 'luka',
    judul: 'Cuts and wounds',
    emoji: '🩹',
    biasanya:
      'A clean shallow cut heals on its own. What decides how it heals is not what you put on it, but how well it was washed and whether it was kept moist rather than allowed to dry into a scab.',
    keDokter: [
      'A wound that gapes open, or is deeper than the skin',
      'A wound from a bite — human or animal',
      'A dirty or puncture wound, especially if your tetanus vaccination is not up to date',
      'Spreading redness, increasing pain after day two, or pus',
      'Any wound in someone with diabetes, especially on the foot',
    ],
    menolong: [
      'Rinse with clean running water or saline, and plenty of it. The washing does more than any ointment',
      'Cover it and keep it slightly moist. A wound left to dry into a hard scab heals more slowly and scars more',
      'Change the dressing when it is wet or dirty, not on a fixed schedule',
    ],
    tidakMenolong: [
      'Alcohol or hydrogen peroxide poured into an open wound. They hurt badly, kill healthy cells, and do not speed anything up',
      'Toothpaste, coffee grounds, or engine oil — all still used, all cause infection',
      'Antibiotic ointment on a clean wound. It prevents nothing and commonly causes an allergic rash',
    ],
  },
  {
    id: 'tidur',
    judul: 'Trouble sleeping',
    emoji: '🌙',
    biasanya:
      'A few bad nights around stress or a change of routine is normal and passes. Insomnia becomes a problem when the effort to sleep becomes the thing keeping you awake — and that loop is broken by behaviour, not by tablets.',
    keDokter: [
      'Loud snoring with pauses in breathing, or waking unrefreshed despite enough hours — this may be sleep apnoea',
      'Insomnia lasting more than a month',
      'Sleepiness dangerous enough to affect driving or work',
      'Low mood or loss of interest alongside the sleeplessness',
    ],
    menolong: [
      'One fixed WAKE time, seven days a week. This does more than any other single change, and it is the one most people skip',
      'Get out of bed if you have been awake about 20 minutes, and come back only when sleepy. This is the core of the behavioural treatment that outperforms sleeping tablets long-term',
      'Bright light in the morning; dim light for the last hour of the evening',
      'No caffeine after early afternoon — its half-life is about five hours, so a 4 pm coffee is still half in you at 9 pm',
    ],
    tidakMenolong: [
      'Alcohol. It shortens the time to fall asleep and then wrecks the second half of the night',
      'Sleeping tablets beyond a few weeks — tolerance builds, and stopping causes worse insomnia than you started with',
      'Lying in bed longer to catch up. It weakens the link between bed and sleep, which is exactly the thing being repaired',
    ],
  },
  {
    id: 'tekanan',
    judul: 'High blood pressure',
    emoji: '❤️',
    biasanya:
      'High blood pressure has no symptoms. That is the entire difficulty with it — it is treated not to make you feel better today, but to stop a stroke or a heart attack years from now. Headaches, neck ache and nosebleeds are not reliable signs of it.',
    keDokter: [
      'A reading of 140/90 or above on several separate days',
      'Any reading of 180/110 or above',
      'You are on treatment and readings remain above target',
    ],
    segera: [
      'Very high reading WITH chest pain, breathlessness, weakness on one side, slurred speech, or visual loss — this is an emergency, not something to treat at home',
    ],
    menolong: [
      'Measure it properly: sitting, back supported, feet flat, arm at heart level, after 5 minutes of rest, no coffee or cigarette for 30 minutes. Take two readings a minute apart and record the second',
      'Less salt. This is the dietary change with the clearest effect, and most of the salt comes from processed food and sauces rather than the salt shaker',
      'Regular activity, weight loss if there is weight to lose, and less alcohol',
      'If you are prescribed tablets, take them EVERY DAY. Stopping because you feel fine is the most common reason treatment fails, and feeling fine is exactly what the condition does',
    ],
    tidakMenolong: [
      'Taking tablets only when the reading is high. Blood pressure is treated continuously, not reactively',
      'Herbal products claiming to replace medication',
      'Judging control by how you feel',
    ],
  },
]

/** Apa yang halaman ini dengan sengaja TIDAK lakukan. */
export const BUKAN = [
  'This is not a way to diagnose yourself. There is no list of possible diseases and no risk score anywhere on this page — those two things, in the hands of someone without training, frighten the healthy and reassure the unwell.',
  'The red flags are placed near the top of every topic on purpose. Put underneath the self-care advice, they are read only by the people who were already worried.',
  'Doses are given for medicines that are genuinely sold without a prescription, with the limits that matter. Leaving them out does not stop anyone taking them — it only removes the part that keeps them safe.',
  'If something here contradicts what your own doctor told you about your own case, your doctor is looking at information this page does not have.',
]
