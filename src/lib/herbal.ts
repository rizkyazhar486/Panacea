// ─────────────────────────────────────────────────────────────────────────────
// Herbal dan obat tradisional.
//
// KENAPA BAGIAN INI ADA, DAN KENAPA BENTUKNYA SEPERTI INI.
//
// Sebagian besar aplikasi kesehatan memperlakukan herbal dengan salah satu dari
// dua cara, dan keduanya merugikan pemakainya:
//
//   · MENGABAIKANNYA. Padahal di Indonesia jamu dipakai luas dan sering
//     BERSAMAAN dengan obat resep — dan justru pertemuan keduanya yang
//     berbahaya, bukan masing-masingnya. Pasien yang tidak menemukan herbalnya
//     disebut di mana pun akan menyimpulkan ia tidak perlu disebutkan kepada
//     dokternya.
//   · MEMUJINYA. Daftar khasiat tanpa satu pun kata tentang bukti atau bahaya
//     membuat orang mengganti obat yang bekerja dengan sesuatu yang belum tentu.
//
// Yang dilakukan di sini adalah cara ketiga: MENYEBUTKAN PEMAKAIAN
// TRADISIONALNYA, LALU MENYEBUTKAN APA YANG SEBENARNYA DIKETAHUI, dan
// menempatkan INTERAKSI serta BAHAYA sejajar dengan keduanya — bukan sebagai
// catatan kaki.
//
// TINGKAT BUKTI ditulis apa adanya, termasuk ketika jawabannya "tipis". Sebuah
// tanaman yang dipakai turun-temurun selama berabad-abad tetap boleh disebut
// buktinya tipis; keduanya bisa benar bersamaan, dan menyembunyikan yang kedua
// demi menghormati yang pertama tidak menghormati siapa pun.
//
// INTERAKSI ADALAH ALASAN UTAMA BERKAS INI DITULIS. Beberapa di antaranya
// membunuh dan sudah terdokumentasi baik: St John's wort menginduksi CYP3A4
// sehingga menggagalkan kontrasepsi oral, antiretroviral, takrolimus dan
// warfarin; Aristolochia menyebabkan nefropati dan kanker urotelial;
// comfrey dan beberapa jamu mengandung alkaloid pirolizidin yang merusak hati.
// Yang seperti ini tidak boleh menunggu ditanyakan.
//
// PENGGOLONGAN BPOM ikut ditulis untuk yang berlaku di Indonesia: Jamu
// (empiris), Obat Herbal Terstandar (uji praklinik), dan Fitofarmaka (sudah
// melalui uji klinik). Ini penggolongan resmi dan dapat diperiksa; ia menjawab
// pertanyaan yang paling sering ditanyakan pasien — "ini sudah diuji belum".
//
// TIDAK ADA DOSIS di berkas ini, dengan alasan yang sama seperti di katalog
// obat: kadar bahan aktif dalam sediaan herbal berbeda-beda antar produk dan
// antar panen, sehingga angka yang ditulis di sini akan salah untuk hampir
// semua produk nyata.
// ─────────────────────────────────────────────────────────────────────────────

/** Seberapa kuat bukti manusianya, ditulis apa adanya. */
export type Bukti = 'sedang' | 'terbatas' | 'tipis' | 'tidak-mendukung'

export const BUKTI_LABEL: Record<Bukti, { label: string; jelas: string; nada: 'brand' | 'low' | 'neutral' | 'critical' }> = {
  sedang: {
    label: 'Moderate',
    jelas: 'Several controlled human trials point the same way, though effect sizes are usually modest.',
    nada: 'brand',
  },
  terbatas: {
    label: 'Limited',
    jelas: 'Some human trials exist but they are small, mixed, or at high risk of bias.',
    nada: 'low',
  },
  tipis: {
    label: 'Thin',
    jelas: 'Mostly traditional use, laboratory work, or animal studies. Human evidence is scarce or absent.',
    nada: 'neutral',
  },
  'tidak-mendukung': {
    // Lencana harus pendek: pada layar 390 px, label sepanjang kalimat
    // menghimpit nama tanamannya sampai empat baris. Kalimat penuhnya tetap
    // ada, di `jelas`, tempat ia dibaca dan bukan sekadar dilirik.
    label: 'Not supported',
    jelas: 'Trials have been done and they did not show the claimed benefit.',
    nada: 'critical',
  },
}

