import { type CanonicalBodySystemId } from "./singleProjectileUhdBodyExposureEngine.ts";

export type SemanticZoomScaleLevel =
  | "LEVEL_1_WHOLE_HUMAN"
  | "LEVEL_2_ORGAN_SYSTEM"
  | "LEVEL_3_GROSS_ORGAN"
  | "LEVEL_4_ANATOMICAL_SUBSTRUCTURE"
  | "LEVEL_5_TISSUE_HISTOLOGY"
  | "LEVEL_6_FUNCTIONAL_CELL"
  | "LEVEL_7_SUBCELLULAR_ORGANELLE"
  | "LEVEL_8_PROTEIN_MOLECULAR_PATHWAY"
  | "LEVEL_9_GENOMIC_LOCUS";

export type AnatomicalViewProjectionMode =
  | "ANTERIOR_CORONAL_VIEW"
  | "POSTERIOR_DORSAL_VIEW"
  | "SAGITTAL_CROSS_SECTION"
  | "EXPLODED_LAYER_DISSECTION";

export interface NineLevelMultiscaleChain {
  readonly level1WholeHuman: string;
  readonly level2OrganSystem: string;
  readonly level3GrossOrgan: string;
  readonly level4Substructure: string;
  readonly level5TissueHistology: string;
  readonly level6FunctionalCell: string;
  readonly level7Organelle: string;
  readonly level8ProteinPathway: string;
  readonly level9GenomicLocus: string;
}

export interface DeepSystemAnatomicalPhysiologicalSpec {
  readonly systemId: CanonicalBodySystemId;
  readonly displayName: string;
  readonly fmaId: string;
  readonly uberonId: string;
  readonly cellOntologyId: string;
  readonly rcsbPdbId: string;
  readonly reactomePathwayId: string;
  readonly grossAnatomyAndNeurovascular: {
    readonly regionalSubdivisions: readonly string[];
    readonly arterialSupply: string;
    readonly venousDrainage: string;
    readonly innervation: string;
    readonly lymphaticDrainage: string;
  };
  readonly nineLevelScaleChain: NineLevelMultiscaleChain;
  readonly physiologicalMechanics: {
    readonly governingEquation: string;
    readonly homeostaticReferenceRange: string;
    readonly regulatoryFeedbackLoop: string;
    readonly crossSystemCouplingTargets: readonly CanonicalBodySystemId[];
  };
  readonly pathophysiologyAndClinicalUtility: {
    readonly representativePathologies: readonly string[];
    readonly diagnosticBiomarkersAndImaging: string;
    readonly surgicalAndProceduralSimulationLink: string;
    readonly clinicalApplicationUtility: string;
  };
  readonly canvasHotspotNormalizedBox: {
    readonly centerX0to1: number;
    readonly centerY0to1: number;
    readonly radius0to1: number;
  };
}

