export interface ClearAnatomicalStructureCard {
  readonly id: string;
  readonly fmaId: string;
  readonly uberonId: string;
  readonly nameEn: string;
  readonly nameId: string;
  readonly categoryChip: "Heart" | "Lungs" | "Liver & biliary" | "Kidney & urinary tract" | "Thyroid" | "Ear" | "Skin" | "Musculoskeletal" | "Brain & Nerves";
  readonly clearFunctionSummary: string;
  readonly howItWorksPhysiology: string;
  readonly originInsertionOrLocation: string;
  readonly arterialSupply: string;
  readonly venousAndLymphatic: string;
  readonly nerveInnervation: string;
  readonly clinicalAndDailyRelevance: string;
  readonly liveSimulationMetricLabel: string;
  readonly liveSimulationFormula: string;
  readonly defaultSliderValue: number;
  readonly sliderMin: number;
  readonly sliderMax: number;
  readonly sliderUnit: string;
  readonly cameraTargetXYZ: readonly [number, number, number];
  readonly highlightColorHex: string;
}

export const Z_ANATOMY_CLEAR_ATLAS_CARDS: readonly ClearAnatomicalStructureCard[] = [
  {
    id: "external-abdominal-oblique-left",
    fmaId: "FMA:13335",
    uberonId: "UBERON:0001116",
    nameEn: "External abdominal oblique muscle (left)",
    nameId: "Otot Obliquus Externus Abdominis (Kiri)",
    categoryChip: "Musculoskeletal",
    clearFunctionSummary: "Otot lembaran terluar dinding perut samping yang berfungsi memutar batang tubuh (rotasi torso ke sisi berlawanan), menekuk tubuh ke samping, serta menjaga tekanan intra-abdomen saat bernapas berat, batuk, dan mengangkat beban (core stability).",
    howItWorksPhysiology: "Saat berkontraksi satu sisi (unilateral), memutar dada ke arah kanan. Saat berkontraksi bersama sisi kanan (bilateral), menekuk tulang belakang (fleksi trunkus) dan menahan organ dalam perut seperti korset otot aktif.",
    originInsertionOrLocation: "Origo: Permukaan luar iga ke-5 s/d ke-12. Insersio: Linea alba, tuberkulum pubikum, dan separuh depan krista iliaka (membentuk Ligamentum Inguinale di bawah).",
    arterialSupply: "Arteri interkostalis posterior bawah, arteri subkostalis, dan cabang arteri epigastrika inferior profunda.",
    venousAndLymphatic: "Vena epigastrika & interkostalis -> Kelenjar getah bening aksilaris (di atas umbilikus) & inguinalis superfisialis (di bawah umbilikus).",
    nerveInnervation: "Saraf torakoabdominalis (cabang anterior saraf spinal T7–T11) dan saraf subkostalis (T12).",
    clinicalAndDailyRelevance: "Aponeurosis bagian bawahnya membentuk Kanalis Inguinalis (lokasi tersering Hernia Inguinalis). Sangat aktif saat menendang bola (rotasi panggul-bahu) dan latihan core/plank.",
    liveSimulationMetricLabel: "Tekanan Intra-Abdomen & Torsi Rotasi Torso",
    liveSimulationFormula: "Torsi_Rotasi (Nm) = F_otot * lengan_momen ; IAP (mmHg) = 8 + 0.35 * Kontraksi_%",
    defaultSliderValue: 65,
    sliderMin: 10,
    sliderMax: 100,
    sliderUnit: "% Aktivasi Motor Unit",
    cameraTargetXYZ: [0.14, 0.12, 0.25],
    highlightColorHex: "#f59e0b"
  },
  {
    id: "heart-chamber-myocardium",
    fmaId: "FMA:7088",
    uberonId: "UBERON:0000948",
    nameEn: "Heart & Coronary System",
    nameId: "Jantung & Arteri Koroner (Miokardium)",
    categoryChip: "Heart",
    clearFunctionSummary: "Pompa elektromekanis berotot empat ruang yang memompa ~5 liter darah per menit saat istirahat (hingga >20 L/menit saat olahraga) ke paru-paru untuk mengambil oksigen dan ke seluruh organ tubuh.",
    howItWorksPhysiology: "Siklus Wiggers: Impuls listrik dari Nodus SA memicu kontraksi atrium, diikuti kontraksi ventrikel (sistol) yang membuka katup aorta/pulmonal, lalu relaksasi pengisian darah (diastol) saat arteri koroner memperdarahi otot jantung.",
    originInsertionOrLocation: "Terletak di mediastinum media rongga dada (antara iga ke-2 hingga ICS ke-5 garis midklavikula kiri), dibungkus kantung perikardium.",
    arterialSupply: "Arteri Koroner Kiri (LMCA -> LAD untuk dinding depan/apeks & LCx) serta Arteri Koroner Kanan (RCA) dari pangkal Aorta.",
    venousAndLymphatic: "Sinus Koronarius (FMA:4706) bermuara langsung ke Atrium Kanan; drainase limfatik ke nodus trakeobronkial.",
    nerveInnervation: "Pleksus Kardiakus: Saraf Vagus (CN X - menurunkan detak jantung/HRV tinggi) & Rantai Simpatis T1–T4 (menaikkan detak & kekuatan pompa).",
    clinicalAndDailyRelevance: "Sumbatan pada cabang LAD menyebabkan serangan jantung (STEMI Anterior). Latihan aerobik rutin memperbesar volume sekuncup (Stroke Volume) sehingga detak jantung istirahat lebih rendah dan efisien.",
    liveSimulationMetricLabel: "Curah Jantung (Cardiac Output) & Tekanan Ventrikel Kiri",
    liveSimulationFormula: "CO (L/min) = (HR * SV) / 1000 ; Aliran_Koroner = (pi * dP * r^4) / (8 * mu * L)",
    defaultSliderValue: 72,
    sliderMin: 45,
    sliderMax: 190,
    sliderUnit: "bpm (Detak Jantung)",
    cameraTargetXYZ: [0.03, 0.34, 0.22],
    highlightColorHex: "#f43f5e"
  },
  {
    id: "lungs-bronchial-alveolar",
    fmaId: "FMA:7195",
    uberonId: "UBERON:0002048",
    nameEn: "Bilateral Lungs & Bronchial Tree",
    nameId: "Paru-Paru Kanan & Kiri (Alveoli & Bronkus)",
    categoryChip: "Lungs",
    clearFunctionSummary: "Organ pertukaran gas utama dengan ~480 juta kantung alveoli (luas permukaan ~70 m2) yang memasukkan oksigen (O2) dari udara ke darah kapiler dan membuang karbon dioksida (CO2).",
    howItWorksPhysiology: "Saat diafragma berkontraksi turun, tekanan rongga dada menjadi negatif sehingga udara mengalir masuk melalui trakea -> bronkus -> bronkiolus -> alveoli, lalu O2 berdifusi menembus membran 0.5 mikron ke sel darah merah.",
    originInsertionOrLocation: "Rongga toraks kanan (3 lobus: superior, media, inferior) dan kiri (2 lobus: superior, inferior + lingula), dilapisi pleura viseralis & parietalis.",
    arterialSupply: "Arteri Pulmonalis (membawa darah deoksigenasi dari RV untuk pertukaran gas) & Arteri Bronkialis (nutrisi jaringan paru dari Aorta).",
    venousAndLymphatic: "4 Vena Pulmonalis membawa darah kaya O2 ke Atrium Kiri; KGB Hilar (Bronkopulmonal) -> Trakeobronkial -> Paratrakeal.",
    nerveInnervation: "Pleksus Pulmonalis: Saraf Vagus (CN X - bronkokonstriksi) & Simpatis T2–T5 (bronkodilatasi beta-2); Diafragma oleh N. Phrenicus (C3–C5).",
    clinicalAndDailyRelevance: "Kapasitas difusi paru menentukan VO2Max atletik. Pada asma terjadi penyempitan bronkiolus, sedangkan pada pneumonia/ARDS cairan mengisi alveoli sehingga saturasi SpO2 turun.",
    liveSimulationMetricLabel: "Ventilasi Alveolar & Tekanan Oksigen Alveoli (PAO2)",
    liveSimulationFormula: "V_A (L/min) = RR * (VT - VD) / 1000 ; PAO2 = FiO2*(760 - 47) - PaCO2/0.8",
    defaultSliderValue: 16,
    sliderMin: 8,
    sliderMax: 42,
    sliderUnit: "napas/menit (RR)",
    cameraTargetXYZ: [0.0, 0.36, 0.20],
    highlightColorHex: "#06b6d4"
  },
  {
    id: "liver-and-biliary-tree",
    fmaId: "FMA:7197",
    uberonId: "UBERON:0002107",
    nameEn: "Liver, Gallbladder & Biliary System",
    nameId: "Hati (Hepar), Kandung Empedu & Saluran Bilier",
    categoryChip: "Liver & biliary",
    clearFunctionSummary: "Pusat metabolisme terbesar tubuh (8 segmen Couinaud) yang menyaring darah dari saluran cerna (Vena Porta), menyimpan glikogen, mendetoksifikasi obat (enzim CYP450), dan memproduksi empedu untuk mencerna lemak.",
    howItWorksPhysiology: "Menerima 75% aliran dari Vena Porta (kaya nutrisi usus) dan 25% dari Arteri Hepatika. Saat makan berlemak, hormon CCK memicu kandung empedu berkontraksi mengalirkan empedu melalui Duktus Sistikus & Duktus Koledokus ke duodenum.",
    originInsertionOrLocation: "Kuadran kanan atas abdomen (hipokondrium kanan) tepat di bawah kubah diafragma kanan, terlindung iga ke-7 s/d ke-11.",
    arterialSupply: "Arteri Hepatika Propria (cabang Truncus Coeliacus) & Arteri Sistika (di dalam Segitiga Calot).",
    venousAndLymphatic: "Sinusoid hati -> Vena Sentralis -> 3 Vena Hepatika (Kanan, Tengah, Kiri) -> Vena Kava Inferior (IVC).",
    nerveInnervation: "Pleksus Hepatikus (serabut simpatis Celiac T7–T10 & parasimpatis N. Vagus); nyeri kandung empedu dapat menjalar ke bahu kanan (Kehr sign C3–C5).",
    clinicalAndDailyRelevance: "Pada operasi pengangkatan kandung empedu (Kolesistektomi Laparoskopi), dokter wajib mengidentifikasi Segitiga Calot (Critical View of Safety) agar tidak memotong Duktus Koledokus (CBD).",
    liveSimulationMetricLabel: "Kinetika Glukosa-Insulin Portal & Fraksi Ejeksi Empedu",
    liveSimulationFormula: "Clearance_Hepar = Q_porta * Rasio_Ekstraksi ; Ejeksi_Empedu_% = 15 + 1.45 * Lemak_g",
    defaultSliderValue: 50,
    sliderMin: 0,
    sliderMax: 120,
    sliderUnit: "gram Karbohidrat/Lemak Makanan",
    cameraTargetXYZ: [-0.09, 0.18, 0.22],
    highlightColorHex: "#f97316"
  },
  {
    id: "kidney-and-urinary-tract",
    fmaId: "FMA:7203",
    uberonId: "UBERON:0002113",
    nameEn: "Kidneys, Nephrons & Urinary Tract",
    nameId: "Ginjal, Nefron & Saluran Kemih (Ureter-Vesika)",
    categoryChip: "Kidney & urinary tract",
    clearFunctionSummary: "Sepasang organ penyaring darah retroperitoneal (~1.2 juta nefron per ginjal) yang menyaring 180 liter cairan per hari untuk membuang racun (ureum/kreatinin), menjaga keseimbangan elektrolit (Na+, K+), asam-basa (pH), dan tekanan darah.",
    howItWorksPhysiology: "Darah masuk ke kapiler Glomerulus dengan tekanan hidrostatik ~60 mmHg (menghasilkan GFR ~120 mL/menit). Lengkung Henle menciptakan gradien osmotik hingga 1200 mOsm/kg agar air dapat diserap kembali dengan bantuan hormon ADH.",
    originInsertionOrLocation: "Retroperitoneal setinggi vertebra T12 hingga L3 (ginjal kanan sedikit lebih rendah karena terdesak hati); mengalir melalui ureter ke kandung kemih.",
    arterialSupply: "Arteri Renalis (langsung dari Aorta setinggi L1/L2) -> Segmental -> Interlobar -> Arkuata -> Arteriol Aferen -> Glomerulus -> Arteriol Eferen.",
    venousAndLymphatic: "Vena Renalis bermuara ke Vena Kava Inferior; KGB Lumbalis Para-Aorta.",
    nerveInnervation: "Pleksus Renalis (Simpatis T10–L1): merangsang pelepasan hormon Renin (RAAS) saat tekanan darah turun.",
    clinicalAndDailyRelevance: "Ginjal mempertahankan GFR tetap stabil pada MAP 80–170 mmHg (Autoregulasi). Jika MAP turun <65 mmHg (syok/dehidrasi berat), GFR turun drastis menyebabkan Gagal Ginjal Akut (Prerenal AKI).",
    liveSimulationMetricLabel: "Laju Filtrasi Glomerulus (GFR) & Autoregulasi Nefron",
    liveSimulationFormula: "GFR (mL/min) = Kf * (P_Glomerulus - P_Bowman - Pi_Onkotik)",
    defaultSliderValue: 95,
    sliderMin: 45,
    sliderMax: 185,
    sliderUnit: "mmHg (Tekanan Darah MAP)",
    cameraTargetXYZ: [0.08, 0.12, -0.15],
    highlightColorHex: "#10b981"
  },
  {
    id: "thyroid-and-endocrine",
    fmaId: "FMA:9668",
    uberonId: "UBERON:0002046",
    nameEn: "Thyroid Gland & Endocrine Axis",
    nameId: "Kelenjar Tiroid & Aksis Endokrin-Metabolik",
    categoryChip: "Thyroid",
    clearFunctionSummary: "Kelenjar endokrin berbentuk kupu-kupu di leher depan yang memproduksi hormon T3 dan T4 untuk mengatur kecepatan metabolisme basal seluruh sel tubuh, suhu tubuh, detak jantung, dan pembakaran energi.",
    howItWorksPhysiology: "Dikendalikan oleh poros Hipotalamus (TRH) -> Hipofisis Anterior (TSH) -> Folikel Tiroid (mengikat yodium ke tiroglobulin menjadi hormon T4 & T3 aktif) serta sel parafolikuler C yang menghasilkan Kalsitonin (pengatur kalsium tulang).",
    originInsertionOrLocation: "Leher bagian depan setinggi cincin trakea ke-2 hingga ke-4 (di depan laring/trakea), terdiri dari lobus kanan, lobus kiri, dan isthmus.",
    arterialSupply: "Arteri Tiroidea Superior (cabang A. Karotis Eksterna) & Arteri Tiroidea Inferior (cabang Truncus Thyrocervicalis).",
    venousAndLymphatic: "Vena Tiroidea Superior, Media (ke V. Jugularis Interna), dan Inferior (ke V. Brakiosefalika); KGB Prelaringeal & Servikalis Profunda.",
    nerveInnervation: "Berjalan sangat dekat dengan Saraf Laringeus Rekuren (cabang N. Vagus yang menggerakkan pita suara) dan N. Laringeus Superior.",
    clinicalAndDailyRelevance: "Kelebihan hormon tiroid (Hipertiroidisme/Graves) memicu takikardia, tremor, dan penurunan berat badan; saat operasi Tiroidektomi, Saraf Laringeus Rekuren wajib dilindungi agar suara pasien tidak serak permanen.",
    liveSimulationMetricLabel: "Kecepatan Metabolisme Basal (BMR) & Aksis TSH-T3/T4",
    liveSimulationFormula: "BMR_Multiplier = 0.65 + 0.30 * Free_T3_pgMl ; HOMA_IR = (Glukosa * Insulin) / 405",
    defaultSliderValue: 3.2,
    sliderMin: 1.0,
    sliderMax: 8.5,
    sliderUnit: "pg/mL (Hormon Free T3)",
    cameraTargetXYZ: [0.0, 0.56, 0.16],
    highlightColorHex: "#eab308"
  },
  {
    id: "ear-cochleovestibular-ent",
    fmaId: "FMA:52780",
    uberonId: "UBERON:0001690",
    nameEn: "Ear, Cochlea & Vestibular Labyrinth (ENT / THT-KL)",
    nameId: "Telinga, Koklea & Labirin Vestibular (THT-KL)",
    categoryChip: "Ear",
    clearFunctionSummary: "Organ sensorik ganda di tulang temporal yang mengubah gelombang mekanis suara menjadi sinyal listrik saraf pendengaran (Koklea) sekaligus mendeteksi percepatan rotasi dan gravitasi kepala untuk menjaga keseimbangan tubuh (Vestibular).",
    howItWorksPhysiology: "Gelombang suara menggetarkan Membran Timpani -> 3 tulang pendengaran (Maleus, Inkus, Stapes) -> Jendela Oval -> menggerakkan cairan perilimfe/endolimfe di Membran Basilaris Koklea -> membuka kanal ion sel rambut (Organ Corti) menuju CN VIII.",
    originInsertionOrLocation: "Terbagi menjadi Telinga Luar (Aurikula & CAE), Telinga Tengah (Kavum Timpani + Tuba Eustachius ke Nasofaring), dan Telinga Dalam (Labirin Osseus di Pars Petrosa Os Temporale).",
    arterialSupply: "Arteri Labirintina (cabang AICA / A. Basilaris) untuk telinga dalam; cabang A. Maksilaris & A. Aurikularis Posterior untuk telinga tengah/luar.",
    venousAndLymphatic: "Vena Labirintina -> Sinus Petrosus Inferior / Sinus Sigmoideus; KGB Preaurikular, Parotis & Retroaurikular.",
    nerveInnervation: "Saraf Vestibulokoklearis (CN VIII) untuk pendengaran/keseimbangan; Saraf Fasialis (CN VII) berjalan melewati kanalis fasialis telinga tengah + korda timpani.",
    clinicalAndDailyRelevance: "Sangat penting dalam pemeriksaan Koas THT-KL (Otoskopi kerucut cahaya arah jam 5 kanan / jam 7 kiri, tes garpu tala Rinne/Weber/Schwabach, audiometri nada murni PTA, serta manuver Dix-Hallpike/Epley pada vertigo BPPV).",
    liveSimulationMetricLabel: "Ambang Dengar Audiometri (PTA dB HL) & Transduksi Koklea",
    liveSimulationFormula: "PTA (dB HL) = (dB_500Hz + dB_1000Hz + dB_2000Hz + dB_4000Hz) / 4",
    defaultSliderValue: 12,
    sliderMin: 0,
    sliderMax: 95,
    sliderUnit: "dB HL (Ambang Dengar Rata-Rata)",
    cameraTargetXYZ: [0.09, 0.68, 0.05],
    highlightColorHex: "#a855f7"
  },
  {
    id: "skin-integumentary-barrier",
    fmaId: "FMA:7163",
    uberonId: "UBERON:0002097",
    nameEn: "Skin, Dermis & Cutaneous Sensory Envelope",
    nameId: "Kulit (Epidermis, Dermis & Subkutis / Integumen)",
    categoryChip: "Skin",
    clearFunctionSummary: "Organ pelindung terluar dan terluas tubuh (~1.8 m2) yang menjaga cairan tubuh agar tidak menguap (sawar stratum korneum), mengatur suhu tubuh melalui keringat dan vasodilatasi kapiler, serta mendeteksi sentuhan, tekanan, suhu, dan nyeri.",
    howItWorksPhysiology: "Saat suhu tubuh naik (mis. olahraga/demam), hipotalamus memicu vasodilatasi pleksus kapiler dermis dan sekresi kelenjar keringat ekrin (pendinginan evaporatif). Keratinosit memproduksi melanin dan vitamin D3 saat terpapar sinar UV-B.",
    originInsertionOrLocation: "Melapisi seluruh permukaan luar tubuh dalam 3 lapisan: Epidermis (epitel skuamosa berlapis berkeratin), Dermis (kolagen tipe I/III, elastin, pembuluh darah, folikel), dan Hipodermis (jaringan adiposa subkutan).",
    arterialSupply: "Pleksus kutaneus profunda (batas dermosubkutan) dan pleksus subpapilaris superfisialis (lengkung kapiler papila dermis).",
    venousAndLymphatic: "Jaringan kapiler limfatik dermis tanpa katup -> pembuluh limfe kolektor -> KGB regional (Aksila, Inguinal, Servikal).",
    nerveInnervation: "Peta Dermatom Saraf Spinal (C2–S5) & CN V (Wajah): Korpuskulum Meissner (sentuhan halus), Pacini (getaran/tekanan dalam), Ruffini, dan ujung saraf bebas (nosiseptor nyeri/suhu).",
    clinicalAndDailyRelevance: "Integritas sawar kulit diukur dengan Transepidermal Water Loss (TEWL). Pada luka bakar luas, hilangnya sawar epidermis memicu kebocoran cairan masif yang memerlukan resusitasi cairan formula Parkland.",
    liveSimulationMetricLabel: "Termoregulasi Keringat & Transepidermal Water Loss (TEWL)",
    liveSimulationFormula: "Evaporative_Cooling (W) = Laju_Keringat_L_jam * 675 ; TEWL = D * dC/dx",
    defaultSliderValue: 36.8,
    sliderMin: 35.0,
    sliderMax: 40.5,
    sliderUnit: "°C (Suhu Inti Tubuh)",
    cameraTargetXYZ: [0.0, 0.25, 0.35],
    highlightColorHex: "#fdba74"
  }
];

export function findClearStructureCard(queryOrChip: string): ClearAnatomicalStructureCard {
  const q = (queryOrChip || "").toLowerCase().trim();
  if (!q) return Z_ANATOMY_CLEAR_ATLAS_CARDS[0];
  return (
    Z_ANATOMY_CLEAR_ATLAS_CARDS.find(
      (c) =>
        c.id.toLowerCase() === q ||
        c.categoryChip.toLowerCase() === q ||
        c.nameEn.toLowerCase().includes(q) ||
        c.nameId.toLowerCase().includes(q)
    ) ?? Z_ANATOMY_CLEAR_ATLAS_CARDS[0]
  );
}