/** Penggolongan resmi BPOM untuk obat tradisional di Indonesia. */
export type Bpom = 'jamu' | 'oht' | 'fitofarmaka'

export const BPOM_LABEL: Record<Bpom, { label: string; jelas: string }> = {
  jamu: { label: 'Jamu', jelas: 'Registered on the basis of empirical, traditional use — not on trial data.' },
  oht: { label: 'OHT', jelas: 'Obat Herbal Terstandar — standardised extract with preclinical safety and activity testing.' },
  fitofarmaka: { label: 'Fitofarmaka', jelas: 'The highest Indonesian category — has been through clinical trials in humans.' },
}

export interface Herbal {
  /** Nama Latin. Ini identitas sebenarnya — nama umum sering dipakai untuk beberapa tanaman berbeda. */
  latin: string
  /** Nama yang dipakai orang. */
  nama: string
  /** Nama Indonesia, bila berbeda. */
  lokal?: string
  /** Untuk apa ia dipakai secara tradisional. */
  tradisional: string
  bukti: Bukti
  /** Apa yang sebenarnya ditunjukkan penelitian manusia. Ditulis jujur. */
  temuan: string
  /** Interaksi dengan obat. Kosong berarti belum ada yang menonjol — bukan berarti aman. */
  interaksi?: string
  /** Bahaya yang berdiri sendiri, terlepas dari interaksi. */
  bahaya?: string
  bpom?: Bpom
}

export interface KelompokHerbal {
  id: string
  judul: string
  emoji: string
  isi: Herbal[]
}

