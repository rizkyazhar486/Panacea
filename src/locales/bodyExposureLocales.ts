export type SupportedLocale = "en" | "id";

export interface BodyExposureLocaleDictionary {
  readonly atlasTitle: string;
  readonly atlasSubtitle: string;
  readonly searchPlaceholder: string;
  readonly searchEmptyState: string;
  readonly stage1Anatomy: string;
  readonly stage2LivingPhysiology: string;
  readonly stage3ClinicalRelevance: string;
  readonly actionSeeLivingPhysiology: string;
  readonly actionClinicalRelevance: string;
  readonly actionIsolate: string;
  readonly actionHide: string;
  readonly actionFadeOthers: string;
  readonly actionExplodedView: string;
  readonly actionCrossSection: string;
  readonly actionResetView: string;
  readonly provenanceAtlasReferenceLabel: string;
  readonly provenanceEducationalOnly: string;
  readonly provenanceSimulatedDisclaimer: string;
  readonly gapNotYetSourceBacked: string;
  readonly gapHonestExplanation: string;
  readonly referenceBodyMaleZAnatomy: string;
  readonly referenceBodyFemaleHra: string;
  readonly structures: Readonly<Record<string, {
    readonly canonicalNameEn: string;
    readonly localizedName: string;
    readonly oneSentenceFunction: string;
    readonly detailedMechanism: string;
    readonly vascularAndNeuralSummary: string;
    readonly clinicalCorrelationSummary: string;
  }>>;
}