export const DEEP_11_SYSTEM_MULTISCALE_ATLAS: readonly DeepSystemAnatomicalPhysiologicalSpec[] = [
  {
    systemId: "CARDIOVASCULAR_CIRCULATORY",
    displayName: "Cardiovascular / Circulatory",
    fmaId: "FMA:7088",
    uberonId: "UBERON:0000948",
    cellOntologyId: "CL:0000746 (Ventricular Cardiomyocyte)",
    rcsbPdbId: "PDB:6U9G (RyR2) · PDB:1T3S (SERCA2a)",
    reactomePathwayId: "R-HSA-5576891 (Cardiac Conduction & CICR)",
    grossAnatomyAndNeurovascular: {
      regionalSubdivisions: ["LA/RA Atria", "LV/RV Ventricles (AHA 17-Segment)", "Aortic/Mitral/Tricuspid/Pulmonic Valves", "SA/AV Node & His-Purkinje"],
      arterialSupply: "Left Main (LMCA -> LAD FMA:3862, LCx) & Right Coronary Artery (RCA) from Sinuses of Valsalva",
      venousDrainage: "Great, Middle & Small Cardiac Veins -> Coronary Sinus (FMA:4706) -> Right Atrium",
      innervation: "Autonomic Cardiac Plexus: Vagus Nerve (CN X, parasymp M2) & Sympathetic T1-T4 Ganglia (beta-1)",
      lymphaticDrainage: "Subendocardial -> Myocardial -> Subepicardial Plexus -> Tracheobronchial & Brachiocephalic Nodes"
    },
    nineLevelScaleChain: {
      level1WholeHuman: "Homo sapiens (FMA:20394)",
      level2OrganSystem: "Cardiovascular System (UBERON:0004535)",
      level3GrossOrgan: "Heart (FMA:7088)",
      level4Substructure: "Left Anterior Descending Coronary Artery & Anteroapical LV Wall (FMA:3862)",
      level5TissueHistology: "Syncytial Striated Myocardium with Intercalated Discs (Connexin-43 Gap Junctions)",
      level6FunctionalCell: "Ventricular Cardiomyocyte (CL:0000746)",
      level7Organelle: "Dyadic Cleft (T-Tubule DHPR L-Type CaV1.2 apposed to Junctional SR RyR2)",
      level8ProteinPathway: "Calcium-Induced Calcium Release (PDB:6U9G RyR2 + Troponin-C + Myosin Heavy Chain)",
      level9GenomicLocus: "MYH7 (14q11.2), RYR2 (1q43), SCN5A (3p22.2)"
    },
    physiologicalMechanics: {
      governingEquation: "CO = HR * SV ; P_LV(t) = E(t)*[V(t) - V_0] ; Q_coronary = (pi * dP * r^4) / (8 * mu * L)",
      homeostaticReferenceRange: "CO 4.5-6.0 L/min · MAP 70-100 mmHg · LVEF 55-70% · Coronary Flow 250 mL/min",
      regulatoryFeedbackLoop: "Carotid Sinus & Aortic Arch Baroreflex -> Nucleus Tractus Solitarii (NTS) -> Sympathetic/Vagal Tone",
      crossSystemCouplingTargets: ["RESPIRATORY_PULMONARY", "RENAL_URINARY", "NERVOUS_NEUROLOGICAL"]
    },
    pathophysiologyAndClinicalUtility: {
      representativePathologies: ["Acute Anterior STEMI (LAD Occlusion)", "HFrEF / HFpEF", "Aortic Stenosis", "Atrial Fibrillation", "Septic Cardiomyopathy"],
      diagnosticBiomarkersAndImaging: "hs-Troponin I/T, NT-proBNP, 12-Lead ECG ST-Vector, Transthoracic Echo GLS, Coronary CT Angiography",
      surgicalAndProceduralSimulationLink: "CABG (LIMA-to-LAD Anastomosis Poiseuille Flow Simulator) & PCI Stent Deployment",
      clinicalApplicationUtility: "Localizes ischemicAHA-17 territories, predicts hemodynamic shock trajectories, and trains bypass graft patency verification."
    },
    canvasHotspotNormalizedBox: { centerX0to1: 0.51, centerY0to1: 0.31, radius0to1: 0.055 }
  },
  {
    systemId: "RESPIRATORY_PULMONARY",
    displayName: "Respiratory / Pulmonary",
    fmaId: "FMA:7195",
    uberonId: "UBERON:0002048",
    cellOntologyId: "CL:0002062 (Type I Pneumocyte) · CL:0002063 (Type II Pneumocyte)",
    rcsbPdbId: "PDB:1PW9 (Surfactant Protein B/C) · PDB:1A01 (Deoxy/Oxy-Hemoglobin)",
    reactomePathwayId: "R-HSA-1247673 (Erythrocyte O2/CO2 Gas Exchange)",
    grossAnatomyAndNeurovascular: {
      regionalSubdivisions: ["Trachea & Carina", "Right (3 Lobes, 10 Segments) & Left (2 Lobes, 8-10 Segments) Lungs", "Alveolar-Capillary Membrane"],
      arterialSupply: "Pulmonary Arteries (Gas Exchange) & Bronchial Arteries from Thoracic Aorta (Parenchymal Nutrition)",
      venousDrainage: "4 Pulmonary Veins -> Left Atrium ; Bronchial Veins -> Azygos/Hemiazygos System",
      innervation: "Pulmonary Plexus: Vagal Bronchoconstrictor (M3) & Sympathetic Bronchodilator (beta-2) + Phrenic Nerve (C3-C5) to Diaphragm",
      lymphaticDrainage: "Superficial Subpleural & Deep Bronchovascular Plexus -> Hilar -> Tracheobronchial -> Paratracheal Nodes"
    },
    nineLevelScaleChain: {
      level1WholeHuman: "Homo sapiens (FMA:20394)",
      level2OrganSystem: "Respiratory System (UBERON:0001004)",
      level3GrossOrgan: "Bilateral Lungs (FMA:7195)",
      level4Substructure: "Respiratory Bronchiole & Alveolar Acinus (FMA:14072)",
      level5TissueHistology: "0.5-Micron Blood-Air Barrier (Type I Epithelium + Fused Basement Membrane + Capillary Endothelium)",
      level6FunctionalCell: "Type II Alveolar Pneumocyte (CL:0002063)",
      level7Organelle: "Osmiophilic Lamellar Bodies (Dipalmitoylphosphatidylcholine Surfactant Exocytosis)",
      level8ProteinPathway: "Laplace Surface Tension Reduction (P = 2T/r) & Carbonic Anhydrase II Bohr/Haldane Shift",
      level9GenomicLocus: "SFTPB (2p11.2), SFTPC (8p21.3), CFTR (7q31.2)"
    },
    physiologicalMechanics: {
      governingEquation: "PAO2 = FiO2*(Patm - PH2O) - PaCO2/R ; V_dot_A = (VT - VD)*f ; J_O2 = (D*A/d)*(PAO2 - PcO2)",
      homeostaticReferenceRange: "PaO2 80-100 mmHg · PaCO2 35-45 mmHg · SpO2 96-100% · P/F Ratio > 400 · V/Q ~ 0.8",
      regulatoryFeedbackLoop: "Central Medullary Chemoreceptors ([H+]/PCO2) & Carotid Body Glomus Cells (PaO2 < 60 mmHg)",
      crossSystemCouplingTargets: ["CARDIOVASCULAR_CIRCULATORY", "RENAL_URINARY", "HEMATOLOGICAL_MARROW"]
    },
    pathophysiologyAndClinicalUtility: {
      representativePathologies: ["Moderate-to-Severe ARDS", "COPD / Asthma Bronchospasm", "Pulmonary Embolism (High V/Q Dead Space)", "Tension Pneumothorax"],
      diagnosticBiomarkersAndImaging: "Arterial Blood Gas (ABG), A-a Gradient, High-Resolution Chest CT (HRCT), Spirometry FEV1/FVC",
      surgicalAndProceduralSimulationLink: "Lung-Protective Mechanical Ventilation (6 mL/kg PBW), Video-Assisted Bronchoscopy & Tube Thoracostomy",
      clinicalApplicationUtility: "Quantifies shunt vs dead-space hypoxemia, titrates PEEP/FiO2 in ICU ARDS, and couples respiratory acid-base with renal compensation."
    },
    canvasHotspotNormalizedBox: { centerX0to1: 0.47, centerY0to1: 0.29, radius0to1: 0.075 }
  },
  {
    systemId: "RENAL_URINARY",
    displayName: "Renal / Urinary",
    fmaId: "FMA:7203",
    uberonId: "UBERON:0002113",
    cellOntologyId: "CL:0000653 (Glomerular Visceral Podocyte) · CL:1000692 (Macula Densa)",
    rcsbPdbId: "PDB:4K5Y (NKCC2 Cotransporter) · PDB:4NEF (Aquaporin-2)",
    reactomePathwayId: "R-HSA-2855086 (Nephron Solute & Countercurrent Transport)",
    grossAnatomyAndNeurovascular: {
      regionalSubdivisions: ["Renal Cortex", "Outer & Inner Medulla (Renal Pyramids)", "1.2 Million Nephrons per Kidney", "Pelvis, Ureters & Trigone"],
      arterialSupply: "Renal Artery -> Segmental -> Interlobar -> Arcuate -> Interlobular -> Afferent Arteriole -> Glomerular Tuft -> Efferent Arteriole",
      venousDrainage: "Peritubular Capillaries & Vasa Recta -> Interlobular -> Arcuate -> Interlobar -> Renal Vein -> IVC",
      innervation: "Renal Sympathetic Plexus (T10-L1): Beta-1 JG Renin Release & Alpha-1 Afferent Vasoconstriction",
      lymphaticDrainage: "Cortical & Perirenal Lymphatics -> Lateral Aortic (Para-aortic) Lumbar Lymph Nodes"
    },
    nineLevelScaleChain: {
      level1WholeHuman: "Homo sapiens (FMA:20394)",
      level2OrganSystem: "Renal & Urinary System (UBERON:0001008)",
      level3GrossOrgan: "Kidney (UBERON:0002113 / FMA:7203)",
      level4Substructure: "Juxtamedullary Nephron, Glomerulus & Loop of Henle (UBERON:0001285)",
      level5TissueHistology: "Tri-Layer Glomerular Filtration Barrier (Fenestrated Endothelium + GBM Type IV Collagen + Podocyte Foot Processes)",
      level6FunctionalCell: "Glomerular Podocyte (CL:0000653) & Thick Ascending Limb Epithelial Cell",
      level7Organelle: "Slit Diaphragm (Nephrin/Podocin Complex) & Apical AQP2 Storage Vesicles",
      level8ProteinPathway: "NKCC2 Countercurrent Multiplication & Macula Densa Adenosine/ATP Tubuloglomerular Feedback",
      level9GenomicLocus: "NPHS1 (19q13.12), SLC12A1 (15q21.1), AQP2 (12q13.12)"
    },
    physiologicalMechanics: {
      governingEquation: "GFR = Kf * [(P_GC - P_BS) - pi_GC] ; FE_Na = (U_Na * P_Cr) / (P_Na * U_Cr) * 100",
      homeostaticReferenceRange: "GFR 90-125 mL/min/1.73m2 · RBF ~1.1 L/min · Urine Osmolality 50-1200 mOsm/kg · FE_Na < 1%",
      regulatoryFeedbackLoop: "Myogenic Stretch Reflex (80-170 mmHg) + Macula Densa TGF + Juxtaglomerular RAAS + Hypothalamic ADH",
      crossSystemCouplingTargets: ["CARDIOVASCULAR_CIRCULATORY", "ENDOCRINE_METABOLIC", "RESPIRATORY_PULMONARY"]
    },
    pathophysiologyAndClinicalUtility: {
      representativePathologies: ["Prerenal AKI vs Intrinsic ATN", "Cardiorenal Syndrome", "Diabetic Hyperfiltration", "Nephrotic Syndrome"],
      diagnosticBiomarkersAndImaging: "Serum Creatinine, Cystatin C, eGFR (CKD-EPI), FE_Na, Urine Sediment Casts, Renal Doppler Resistive Index",
      surgicalAndProceduralSimulationLink: "Ureterorenoscopy (URS), Percutaneous Nephrolithotomy (PCNL) & Living-Donor Renal Allograft Anastomosis",
      clinicalApplicationUtility: "Differentiates prerenal hypoperfusion from tubular necrosis and prevents nephrotoxic drug accumulation in sepsis."
    },
    canvasHotspotNormalizedBox: { centerX0to1: 0.48, centerY0to1: 0.41, radius0to1: 0.05 }
  },
  {
    systemId: "NERVOUS_NEUROLOGICAL",
    displayName: "Nervous / Neurological",
    fmaId: "FMA:50801",
    uberonId: "UBERON:0000955",
    cellOntologyId: "CL:0000540 (Cortical Pyramidal Neuron) · CL:0000128 (Oligodendrocyte)",
    rcsbPdbId: "PDB:7EL1 (Nav1.6 Voltage-Gated Sodium Channel) · PDB:6X3Z (GABA-A Receptor)",
    reactomePathwayId: "R-HSA-112316 (Neuronal System & Saltatory Conduction)",
    grossAnatomyAndNeurovascular: {
      regionalSubdivisions: ["Cerebral Cortex (Brodmann Areas)", "Internal Capsule & Basal Ganglia", "Brainstem (Midbrain/Pons/Medulla)", "Spinal Cord Tracts"],
      arterialSupply: "Circle of Willis (FMA:50452): Internal Carotid (ACA, MCA) & Vertebrobasilar (PCA, Cerebellar) Systems",
      venousDrainage: "Superficial & Deep Cerebral Veins -> Dural Venous Sinuses -> Internal Jugular Vein",
      innervation: "12 Paired Cranial Nerves (CN I-XII) & 31 Spinal Nerve Segments + Autonomic Sympathetic/Parasympathetic Chains",
      lymphaticDrainage: "Astroglial Aquaporin-4 Glymphatic Pathway & Dural Meningeal Lymphatic Vessels -> Deep Cervical Nodes"
    },
    nineLevelScaleChain: {
      level1WholeHuman: "Homo sapiens (FMA:20394)",
      level2OrganSystem: "Nervous System (UBERON:0001016)",
      level3GrossOrgan: "Brain & Spinal Cord (FMA:50801 / FMA:7647)",
      level4Substructure: "Posterior Limb of Internal Capsule & Corticospinal Tract Decussation",
      level5TissueHistology: "Myelinated Axonal White Matter Tracts with Nodes of Ranvier & Blood-Brain Barrier Tight Junctions",
      level6FunctionalCell: "Layer V Betz Pyramidal Motor Neuron (CL:0000540)",
      level7Organelle: "Node of Ranvier High-Density Nav1.6 Cluster & Presynaptic Active Zone Vesicles",
      level8ProteinPathway: "Hodgkin-Huxley Action Potential Propagation & Glutamatergic AMPA/NMDA Synaptic Plasticity",
      level9GenomicLocus: "SCN1A (2q24.3), MBP (18q23), BDNF (11p14.1)"
    },
    physiologicalMechanics: {
      governingEquation: "C_m*(dV/dt) = -I_Na - I_K - I_L ; CPP = MAP - ICP ; v_saltatory = 58.0 * myelinIntegrity",
      homeostaticReferenceRange: "Resting V_m -70 mV · Conduction Velocity 50-65 m/s · ICP 7-15 mmHg · CPP 60-80 mmHg",
      regulatoryFeedbackLoop: "Cerebral Autoregulation (CPP 50-150 mmHg) + CO2 Vasomotor Reactivity + Autonomic Baroreflex",
      crossSystemCouplingTargets: ["MUSCULOSKELETAL_ARTICULAR", "CARDIOVASCULAR_CIRCULATORY", "ENDOCRINE_METABOLIC"]
    },
    pathophysiologyAndClinicalUtility: {
      representativePathologies: ["Acute MCA Ischemic Stroke", "Multiple Sclerosis Demyelination", "Raised ICP / Herniation", "Status Epilepticus"],
      diagnosticBiomarkersAndImaging: "Diffusion-Weighted MRI (DWI/ADC), CT Perfusion, EEG Waveform, Lumbar Puncture CSF Oligoclonal Bands",
      surgicalAndProceduralSimulationLink: "Decompressive Craniectomy, Ventriculoperitoneal (VP) Shunt & Mechanical Thrombectomy",
      clinicalApplicationUtility: "Maps contralateral vs ipsilateral motor/sensory deficits by lesion level and simulates demyelinating conduction delay."
    },
    canvasHotspotNormalizedBox: { centerX0to1: 0.50, centerY0to1: 0.11, radius0to1: 0.055 }
  },
  {
    systemId: "GASTROINTESTINAL_HEPATOBILIARY",
    displayName: "Gastrointestinal / Hepatobiliary",
    fmaId: "FMA:7197",
    uberonId: "UBERON:0002107",
    cellOntologyId: "CL:0000182 (Hepatocyte) · CL:0000169 (Pancreatic Beta Cell)",
    rcsbPdbId: "PDB:4Z77 (GLUT2 Transporter) · PDB:3I40 (Human Insulin Hexamer)",
    reactomePathwayId: "R-HSA-1430728 (Hepatic Metabolic Homeostasis & CYP450 Biotransformation)",
    grossAnatomyAndNeurovascular: {
      regionalSubdivisions: ["Couinaud Hepatic Segments I-VIII", "Calot Hepatocystic Triangle", "Pancreatic Head/Body/Tail", "Esophagogastric-Intestinal Tract"],
      arterialSupply: "Celiac Trunk (Hepatic, Splenic, Left Gastric) & Superior/Inferior Mesenteric Arteries (SMA/IMA)",
      venousDrainage: "Portal Vein (75% Hepatic Inflow from Splenic + SMV) -> Hepatic Sinusoids -> Central Veins -> 3 Hepatic Veins -> IVC",
      innervation: "Enteric Nervous System (Auerbach Myenteric & Meissner Submucosal Plexuses) + Vagus Nerve (CN X) & Splanchnic Nerves",
      lymphaticDrainage: "Space of Disse -> Hepatic Hilar & Celiac Nodes ; Intestinal Lacteals -> Cisterna Chyli -> Thoracic Duct"
    },
    nineLevelScaleChain: {
      level1WholeHuman: "Homo sapiens (FMA:20394)",
      level2OrganSystem: "Digestive & Hepatobiliary System (UBERON:0001007)",
      level3GrossOrgan: "Liver, Gallbladder & Pancreas (FMA:7197 / FMA:7202)",
      level4Substructure: "Hepatic Lobule Portal Triad & Calot Triangle (Cystic Duct FMA:14668 + Cystic Artery FMA:14779)",
      level5TissueHistology: "Fenestrated Hepatic Sinusoidal Endothelium, Space of Disse, Canaliculi & Islets of Langerhans",
      level6FunctionalCell: "Periportal/Pericentral Hepatocyte (CL:0000182)",
      level7Organelle: "Smooth Endoplasmic Reticulum (CYP450) & Glycogen Rosette Granules",
      level8ProteinPathway: "Bergman Glucose-Insulin-Glucagon Kinetics, Glycogen Synthase & Bile Salt Export Pump (BSEP)",
      level9GenomicLocus: "GCK (7p13), CYP3A4 (7q22.1), ABCB11 (2q31.1)"
    },
    physiologicalMechanics: {
      governingEquation: "dG/dt = -p1*(G - G_b) - X*G + D(t) ; Strasberg_CVS = ClearedTriangle + Lower3rdMobilized + TwoStructuresOnly",
      homeostaticReferenceRange: "Fasting Glucose 70-99 mg/dL · Portal Flow 1.0-1.2 L/min · Total Bilirubin 0.2-1.2 mg/dL · ALT/AST < 40 U/L",
      regulatoryFeedbackLoop: "Postprandial GLP-1/GIP Incretin Surge + Pancreatic Beta/Alpha Cell Reciprocal Insulin/Glucagon Secretion + CCK",
      crossSystemCouplingTargets: ["ENDOCRINE_METABOLIC", "CARDIOVASCULAR_CIRCULATORY", "LYMPHATIC_IMMUNE"]
    },
    pathophysiologyAndClinicalUtility: {
      representativePathologies: ["Acute Calculous Cholecystitis", "Portal Hypertension & Cirrhosis", "Acute Pancreatitis", "MASLD / Steatohepatitis"],
      diagnosticBiomarkersAndImaging: "ALT, AST, ALP, GGT, Direct/Indirect Bilirubin, Lipase, Right Upper Quadrant Ultrasound, MRCP",
      surgicalAndProceduralSimulationLink: "Laparoscopic Cholecystectomy with Strasberg Critical View of Safety (Common Bile Duct FMA:9706 Protection)",
      clinicalApplicationUtility: "Couples AI Food Photo macronutrients to postprandial portal insulin dynamics and enforces biliary surgical safety."
    },
    canvasHotspotNormalizedBox: { centerX0to1: 0.46, centerY0to1: 0.37, radius0to1: 0.055 }
  },
  {
    systemId: "MUSCULOSKELETAL_ARTICULAR",
    displayName: "Musculoskeletal / Articular",
    fmaId: "FMA:7161",
    uberonId: "UBERON:0002204",
    cellOntologyId: "CL:0000188 (Skeletal Myofiber) · CL:0000062 (Osteoblast) · CL:0000138 (Chondrocyte)",
    rcsbPdbId: "PDB:5H53 (Actomyosin Cross-Bridge Complex) · PDB:1CAG (Collagen Triple Helix)",
    reactomePathwayId: "R-HSA-390522 (Striated Muscle Contraction & Hill Force-Velocity)",
    grossAnatomyAndNeurovascular: {
      regionalSubdivisions: ["Axial Skeleton (Cranium, Vertebral Column, Ribcage)", "Appendicular Skeleton & 36 Synovial Joint Bridges", "Plantar Fascia & MTP Joint"],
      arterialSupply: "Subclavian-Axillary-Brachial & Iliofemoral-Popliteal-Tibial Periosteal and Muscular Perforating Branches",
      venousDrainage: "Deep Accompanying Venae Comitantes & Superficial Saphenous/Cephalic/Basilic Systems",
      innervation: "Somatic Alpha-Motor Neurons via Brachial (C5-T1) & Lumbosacral (L1-S4) Plexuses + Golgi Tendon & Muscle Spindles",
      lymphaticDrainage: "Deep Musculofascial Lymphatics -> Popliteal, Inguinal, Epitrochlear & Axillary Nodes"
    },
    nineLevelScaleChain: {
      level1WholeHuman: "Homo sapiens (FMA:20394)",
      level2OrganSystem: "Musculoskeletal System (UBERON:0002204)",
      level3GrossOrgan: "Femoro-Tibial Knee & Metatarsophalangeal Articular Chain (FMA:9611)",
      level4Substructure: "ACL/PCL Cruciate Complex, Menisci & Achilles-Plantar Windlass Mechanism",
      level5TissueHistology: "Hyaline Articular Cartilage (Type II Collagen/Aggrecan) & Type I/IIa/IIx Pennate Skeletal Muscle",
      level6FunctionalCell: "Multinucleated Skeletal Myofiber (CL:0000188)",
      level7Organelle: "Sarcomere Z-Disc to Z-Disc Array (Actin, Myosin II, Titin Spring) & Terminal Cisternae",
      level8ProteinPathway: "Hill Force-Velocity Contraction & Mechanotransduction (Wnt/Sclerostin Wolff Law Remodeling)",
      level9GenomicLocus: "ACTN3 (11q13.2), COL1A1 (17q21.33), DMD (Xp21.2)"
    },
    physiologicalMechanics: {
      governingEquation: "(F + a)*(v + b) = (F_0 + a)*b ; tau_joint = r x F_muscle ; ACWR = Load_7d / Load_28d",
      homeostaticReferenceRange: "ACWR 0.80-1.30 · Gait Symmetry >= 96% · MTP Dorsiflexion 35-45 deg · BMD T-Score >= -1.0",
      regulatoryFeedbackLoop: "Ia Muscle Spindle Stretch Reflex + Ib Golgi Tendon Tension Protection + Osteocyte Piezo1 Load Remodeling",
      crossSystemCouplingTargets: ["NERVOUS_NEUROLOGICAL", "CARDIOVASCULAR_CIRCULATORY", "ENDOCRINE_METABOLIC"]
    },
    pathophysiologyAndClinicalUtility: {
      representativePathologies: ["Non-Contact ACL Rupture (Valgus Torque + ACWR Spike > 1.5)", "Achilles Tendinopathy", "Osteoarthritis", "Sarcopenia"],
      diagnosticBiomarkersAndImaging: "3D Markerless Gait Kinematics (FreeMoCap), DEXA Bone Density, Knee MRI, Serum Creatine Kinase (CK)",
      surgicalAndProceduralSimulationLink: "Arthroscopic ACL Reconstruction, Total Knee Arthroplasty Alignment & Fracture Fixation Biomechanics",
      clinicalApplicationUtility: "Protects athletes joining Reclub/ClassPass matches by coupling ACWR workload spikes to joint torque limits."
    },
    canvasHotspotNormalizedBox: { centerX0to1: 0.46, centerY0to1: 0.70, radius0to1: 0.065 }
  },
  {
    systemId: "ENDOCRINE_METABOLIC",
    displayName: "Endocrine / Metabolic",
    fmaId: "FMA:9668",
    uberonId: "UBERON:0000949",
    cellOntologyId: "CL:0000439 (Pituitary Somatotroph/Corticotroph) · CL:0002258 (Thyroid Follicular Cell)",
    rcsbPdbId: "PDB:1IR3 (Insulin Receptor Tyrosine Kinase) · PDB:3GWS (Thyroid Hormone Receptor Beta)",
    reactomePathwayId: "R-HSA-74752 (Insulin Receptor Signaling & AMPK/mTOR Longevity Switch)",
    grossAnatomyAndNeurovascular: {
      regionalSubdivisions: ["Hypothalamus & Pituitary (Sella Turcica)", "Thyroid & 4 Parathyroid Glands", "Bilateral Adrenal Cortex/Medulla", "Pancreatic Islets"],
      arterialSupply: "Superior/Inferior Hypophyseal Portal System, Superior/Inferior Thyroid Arteries, Superior/Middle/Inferior Suprarenal Arteries",
      venousDrainage: "Cavernous Sinus, Thyroid Venous Plexus, Left Adrenal Vein -> Left Renal Vein / Right Adrenal Vein -> IVC",
      innervation: "Hypothalamic Magnocellular Tracts + Preganglionic Sympathetic Splanchnic Fibers (T5-T12) to Adrenal Chromaffin Cells",
      lymphaticDrainage: "Deep Cervical, Pretracheal, Paratracheal & Para-aortic Lymph Nodes"
    },
    nineLevelScaleChain: {
      level1WholeHuman: "Homo sapiens (FMA:20394)",
      level2OrganSystem: "Endocrine System (UBERON:0000949)",
      level3GrossOrgan: "Hypothalamic-Pituitary-Thyroid-Adrenal-Islet Axis (FMA:9668)",
      level4Substructure: "Adenohypophysis, Zona Fasciculata & Langerhans Beta-Cell Core",
      level5TissueHistology: "Fenestrated Sinusoidal Endocrine Capillary Network & Colloid-Filled Thyroid Follicles",
      level6FunctionalCell: "Endocrine Secretory Cell (CL:0000163)",
      level7Organelle: "Dense-Core Neuroendocrine Secretory Granules & Mitochondrial CYP11B1 Steroidogenesis",
      level8ProteinPathway: "IRS-1/PI3K/Akt GLUT4 Translocation & AMPK/SIRT1/PGC-1alpha Mitochondrial Biogenesis",
      level9GenomicLocus: "INSR (19p13.2), TSHR (14q31.1), NR3C1 (5q31.3)"
    },
    physiologicalMechanics: {
      governingEquation: "HOMA_IR = (Glucose_mgDl * Insulin_uIUml) / 405 ; d[Cortisol]/dt = k_ACTH*[ACTH] - k_deg*[Cortisol]",
      homeostaticReferenceRange: "HOMA-IR < 1.5 · HbA1c 4.5-5.6% · TSH 0.5-4.5 mIU/L · Morning Cortisol 8-20 ug/dL",
      regulatoryFeedbackLoop: "Negative Long/Short-Loop Feedback across HPA, HPT, HPG Axes & SCN Circadian Master Clock",
      crossSystemCouplingTargets: ["GASTROINTESTINAL_HEPATOBILIARY", "CARDIOVASCULAR_CIRCULATORY", "MUSCULOSKELETAL_ARTICULAR"]
    },
    pathophysiologyAndClinicalUtility: {
      representativePathologies: ["Type 2 Diabetes & Insulin Resistance", "Diabetic Ketoacidosis (DKA)", "Graves Thyrotoxicosis", "Adrenal Insufficiency"],
      diagnosticBiomarkersAndImaging: "Fasting Insulin, HOMA-IR, HbA1c, Continuous Glucose Monitor (CGM Time-in-Range), TSH, Free T4, Cortisol",
      surgicalAndProceduralSimulationLink: "Total Thyroidectomy with Recurrent Laryngeal Nerve (FMA:6248) & Parathyroid Preservation",
      clinicalApplicationUtility: "Drives PhenoAge epigenetic longevity projections and circadian sauna/cold-plunge autonomic protocols."
    },
    canvasHotspotNormalizedBox: { centerX0to1: 0.50, centerY0to1: 0.19, radius0to1: 0.045 }
  },
  {
    systemId: "LYMPHATIC_IMMUNE",
    displayName: "Lymphatic / Immune",
    fmaId: "FMA:74594",
    uberonId: "UBERON:0002405",
    cellOntologyId: "CL:0000084 (T-Lymphocyte) · CL:0000236 (B-Lymphocyte) · CL:0000235 (Macrophage)",
    rcsbPdbId: "PDB:1IGT (Immunoglobulin G Antibody) · PDB:3FXI (TLR4-MD2-LPS Complex)",
    reactomePathwayId: "R-HSA-168256 (Innate & Adaptive Immune System Signaling)",
    grossAnatomyAndNeurovascular: {
      regionalSubdivisions: ["Thoracic Duct & Cisterna Chyli", "Right Lymphatic Duct", "Thymus & Spleen White/Red Pulp", "600+ Regional Lymph Nodes"],
      arterialSupply: "Splenic Artery (Celiac Trunk), Internal Thoracic Thymic Branches & Nodal Hilar Arterioles",
      venousDrainage: "Thoracic Duct -> Left Subclavian-Internal Jugular Venous Angle (Pirogoff Angle)",
      innervation: "Cholinergic Anti-Inflammatory Pathway (Vagus Nerve -> Splenic Nerve -> Alpha-7 nAChR on Macrophages)",
      lymphaticDrainage: "Blind-Ended Initial Lymphatic Capillaries -> Collecting Vessels with Unidirectional Valves -> Venous Angles"
    },
    nineLevelScaleChain: {
      level1WholeHuman: "Homo sapiens (FMA:20394)",
      level2OrganSystem: "Lymphatic & Immune System (UBERON:0002405)",
      level3GrossOrgan: "Spleen, Thymus & Thoracic Duct Network (FMA:7196)",
      level4Substructure: "Lymph Node Germinal Center & Paracortical High Endothelial Venules (HEV)",
      level5TissueHistology: "Reticular Fiber Meshwork (Type III Collagen) Populated by Follicular Dendritic Cells & Lymphocytes",
      level6FunctionalCell: "CD8+ Cytotoxic T-Cell & Germinal Center B-Cell (CL:0000084)",
      level7Organelle: "Immunological Synapse & MHC Class I/II Antigen-Loading Endosomal Compartments",
      level8ProteinPathway: "TCR-MHC Recognition, NF-kappaB / JAK-STAT Cytokine Cascade & De Novo BindCraft2 Epitope Neutralization",
      level9GenomicLocus: "HLA-A/B/C & HLA-DRB1 (6p21.3), TLR4 (9q33.1)"
    },
    physiologicalMechanics: {
      governingEquation: "J_lymph = Kf_lymph * (P_if - P_lymph) ; SII = (Platelets * Neutrophils) / Lymphocytes",
      homeostaticReferenceRange: "Lymph Return 2.0-4.0 L/day · SII 250-550 · hs-CRP < 1.0 mg/L · WBC 4.5-11.0 x10^3/uL",
      regulatoryFeedbackLoop: "Interstitial Hydrostatic Pressure Valve Opening + Vagal Cholinergic Cytokine Attenuation + Treg Suppression",
      crossSystemCouplingTargets: ["CARDIOVASCULAR_CIRCULATORY", "HEMATOLOGICAL_MARROW", "INTEGUMENTARY_SENSORY_ENT"]
    },
    pathophysiologyAndClinicalUtility: {
      representativePathologies: ["Sepsis Cytokine Storm", "Systemic Lupus Erythematosus (Type I IFN)", "Secondary Lymphedema", "Anaphylaxis"],
      diagnosticBiomarkersAndImaging: "Procalcitonin, hs-CRP, IL-6, Complete Blood Count with Differential (NLR/SII), Flow Cytometry, PET-CT",
      surgicalAndProceduralSimulationLink: "Sentinel Lymph Node Biopsy (SLNB) & Lymphovenous Anastomosis (LVA) Microsurgery",
      clinicalApplicationUtility: "Powers Sepsis 2026 early warning, Pantheon infectious disease consensus, and ProteinFighter binder design."
    },
    canvasHotspotNormalizedBox: { centerX0to1: 0.54, centerY0to1: 0.36, radius0to1: 0.05 }
  },
  {
    systemId: "HEMATOLOGICAL_MARROW",
    displayName: "Hematological / Marrow",
    fmaId: "FMA:9608",
    uberonId: "UBERON:0002390",
    cellOntologyId: "CL:0000232 (Erythrocyte) · CL:0000037 (Hematopoietic Stem Cell) · CL:0000233 (Platelet)",
    rcsbPdbId: "PDB:1A01 (Hemoglobin Tetramer alpha2-beta2) · PDB:1F0R (Thrombin Factor IIa)",
    reactomePathwayId: "R-HSA-140877 (Formation of Fibrin Clot & Oxygen Transport)",
    grossAnatomyAndNeurovascular: {
      regionalSubdivisions: ["Axial Red Bone Marrow (Pelvis/Iliac Crest, Sternum, Vertebrae)", "5.0L Circulating Blood Volume", "Microvascular Capillary Beds"],
      arterialSupply: "Nutrient Arteries -> Medullary Sinusoids of Axial Skeleton",
      venousDrainage: "Central Venous Sinusoids -> Emissary Veins -> Systemic Venous Circulation",
      innervation: "Sympathetic Noradrenergic Fibers Regulating CXCL12 Niche Hematopoietic Stem Cell Mobilization",
      lymphaticDrainage: "Coupled via Splenic Red Pulp Cords of Billroth & Reticuloendothelial Macrophage Clearance"
    },
    nineLevelScaleChain: {
      level1WholeHuman: "Homo sapiens (FMA:20394)",
      level2OrganSystem: "Hematological System (UBERON:0002390)",
      level3GrossOrgan: "Pelvic & Sternal Red Bone Marrow Niche (FMA:9608)",
      level4Substructure: "Perivascular Endosteal Stem Cell Niche & Microvascular Krogh Cylinder",
      level5TissueHistology: "Hematopoietic Cords, Megakaryocyte Proplatelet Projections & Biconcave Erythrocyte Stream",
      level6FunctionalCell: "Erythrocyte (CL:0000232) & Activated Platelet (CL:0000233)",
      level7Organelle: "Spectrin-Ankyrin Membrane Cytoskeleton & Platelet Alpha/Dense Granules",
      level8ProteinPathway: "Hill Cooperative O2 Binding (P50 = 26.6 mmHg, 2,3-BPG) & Intrinsic/Extrinsic Coagulation Cascade",
      level9GenomicLocus: "HBB (11p15.4), F2 (11p11.2), EPO (7q22.1)"
    },
    physiologicalMechanics: {
      governingEquation: "CaO2 = (alpha_Hb * Hb * SaO2) + (alpha_dissolved * PaO2) ; DO2 = CO * CaO2 * 10",
      homeostaticReferenceRange: "Hb 13.5-17.5 g/dL · CaO2 18-20 mL O2/dL · DO2 900-1100 mL/min · Platelets 150-400 x10^3/uL",
      regulatoryFeedbackLoop: "Renal Peritubular HIF-2alpha Oxygen Sensing -> Erythropoietin (EPO) -> Marrow Erythropoiesis",
      crossSystemCouplingTargets: ["RESPIRATORY_PULMONARY", "CARDIOVASCULAR_CIRCULATORY", "RENAL_URINARY"]
    },
    pathophysiologyAndClinicalUtility: {
      representativePathologies: ["Acute Hemorrhagic Shock", "Disseminated Intravascular Coagulation (DIC)", "Iron-Deficiency Anemia", "Deep Vein Thrombosis"],
      diagnosticBiomarkersAndImaging: "Hemoglobin, Hematocrit, Reticulocyte Production Index, Ferritin, PT/INR, aPTT, D-Dimer, Thromboelastography (TEG)",
      surgicalAndProceduralSimulationLink: "Posterior Iliac Crest Bone Marrow Aspiration & Massive Transfusion Protocol (1:1:1 PRBC:FFP:Platelets)",
      clinicalApplicationUtility: "Calculates systemic oxygen delivery (DO2) and Krogh radial tissue hypoxia during acute blood loss or sepsis."
    },
    canvasHotspotNormalizedBox: { centerX0to1: 0.44, centerY0to1: 0.49, radius0to1: 0.055 }
  },
  {
    systemId: "REPRODUCTIVE_OBSTETRIC",
    displayName: "Reproductive / Obstetric",
    fmaId: "FMA:7160",
    uberonId: "UBERON:0000990",
    cellOntologyId: "CL:0000417 (Oocyte / Granulosa) · CL:0000216 (Leydig / Sertoli Cell) · CL:0002371 (Trophoblast)",
    rcsbPdbId: "PDB:1A52 (Estrogen Receptor Alpha) · PDB:1E3G (Androgen Receptor) · PDB:1X76 (FSH-FSHR Complex)",
    reactomePathwayId: "R-HSA-2980736 (Peptide Hormone & Gonadal Steroidogenesis)",
    grossAnatomyAndNeurovascular: {
      regionalSubdivisions: ["Pelvic Viscera", "Uterus, Fallopian Tubes & Ovaries / Prostate & Testes", "Fetoplacental Circulation (When Gravid)"],
      arterialSupply: "Uterine Artery (Internal Iliac) & Gonadal (Ovarian/Testicular) Arteries directly from Abdominal Aorta (L2)",
      venousDrainage: "Pampiniform Plexus -> Right Gonadal Vein (to IVC) & Left Gonadal Vein (to Left Renal Vein at 90 deg)",
      innervation: "Inferior Hypogastric Plexus, Pelvic Splanchnic Nerves (S2-S4 Parasympathetic) & Pudendal Nerve",
      lymphaticDrainage: "Gonads -> Para-aortic Lumbar Nodes ; Pelvic Viscera -> Internal/External Iliac & Inguinal Nodes"
    },
    nineLevelScaleChain: {
      level1WholeHuman: "Homo sapiens (FMA:20394)",
      level2OrganSystem: "Reproductive System (UBERON:0000990)",
      level3GrossOrgan: "Pelvic Reproductive Viscera & Uteroplacental Vascular Bed (FMA:17558)",
      level4Substructure: "Spiral Uterine Arteries & Ovarian Follicular / Seminiferous Tubule Niche",
      level5TissueHistology: "Myometrial Smooth Muscle Syncytium, Endometrial Decidua & Chorionic Villi",
      level6FunctionalCell: "Syncytiotrophoblast / Granulosa / Leydig Cell (CL:0000417)",
      level7Organelle: "Mitochondrial StAR Cholesterol Transport & Gap Junction Connexin-43 Networks",
      level8ProteinPathway: "Kisspeptin-GnRH Pulsatile Frequency Decoding -> LH/FSH -> Aromatase CYP19A1 Steroidogenesis",
      level9GenomicLocus: "ESR1 (6q25.1), AR (Xq12), CYP19A1 (15q21.2)"
    },
    physiologicalMechanics: {
      governingEquation: "RI_doppler = (PSV - EDV) / PSV ; PI_doppler = (PSV - EDV) / V_mean",
      homeostaticReferenceRange: "Uterine Doppler RI 0.45-0.58 · Pulsatile GnRH 60-90 min Cycle · Free Testosterone / Estradiol Age-Matched",
      regulatoryFeedbackLoop: "Hypothalamic Kisspeptin/KNDy Neurons -> Anterior Pituitary Gonadotrophs -> Gonadal Sex Steroids & Inhibin B",
      crossSystemCouplingTargets: ["ENDOCRINE_METABOLIC", "CARDIOVASCULAR_CIRCULATORY", "RENAL_URINARY"]
    },
    pathophysiologyAndClinicalUtility: {
      representativePathologies: ["Preeclampsia Spiral Artery Remodeling Failure", "Polycystic Ovary Syndrome (PCOS)", "Postpartum Hemorrhage", "BPH"],
      diagnosticBiomarkersAndImaging: "LH, FSH, Estradiol, Total/Free Testosterone, SHBG, AMH, beta-hCG, Transvaginal/Pelvic Doppler Ultrasound",
      surgicalAndProceduralSimulationLink: "Low-Transverse Cesarean Section (Pfannenstiel-Kerr) & Laparoscopic Uterine Artery Identification (Ureter Guard)",
      clinicalApplicationUtility: "Models endocrine vitality across the lifespan and trains safe pelvic anatomical dissection near the ureter."
    },
    canvasHotspotNormalizedBox: { centerX0to1: 0.50, centerY0to1: 0.50, radius0to1: 0.055 }
  },
  {
    systemId: "INTEGUMENTARY_SENSORY_ENT",
    displayName: "Sensory / ENT & Integumentary",
    fmaId: "FMA:72979",
    uberonId: "UBERON:0002416",
    cellOntologyId: "CL:0000312 (Keratinocyte) · CL:0000601 (Cochlear Outer Hair Cell) · CL:0000604 (Retinal Rod/Cone)",
    rcsbPdbId: "PDB:1U19 (Rhodopsin GPCR) · PDB:7T9P (TMC1 Mechanoelectrical Transduction Channel)",
    reactomePathwayId: "R-HSA-9709957 (Sensory Perception of Sound, Vision & Cutaneous Thermoregulation)",
    grossAnatomyAndNeurovascular: {
      regionalSubdivisions: ["Epidermis/Dermis/Hypodermis", "Anterior/Posterior Ocular Segments & Retina", "External/Middle/Inner Ear (Cochlea & Semicircular Canals)", "Sinonasal & Laryngeal Airway"],
      arterialSupply: "Ophthalmic Artery (Central Retinal), Labyrinthine Artery (AICA), Sphenopalatine/Maxillary & Cutaneous Subpapillary Plexuses",
      venousDrainage: "Superior/Inferior Ophthalmic Veins -> Cavernous Sinus, Pterygoid Plexus & Cutaneous Venous Plexus",
      innervation: "CN I (Olfactory), CN II (Optic), CN III/IV/VI (Oculomotor), CN V (Trigeminal), CN VII (Facial), CN VIII (Vestibulocochlear), CN IX/X",
      lymphaticDrainage: "Preauricular, Parotid, Submandibular, Jugulodigastric (Level II) & Superficial Cutaneous Watersheds"
    },
    nineLevelScaleChain: {
      level1WholeHuman: "Homo sapiens (FMA:20394)",
      level2OrganSystem: "Sensory, ENT & Integumentary System (UBERON:0002416)",
      level3GrossOrgan: "Eye, Cochleovestibular Labyrinth & Continuous Dermal Envelope (FMA:54448 / FMA:7163)",
      level4Substructure: "Organ of Corti Basilar Membrane, Fovea Centralis & Eccrine Sweat/Arteriovenous Anastomoses",
      level5TissueHistology: "10-Layer Neurosensory Retina, Stratified Squamous Keratinized Epidermis & Endolymphatic Scala Media",
      level6FunctionalCell: "Cochlear Hair Cell (CL:0000601) & Retinal Photoreceptor (CL:0000604)",
      level7Organelle: "Stereocilia Tip-Link Mechanotransducer & Photoreceptor Outer Segment Rhodopsin Discs",
      level8ProteinPathway: "11-cis-Retinal Photoisomerization (Transducin PDE6) & Prestin Electromotility Cochlear Amplifier",
      level9GenomicLocus: "RHO (3q22.1), GJB2 / Connexin-26 (13q12.11), FLG (1q21.3)"
    },
    physiologicalMechanics: {
      governingEquation: "PTA_dB = (dB_500 + dB_1000 + dB_2000 + dB_4000)/4 ; IOP = (F_in - F_uv)/C_trab + P_ev",
      homeostaticReferenceRange: "PTA <= 20 dB HL · Visual Acuity LogMAR 0.00 (20/20) · IOP 10-21 mmHg · Dermal TEWL 5-10 g/m2/h",
      regulatoryFeedbackLoop: "Pupillary Light Reflex (CN II -> Pretectal -> Edinger-Westphal CN III) + Acoustic Stapedius Reflex (CN VIII -> CN VII) + Hypothalamic Eccrine Sweating",
      crossSystemCouplingTargets: ["NERVOUS_NEUROLOGICAL", "LYMPHATIC_IMMUNE", "CARDIOVASCULAR_CIRCULATORY"]
    },
    pathophysiologyAndClinicalUtility: {
      representativePathologies: ["Sensorineural vs Conductive Hearing Loss", "Acute Angle-Closure Glaucoma", "Chronic Rhinosinusitis", "Thermal Burn Injury"],
      diagnosticBiomarkersAndImaging: "Pure-Tone Audiometry & Tympanometry, Optical Coherence Tomography (OCT), Tonometry, Nasal Endoscopy",
      surgicalAndProceduralSimulationLink: "Functional Endoscopic Sinus Surgery (FESS), Tympanoplasty/Cochlear Implant & Phacoemulsification",
      clinicalApplicationUtility: "Integrates Otorhinolaryngology (THT-KL) & Ophthalmology clinical clerkship examinations directly into the 3D cranial atlas."
    },
    canvasHotspotNormalizedBox: { centerX0to1: 0.50, centerY0to1: 0.14, radius0to1: 0.05 }
  }
];

export function getDeepSystemSpecById(systemId: CanonicalBodySystemId): DeepSystemAnatomicalPhysiologicalSpec {
  return DEEP_11_SYSTEM_MULTISCALE_ATLAS.find((s) => s.systemId === systemId) ?? DEEP_11_SYSTEM_MULTISCALE_ATLAS[0];
}

export function inspectOrganByNormalizedCanvasCoords(normX0to1: number, normY0to1: number): DeepSystemAnatomicalPhysiologicalSpec {
  let bestMatch = DEEP_11_SYSTEM_MULTISCALE_ATLAS[0];
  let bestDist = Infinity;
  for (const spec of DEEP_11_SYSTEM_MULTISCALE_ATLAS) {
    const dx = normX0to1 - spec.canvasHotspotNormalizedBox.centerX0to1;
    const dy = normY0to1 - spec.canvasHotspotNormalizedBox.centerY0to1;
    const dist = Math.hypot(dx, dy);
    if (dist < bestDist) {
      bestDist = dist;
      bestMatch = spec;
    }
  }
  return bestMatch;
}