export const HERBAL: KelompokHerbal[] = [
  {
    id: 'bahaya', judul: 'Read this group first — known to cause serious harm', emoji: '⛔',
    isi: [
      {
        latin: 'Aristolochia spp.', nama: 'Birthwort', lokal: 'Akar tikus / aristolochia',
        tradisional: 'Weight loss preparations, arthritis, and "detox" mixtures in several traditions.',
        bukti: 'tidak-mendukung',
        temuan: 'No established benefit, and the harm is well documented rather than theoretical.',
        bahaya: 'Aristolochic acid causes irreversible kidney failure and urothelial cancer. It is classified as a human carcinogen by IARC and is banned or restricted in many countries. There is no safe dose.',
      },
      {
        latin: 'Symphytum officinale', nama: 'Comfrey',
        tradisional: 'Applied to bruises and sprains; formerly taken internally.',
        bukti: 'terbatas',
        temuan: 'Topical preparations may relieve musculoskeletal pain short term.',
        bahaya: 'Contains pyrrolizidine alkaloids, which cause hepatic veno-occlusive disease. Should never be taken internally, and should not be applied to broken skin.',
      },
      {
        latin: 'Ephedra sinica', nama: 'Ma huang', lokal: 'Efedra',
        tradisional: 'Asthma, nasal congestion, and later marketed for weight loss and performance.',
        bukti: 'terbatas',
        temuan: 'It does produce modest short-term weight loss — which is exactly why it was sold, and exactly why people were harmed.',
        bahaya: 'Stroke, myocardial infarction, arrhythmia, seizure and death. Banned in dietary supplements in several countries after the reports accumulated.',
        interaksi: 'Dangerous with MAO inhibitors, other stimulants, and caffeine.',
      },
      {
        latin: 'Piper methysticum', nama: 'Kava',
        tradisional: 'Anxiety, relaxation, ceremonial use in the Pacific.',
        bukti: 'terbatas',
        temuan: 'Short-term trials suggest a small anxiolytic effect.',
        bahaya: 'Severe hepatotoxicity, including cases needing transplantation. Restricted or withdrawn in several countries.',
        interaksi: 'Additive sedation with alcohol, benzodiazepines and other CNS depressants.',
      },
      {
        latin: 'Hypericum perforatum', nama: "St John's wort", lokal: 'Hipericum',
        tradisional: 'Low mood.',
        bukti: 'sedang',
        temuan: 'It does work for mild to moderate depression in trials — the problem is not whether it acts, but what else it acts on.',
        interaksi: 'A potent inducer of CYP3A4 and P-glycoprotein. It causes contraceptive failure and unplanned pregnancy, loss of antiretroviral control, transplant rejection through reduced tacrolimus and ciclosporin levels, reduced warfarin effect, and reduced levels of many anticancer and antiepileptic drugs. Serotonin syndrome when combined with SSRIs. This is the single most important herb-drug interaction in practice.',
        bahaya: 'Photosensitivity.',
      },
      {
        latin: 'Areca catechu', nama: 'Betel nut', lokal: 'Pinang / sirih pinang',
        tradisional: 'Chewed as a stimulant across South and Southeast Asia.',
        bukti: 'tidak-mendukung',
        temuan: 'No health benefit is established.',
        bahaya: 'Arecoline is carcinogenic; chewing is a major cause of oral submucous fibrosis and oral cancer. IARC classifies it as carcinogenic to humans.',
      },
    ],
  },
  {
    id: 'metabolik', judul: 'Metabolic and cardiovascular', emoji: '🫀',
    isi: [
      {
        latin: 'Curcuma longa', nama: 'Turmeric', lokal: 'Kunyit',
        tradisional: 'Inflammation, dyspepsia, wound healing; a staple of jamu.',
        bukti: 'terbatas',
        temuan: 'Small trials suggest modest benefit in osteoarthritis pain. Curcumin absorption is poor, which is why laboratory results have not translated well.',
        interaksi: 'May add to the effect of anticoagulants and antiplatelets.',
        bpom: 'jamu',
      },
      {
        latin: 'Allium sativum', nama: 'Garlic', lokal: 'Bawang putih',
        tradisional: 'Blood pressure, cholesterol, infection.',
        bukti: 'terbatas',
        temuan: 'Small reductions in blood pressure in some trials; the effect on cholesterol is inconsistent and clinically small.',
        interaksi: 'Increases bleeding risk with anticoagulants and antiplatelets; reduces saquinavir levels.',
      },
      {
        latin: 'Cinnamomum spp.', nama: 'Cinnamon', lokal: 'Kayu manis',
        tradisional: 'Blood sugar control.',
        bukti: 'terbatas',
        temuan: 'Trials are mixed; any effect on HbA1c is small and not a substitute for glucose-lowering therapy.',
        bahaya: 'Cassia cinnamon contains coumarin, which is hepatotoxic in quantity — this is a real concern with concentrated supplements, not with culinary use.',
      },
      {
        latin: 'Momordica charantia', nama: 'Bitter melon', lokal: 'Pare',
        tradisional: 'Diabetes.',
        bukti: 'terbatas',
        temuan: 'Human trials are small and inconsistent; it has not been shown to match standard therapy.',
        interaksi: 'Additive hypoglycaemia with insulin and sulfonylureas.',
        bpom: 'jamu',
      },
      {
        latin: 'Trigonella foenum-graecum', nama: 'Fenugreek', lokal: 'Klabet',
        tradisional: 'Blood sugar, lactation support.',
        bukti: 'terbatas',
        temuan: 'Some glucose-lowering signal in small trials; lactation evidence is weak.',
        interaksi: 'Additive hypoglycaemia; may add to anticoagulant effect.',
      },
      {
        latin: 'Monascus purpureus', nama: 'Red yeast rice', lokal: 'Angkak',
        tradisional: 'Cholesterol, circulation.',
        bukti: 'sedang',
        temuan: 'It genuinely lowers LDL — because it contains monacolin K, which is chemically the same as lovastatin.',
        interaksi: 'Should be treated as a statin: same myopathy risk, same interactions, and it should not be combined with a prescribed statin.',
        bahaya: 'Content varies enormously between products, and some have been contaminated with the nephrotoxin citrinin.',
      },
      {
        latin: 'Crataegus spp.', nama: 'Hawthorn',
        tradisional: 'Heart failure symptoms, palpitations.',
        bukti: 'terbatas',
        temuan: 'Some symptomatic benefit in chronic heart failure trials, but it has not been shown to change outcomes.',
        interaksi: 'May potentiate digoxin and antihypertensives.',
      },
      {
        latin: 'Zingiber officinale', nama: 'Ginger', lokal: 'Jahe',
        tradisional: 'Nausea, motion sickness, dyspepsia, joint pain.',
        bukti: 'sedang',
        temuan: 'One of the better-supported herbals: it reduces nausea in pregnancy and postoperatively in multiple trials.',
        interaksi: 'May add to anticoagulant effect at high doses.',
        bpom: 'jamu',
      },
    ],
  },
  {
    id: 'saraf', judul: 'Mind, sleep and nervous system', emoji: '🧠',
    isi: [
      {
        latin: 'Ginkgo biloba', nama: 'Ginkgo',
        tradisional: 'Memory, circulation, tinnitus.',
        bukti: 'tidak-mendukung',
        temuan: 'Large trials did not find that it prevents dementia or meaningfully improves cognition in healthy older adults.',
        interaksi: 'Bleeding risk with anticoagulants and antiplatelets; may lower the seizure threshold.',
      },
      {
        latin: 'Valeriana officinalis', nama: 'Valerian',
        tradisional: 'Insomnia, anxiety.',
        bukti: 'terbatas',
        temuan: 'Trials are inconsistent; where benefit appears it is small and subjective rather than measured on sleep studies.',
        interaksi: 'Additive sedation with benzodiazepines, alcohol and anaesthetics.',
      },
      {
        latin: 'Withania somnifera', nama: 'Ashwagandha',
        tradisional: 'Stress, fatigue, strength (Ayurvedic).',
        bukti: 'terbatas',
        temuan: 'Small trials suggest reduced self-reported stress; the studies are short and mostly industry-linked.',
        bahaya: 'Liver injury has been reported. Avoid in pregnancy and in thyroid disease without advice.',
        interaksi: 'Additive sedation; may affect thyroid and immunosuppressant therapy.',
      },
      {
        latin: 'Panax ginseng', nama: 'Asian ginseng',
        tradisional: 'Fatigue, stamina, cognition.',
        bukti: 'terbatas',
        temuan: 'Effects on fatigue and cognition are small and inconsistently reproduced.',
        interaksi: 'May reduce warfarin effect; additive hypoglycaemia with diabetes drugs; stimulant effect with MAO inhibitors.',
      },
      {
        latin: 'Camellia sinensis', nama: 'Green tea', lokal: 'Teh hijau',
        tradisional: 'Alertness, weight, general health.',
        bukti: 'terbatas',
        temuan: 'Drinking it is fine and possibly mildly beneficial. Concentrated extracts are a different matter.',
        bahaya: 'High-dose green tea extract has caused acute liver injury.',
        interaksi: 'Reduces absorption of iron; vitamin K content can affect warfarin.',
      },
      {
        latin: 'Matricaria chamomilla', nama: 'Chamomile',
        tradisional: 'Anxiety, sleep, colic.',
        bukti: 'tipis',
        temuan: 'Mostly traditional use; human trials are few and small.',
        interaksi: 'Additive sedation; possible added bleeding risk with anticoagulants.',
      },
      {
        latin: 'Centella asiatica', nama: 'Gotu kola', lokal: 'Pegagan',
        tradisional: 'Memory, wound healing, venous insufficiency.',
        bukti: 'terbatas',
        temuan: 'Some evidence for chronic venous insufficiency and wound healing; cognitive claims are not established.',
        bpom: 'jamu',
      },
    ],
  },
  {
    id: 'imun', judul: 'Immune, infection and inflammation', emoji: '🛡️',
    isi: [
      {
        latin: 'Echinacea purpurea', nama: 'Echinacea',
        tradisional: 'Colds and upper respiratory infection.',
        bukti: 'tidak-mendukung',
        temuan: 'Trials overall do not show that it prevents colds; any effect on duration is small and inconsistent.',
        bahaya: 'Allergic reactions, particularly in people sensitive to the daisy family.',
      },
      {
        latin: 'Andrographis paniculata', nama: 'King of bitters', lokal: 'Sambiloto',
        tradisional: 'Fever, upper respiratory infection, "hot" conditions in jamu.',
        bukti: 'terbatas',
        temuan: 'Some trials suggest symptom reduction in uncomplicated upper respiratory infection; study quality is variable.',
        bahaya: 'Avoid in pregnancy.',
        bpom: 'oht',
      },
      {
        latin: 'Phyllanthus niruri', nama: 'Stonebreaker', lokal: 'Meniran',
        tradisional: 'Immune support, liver and urinary complaints.',
        bukti: 'terbatas',
        temuan: 'Standardised extracts have been studied as immunomodulators in Indonesia; evidence is preliminary.',
        bpom: 'fitofarmaka',
      },
      {
        latin: 'Curcuma xanthorrhiza', nama: 'Javanese turmeric', lokal: 'Temulawak',
        tradisional: 'Appetite, liver support, dyspepsia.',
        bukti: 'tipis',
        temuan: 'Widely used in jamu; controlled human evidence is limited.',
        bpom: 'oht',
      },
      {
        latin: 'Sambucus nigra', nama: 'Elderberry',
        tradisional: 'Colds and influenza.',
        bukti: 'terbatas',
        temuan: 'Small trials suggest shorter symptom duration; larger confirmation is lacking.',
      },
      {
        latin: 'Allium cepa / Apium graveolens', nama: 'Onion and celery preparations',
        tradisional: 'Blood pressure and joint complaints in several traditions.',
        bukti: 'tipis',
        temuan: 'Human evidence is minimal.',
        interaksi: 'Celery seed extracts may add to antihypertensive effect.',
      },
    ],
  },
  {
    id: 'cerna', judul: 'Digestive and hepatic', emoji: '🍵',
    isi: [
      {
        latin: 'Mentha × piperita', nama: 'Peppermint oil',
        tradisional: 'Indigestion, cramps.',
        bukti: 'sedang',
        temuan: 'Enteric-coated peppermint oil has reasonably consistent evidence for irritable bowel syndrome symptoms.',
        bahaya: 'Worsens reflux if not enteric coated.',
      },
      {
        latin: 'Silybum marianum', nama: 'Milk thistle', lokal: 'Silimarin',
        tradisional: 'Liver protection.',
        bukti: 'terbatas',
        temuan: 'Studied in liver disease with inconsistent results; it is not a treatment for hepatitis or cirrhosis. Intravenous silibinin is used in Amanita mushroom poisoning, which is a separate and specific situation.',
      },
      {
        latin: 'Psidium guajava', nama: 'Guava leaf', lokal: 'Daun jambu biji',
        tradisional: 'Diarrhoea.',
        bukti: 'tipis',
        temuan: 'Traditional use is widespread; controlled evidence is limited. It is not a substitute for oral rehydration, which is the treatment that actually saves lives in diarrhoea.',
        bpom: 'jamu',
      },
      {
        latin: 'Aloe vera', nama: 'Aloe',
        tradisional: 'Burns and wounds topically; laxative internally.',
        bukti: 'terbatas',
        temuan: 'Topical use for minor burns has some support. Oral latex is a stimulant laxative.',
        bahaya: 'Oral aloe latex causes cramping and electrolyte loss and is not recommended for regular use.',
        interaksi: 'Potassium loss adds to digoxin toxicity risk and to diuretic effects.',
      },
      {
        latin: 'Glycyrrhiza glabra', nama: 'Liquorice', lokal: 'Akar manis',
        tradisional: 'Cough, gastritis, and as a flavouring in many traditional formulas.',
        bukti: 'tipis',
        temuan: 'Human evidence for the traditional indications is weak.',
        bahaya: 'Glycyrrhizin causes hypokalaemia, sodium retention and hypertension — a genuine cause of pseudohyperaldosteronism, sometimes severe.',
        interaksi: 'Worsens hypokalaemia with diuretics and increases digoxin toxicity risk; opposes antihypertensives.',
      },
      {
        latin: 'Orthosiphon aristatus', nama: "Java tea", lokal: 'Kumis kucing',
        tradisional: 'Diuretic, urinary complaints, kidney stones.',
        bukti: 'tipis',
        temuan: 'Traditional diuretic use; controlled human evidence is scarce.',
        interaksi: 'Additive effect with diuretics; caution in renal impairment.',
        bpom: 'jamu',
      },
    ],
  },
  {
    id: 'lain', judul: 'Other widely used preparations', emoji: '🌿',
    isi: [
      {
        latin: 'Serenoa repens', nama: 'Saw palmetto',
        tradisional: 'Benign prostatic hyperplasia symptoms.',
        bukti: 'tidak-mendukung',
        temuan: 'Larger, better-conducted trials did not show benefit over placebo for urinary symptoms.',
      },
      {
        latin: 'Vitex agnus-castus', nama: 'Chasteberry',
        tradisional: 'Premenstrual symptoms, cycle irregularity.',
        bukti: 'terbatas',
        temuan: 'Some trials show improvement in premenstrual symptoms; quality varies.',
        interaksi: 'Dopaminergic activity may interact with antipsychotics and dopamine agonists.',
      },
      {
        latin: 'Cimicifuga racemosa', nama: 'Black cohosh',
        tradisional: 'Menopausal hot flushes.',
        bukti: 'terbatas',
        temuan: 'Trials are mixed; any effect on hot flushes is modest.',
        bahaya: 'Reports of liver injury, uncommon but serious.',
      },
      {
        latin: 'Cannabis sativa', nama: 'Cannabis / cannabidiol',
        tradisional: 'Pain, appetite, seizures.',
        bukti: 'terbatas',
        temuan: 'Purified cannabidiol has clear, licensed evidence in specific childhood epilepsies. Evidence for chronic pain is much weaker than the marketing suggests, and legal status differs sharply between countries — in Indonesia it is prohibited.',
        interaksi: 'Cannabidiol raises clobazam levels and interacts through CYP enzymes; additive sedation.',
      },
      {
        latin: 'Nigella sativa', nama: 'Black seed', lokal: 'Habbatussauda / jintan hitam',
        tradisional: 'Widely used across the Muslim world for general health, respiratory and metabolic complaints.',
        bukti: 'terbatas',
        temuan: 'Small trials suggest modest effects on blood pressure and lipids. Studies are small and heterogeneous, so the honest summary is "promising but unsettled" rather than either dismissal or endorsement.',
        interaksi: 'May add to antihypertensive and glucose-lowering effects.',
      },
      {
        latin: 'Apis mellifera (honey)', nama: 'Honey', lokal: 'Madu',
        tradisional: 'Cough, wounds, general health.',
        bukti: 'sedang',
        temuan: 'Reasonable evidence for reducing cough in children over one year, and for wound healing in some settings.',
        bahaya: 'Never give honey to an infant under 12 months — risk of infant botulism.',
      },
      {
        latin: 'Eurycoma longifolia', nama: 'Tongkat ali', lokal: 'Pasak bumi',
        tradisional: 'Libido, energy, "male vitality".',
        bukti: 'tipis',
        temuan: 'Small studies only. Products in this category are also among the most frequently found to be adulterated with undeclared PDE5 inhibitors, which is dangerous for anyone taking nitrates.',
        bahaya: 'Adulteration is the main hazard, not the plant itself.',
      },
      {
        latin: 'Garcinia cambogia', nama: 'Garcinia',
        tradisional: 'Weight loss.',
        bukti: 'tidak-mendukung',
        temuan: 'Trials do not support meaningful weight loss.',
        bahaya: 'Reports of liver injury; weight-loss products in general are frequently adulterated with undeclared pharmaceuticals.',
      },
    ],
  },
]

export function semuaHerbal(): (Herbal & { kelompok: string })[] {
  return HERBAL.flatMap((g) => g.isi.map((h) => ({ ...h, kelompok: g.judul })))
}

export function jumlahHerbal(): number {
  return semuaHerbal().length
}

export function cariHerbal(q: string) {
  const t = q.toLowerCase().trim()
  if (!t) return []
  return semuaHerbal().filter((h) =>
    `${h.nama} ${h.latin} ${h.lokal ?? ''} ${h.tradisional}`.toLowerCase().includes(t),
  )
}

/** Herbal yang punya interaksi obat yang layak diperingatkan. */
export function berinteraksi() {
  return semuaHerbal().filter((h) => h.interaksi)
}

export default HERBAL