export const BODY_EXPOSURE_LOCALES: Readonly<Record<SupportedLocale, BodyExposureLocaleDictionary>> = {
  en: {
    atlasTitle: "Body Exposure Atlas",
    atlasSubtitle: "One Canonical 3D Scene · 7 Z-Anatomy Layers · Progressive Disclosure",
    searchPlaceholder: "Search structure by name, FMA, or mesh ID (e.g., Heart, Femur, Oblique)...",
    searchEmptyState: "No matching anatomical structure found in the canonical registry.",
    stage1Anatomy: "1. Anatomy",
    stage2LivingPhysiology: "2. Living Physiology",
    stage3ClinicalRelevance: "3. Clinical Relevance",
    actionSeeLivingPhysiology: "See Living Physiology",
    actionClinicalRelevance: "Clinical Relevance",
    actionIsolate: "Isolate",
    actionHide: "Hide",
    actionFadeOthers: "Fade Others",
    actionExplodedView: "Exploded View",
    actionCrossSection: "Cross-Section",
    actionResetView: "Reset View",
    provenanceAtlasReferenceLabel: "ATLAS_REFERENCE (Z-Anatomy CC-BY-SA 4.0 / HuBMAP HRA CC-BY 4.0)",
    provenanceEducationalOnly: "Educational reference anatomy only — never represents individual patient anatomy.",
    provenanceSimulatedDisclaimer: "SIMULATED: Mechanistic physiological model for educational exploration only.",
    gapNotYetSourceBacked: "Not yet source-backed",
    gapHonestExplanation: "This microstructure or regional coverage is not yet backed by a verified 3D mesh in the current release. No placeholder geometry is rendered.",
    referenceBodyMaleZAnatomy: "Reference Body: Male (Z-Anatomy Shipped)",
    referenceBodyFemaleHra: "Reference Body: Female (HRA v1.5 Regional / Gated)",
    structures: {
      "Heart_Myocardium.g": {
        canonicalNameEn: "Heart & Coronary Myocardium",
        localizedName: "Heart & Coronary Myocardium",
        oneSentenceFunction: "Four-chambered muscular pump driving systemic and pulmonary blood circulation across the Wiggers cardiac cycle.",
        detailedMechanism: "Pacemaker depolarization from the SA node triggers atrial systole followed by ventricular isovolumetric contraction and ejection (CO = HR x SV).",
        vascularAndNeuralSummary: "Arterial: Left Main (LAD, LCx) & Right Coronary Artery · Venous: Coronary Sinus · Nerve: Vagus (CN X) & Sympathetic T1-T4.",
        clinicalCorrelationSummary: "AHA 17-segment coronary territory mapping, T1-T5 viscerosomatic referred pain, and cardiopulmonary ventricular-arterial coupling."
      },
      "External_abdominal_oblique_left.g": {
        canonicalNameEn: "External abdominal oblique muscle (left)",
        localizedName: "External abdominal oblique muscle (left)",
        oneSentenceFunction: "Superficial lateral abdominal wall muscle that rotates the trunk contralaterally, flexes the spine laterally, and stabilizes intra-abdominal pressure.",
        detailedMechanism: "Unilateral contraction rotates the thorax to the opposite side; bilateral contraction compresses abdominal viscera and assists forced expiration.",
        vascularAndNeuralSummary: "Arterial: Lower posterior intercostal, subcostal & inferior epigastric arteries · Nerve: Thoracoabdominal nerves (T7-T11) & subcostal nerve (T12).",
        clinicalCorrelationSummary: "Its inferior aponeurosis forms the inguinal ligament and superficial inguinal ring (key landmark in inguinal hernia repair)."
      },
      "Lung_Parenchyma_Bilateral.g": {
        canonicalNameEn: "Bilateral Lungs & Bronchial Alveolar Tree",
        localizedName: "Bilateral Lungs & Bronchial Alveolar Tree",
        oneSentenceFunction: "Primary gas-exchange organs transferring inspired oxygen into pulmonary capillaries and eliminating carbon dioxide via alveolar ventilation.",
        detailedMechanism: "Diaphragmatic descent generates negative intrathoracic pressure, driving convective airflow into 480 million alveoli for Fick diffusion across the 0.5-micron blood-air barrier.",
        vascularAndNeuralSummary: "Arterial: Pulmonary arteries (gas exchange) & bronchial arteries · Venous: 4 Pulmonary veins · Nerve: Pulmonary plexus (Vagus CN X & T2-T5) + Phrenic (C3-C5).",
        clinicalCorrelationSummary: "Ventilation-perfusion (V/Q) mismatch analysis, alveolar gas equation (PAO2), and lung-protective mechanical ventilation."
      },
      "Kidney_Nephron_Bilateral.g": {
        canonicalNameEn: "Bilateral Kidneys & Urinary Tract",
        localizedName: "Bilateral Kidneys & Urinary Tract",
        oneSentenceFunction: "Retroperitoneal filtration organs regulating extracellular fluid volume, osmolarity, electrolyte balance, and acid-base homeostasis across 2.4 million nephrons.",
        detailedMechanism: "Starling forces across the glomerular capillary tuft drive ultrafiltration (GFR ~120 mL/min), stabilized by myogenic and macula densa tubuloglomerular feedback (MAP 80-170 mmHg).",
        vascularAndNeuralSummary: "Arterial: Renal arteries (L1-L2) -> Afferent/Efferent arterioles · Venous: Renal veins -> IVC · Nerve: Renal sympathetic plexus (T10-L1).",
        clinicalCorrelationSummary: "Prerenal vs. intrinsic AKI differentiation (FE_Na), Loop of Henle countercurrent multiplication, and T11-L2 flank/inguinal referred pain."
      },
      "Brain_Cerebral_Cortex.g": {
        canonicalNameEn: "Brain, Cerebral Cortex & Cranial Nerves",
        localizedName: "Brain, Cerebral Cortex & Cranial Nerves",
        oneSentenceFunction: "Central nervous system command center governing sensorimotor integration, oculomotor control, cognition, and autonomic homeostasis.",
        detailedMechanism: "Hodgkin-Huxley voltage-gated Na+/K+ channels propagate action potentials along myelinated corticospinal and cranial nerve tracts via saltatory conduction.",
        vascularAndNeuralSummary: "Arterial: Circle of Willis (Internal Carotid ACA/MCA & Vertebrobasilar PCA) · Venous: Dural sinuses -> Internal Jugular · Cranial Nerves: CN I-XII.",
        clinicalCorrelationSummary: "Vascular stroke territory localization, oculomotor CN III/IV/VI lesion lab, and cerebral perfusion pressure (CPP = MAP - ICP)."
      }
    }
  },
  id: {
    atlasTitle: "Atlas Body Exposure",
    atlasSubtitle: "Satu Scene 3D Kanonik · 7 Layer Z-Anatomy · Progressive Disclosure",
    searchPlaceholder: "Cari struktur berdasarkan nama, FMA, atau ID mesh (mis. Jantung, Femur, Obliquus)...",
    searchEmptyState: "Tidak ditemukan struktur anatomi yang cocok di registri kanonik.",
    stage1Anatomy: "1. Anatomi",
    stage2LivingPhysiology: "2. Fisiologi Hidup",
    stage3ClinicalRelevance: "3. Relevansi Klinis",
    actionSeeLivingPhysiology: "Lihat Fisiologi Hidup",
    actionClinicalRelevance: "Relevansi Klinis",
    actionIsolate: "Isolasi",
    actionHide: "Sembunyikan",
    actionFadeOthers: "Redupkan Lainnya",
    actionExplodedView: "Tampilan Exploded",
    actionCrossSection: "Potongan Melintang",
    actionResetView: "Reset Kamera",
    provenanceAtlasReferenceLabel: "ATLAS_REFERENCE (Z-Anatomy CC-BY-SA 4.0 / HuBMAP HRA CC-BY 4.0)",
    provenanceEducationalOnly: "Anatomi referensi edukatif — bukan representasi anatomi spesifik pasien.",
    provenanceSimulatedDisclaimer: "SIMULATED: Model mekanistik fisiologi khusus untuk eksplorasi edukatif.",
    gapNotYetSourceBacked: "Belum tersedia mesh sumber terverifikasi",
    gapHonestExplanation: "Mikrostruktur atau cakupan regional ini belum memiliki geometri 3D terverifikasi pada rilis saat ini. Tidak ada geometri karangan yang ditampilkan.",
    referenceBodyMaleZAnatomy: "Tubuh Referensi: Pria (Z-Anatomy Terverifikasi)",
    referenceBodyFemaleHra: "Tubuh Referensi: Wanita (HRA v1.5 Regional / Terkontrol)",
    structures: {
      "Heart_Myocardium.g": {
        canonicalNameEn: "Heart & Coronary Myocardium",
        localizedName: "Jantung & Miokardium Koroner",
        oneSentenceFunction: "Pompa berotot empat ruang yang menggerakkan sirkulasi darah sistemik dan pulmonal sepanjang siklus jantung Wiggers.",
        detailedMechanism: "Depolarisasi nodus SA memicu sistol atrium diikuti kontraksi isovolumetrik dan ejeksi ventrikel (CO = HR x SV).",
        vascularAndNeuralSummary: "Arteri: Koroner Kiri (LAD, LCx) & Kanan (RCA) · Vena: Sinus Koronarius · Saraf: N. Vagus (CN X) & Simpatis T1-T4.",
        clinicalCorrelationSummary: "Pemetaan 17-segmen koroner AHA, nyeri alih viserosomatik T1-T5, dan kopling ventrikulo-arterial kardiopulmonal."
      },
      "External_abdominal_oblique_left.g": {
        canonicalNameEn: "External abdominal oblique muscle (left)",
        localizedName: "Otot Obliquus Externus Abdominis (Kiri)",
        oneSentenceFunction: "Otot lembaran superfisial dinding perut samping yang memutar batang tubuh ke sisi berlawanan, menekuk torso, dan menstabilkan tekanan intra-abdomen.",
        detailedMechanism: "Kontraksi satu sisi memutar dada ke sisi kontralateral; kontraksi dua sisi menekan visera abdomen dan membantu ekspirasi paksa.",
        vascularAndNeuralSummary: "Arteri: Interkostalis posterior bawah, subkostalis & epigastrika inferior · Saraf: Torakoabdominalis (T7-T11) & subkostalis (T12).",
        clinicalCorrelationSummary: "Aponeurosis bawahnya membentuk Ligamentum Inguinale dan cincin inguinalis superfisialis (penanda kunci bedah Hernia Inguinalis)."
      },
      "Lung_Parenchyma_Bilateral.g": {
        canonicalNameEn: "Bilateral Lungs & Bronchial Alveolar Tree",
        localizedName: "Paru-Paru Bilateral & Pohon Bronkoalveolar",
        oneSentenceFunction: "Organ pertukaran gas utama yang mengalirkan oksigen inspirasi ke kapiler paru dan membuang karbon dioksida melalui ventilasi alveolar.",
        detailedMechanism: "Penurunan diafragma menciptakan tekanan intratoraks negatif, menarik udara ke 480 juta alveoli untuk difusi Fick menembus membran 0.5 mikron.",
        vascularAndNeuralSummary: "Arteri: A. Pulmonalis & A. Bronkialis · Vena: 4 V. Pulmonalis · Saraf: Pleksus Pulmonalis (CN X & T2-T5) + N. Phrenicus (C3-C5).",
        clinicalCorrelationSummary: "Analisis ketidaksesuaian V/Q, persamaan gas alveolar (PAO2), dan ventilasi mekanis pelindung paru."
      },
      "Kidney_Nephron_Bilateral.g": {
        canonicalNameEn: "Bilateral Kidneys & Urinary Tract",
        localizedName: "Ginjal Bilateral & Saluran Kemih",
        oneSentenceFunction: "Organ penyaring retroperitoneal yang mengatur volume cairan ekstraseluler, osmolaritas, elektrolit, dan asam-basa melalui 2,4 juta nefron.",
        detailedMechanism: "Gaya Starling pada glomerulus mendorong ultrafiltrasi (GFR ~120 mL/menit), dijaga stabil oleh umpan balik miogenik dan tubuloglomerular (MAP 80-170 mmHg).",
        vascularAndNeuralSummary: "Arteri: A. Renalis (L1-L2) -> Arteriol Aferen/Eferen · Vena: V. Renalis -> IVC · Saraf: Pleksus simpatis renalis (T10-L1).",
        clinicalCorrelationSummary: "Diferensiasi AKI prerenal vs intrinsik (FE_Na), multiplikasi arus balik Lengkung Henle, dan nyeri alih pinggang-inguinal T11-L2."
      },
      "Brain_Cerebral_Cortex.g": {
        canonicalNameEn: "Brain, Cerebral Cortex & Cranial Nerves",
        localizedName: "Otak, Korteks Serebri & Saraf Kranial",
        oneSentenceFunction: "Pusat komando sistem saraf pusat yang mengatur integrasi sensorimotor, gerakan bola mata, kognisi, dan homeostasis otonom.",
        detailedMechanism: "Kanal ion Na+/K+ Hodgkin-Huxley menghantarkan potensial aksi di sepanjang traktus bermielin melalui konduksi saltatori.",
        vascularAndNeuralSummary: "Arteri: Sirkulus Willisi (Karotis Interna ACA/MCA & Vertebrobasilar PCA) · Vena: Sinus Duramater -> V. Jugularis Interna · Saraf: CN I-XII.",
        clinicalCorrelationSummary: "Lokalisasi lesi stroke vaskular, laboratorium lesi okulomotor CN III/IV/VI, dan tekanan perfusi serebral (CPP = MAP - ICP)."
      }
    }
  }
};

export function tBodyExposure(locale: SupportedLocale = "en"): BodyExposureLocaleDictionary {
  return BODY_EXPOSURE_LOCALES[locale] ?? BODY_EXPOSURE_LOCALES.en;
}