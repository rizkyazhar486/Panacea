// Digestive, lymphatic-immune, and integumentary physiology for the Physiology stage. Every citation is verified
// in governance/LITERATURE_CITATION_LEDGER.json. Reference teaching physiology only: never a person's data.

import type { SourcedPhysiology } from './sourcedPhysiology.ts'

export const VISCERAL_PHYSIOLOGY: readonly SourcedPhysiology[] = [
  {
    id: 'gastric-parietal-acid-secretion',
    label: 'Gastric parietal cell acid secretion',
    systems: ['digestive'],
    summary: [
      'Stimulated gastric parietal cells fuse intracellular tubulovesicles with apical canaliculi, placing H⁺/K⁺-ATPase pumps at the lumen.',
      'Neurocrine acetylcholine, paracrine histamine from ECL cells, and endocrine gastrin converge to activate acid secretion.',
      'Apical H⁺/K⁺-ATPase exchanges cytosolic H⁺ for luminal K⁺ alongside Cl⁻ efflux to form hydrochloric acid.',
      'Luminal acidity stimulates D-cell somatostatin release, providing inhibitory feedback that brakes further acid secretion.',
    ],
    references: [
      { reference: 'PMID 21897223', note: 'Schubert (2011), Gastric secretion: neural, paracrine, and hormonal regulation of gastric acid output.' },
      { reference: 'PMID 31670611', note: 'Engevik, Kaji & Goldenring (2020), The Physiology of the Gastric Parietal Cell: H⁺/K⁺-ATPase trafficking and acid secretion.' },
    ],
    boundary: 'Reference teaching physiology of gastric parietal cells: not a measurement of any person’s gastric pH, reflux, or treatment guidance.',
  },
  {
    id: 'intestinal-epithelial-mucosal-barrier',
    label: 'Intestinal mucosal and immune barrier',
    systems: ['digestive', 'lymphatic-immune'],
    summary: [
      'Secreted mucus layers and antimicrobial peptides form an outer biochemical shield separating luminal microbes from epithelium.',
      'A single layer of enterocytes sealed by apical tight junctions regulates paracellular flux while permitting nutrient absorption.',
      'Epithelial turnover from crypt stem cells continuously renews the surface and repairs microscopic barrier breaches.',
      'Underlying lamina propria immune cells balance oral tolerance to nutrients and commensals against defense from invasive pathogens.',
    ],
    references: [
      { reference: 'PMID 40086468', note: 'Neurath, Artis & Becker (2025), The intestinal barrier: a pivotal role in health, inflammation, and cancer — epithelial junctions, mucus, and mucosal immunity.' },
    ],
    boundary: 'Reference teaching physiology of the intestinal barrier: not a measurement of any person’s gut permeability, microbiome, or clinical diagnosis.',
  },
  {
    id: 'hepatic-metabolic-biliary-homeostasis',
    label: 'Hepatic metabolic, synthetic, and biliary physiology',
    systems: ['digestive'],
    summary: [
      'Portal venous blood delivers absorbed gut nutrients directly to hepatic lobules for first-pass metabolic processing.',
      'Hepatocytes regulate blood glucose via glycogenesis and gluconeogenesis while coordinating lipid and amino-acid pathways.',
      'Parenchymal cells synthesize plasma proteins including albumin and coagulation factors and secrete bile salts into canaliculi.',
      'Phase I and Phase II biotransformation pathways convert endogenous waste and xenobiotics for biliary or renal clearance.',
    ],
    references: [
      { reference: 'PMID 30571059', note: 'Kalra et al. (2023), Physiology, Liver: hepatic nutrient metabolism, bile production, plasma protein synthesis, and detoxification.' },
    ],
    boundary: 'Reference teaching physiology of the liver: not a measurement of any person’s liver enzymes, synthetic capacity, or treatment guidance.',
  },
  {
    id: 'lymphatic-fluid-immune-homeostasis',
    label: 'Lymphatic fluid homeostasis and immune trafficking',
    systems: ['lymphatic-immune'],
    summary: [
      'Blind-ended initial lymphatic capillaries take up filtered interstitial fluid, macromolecules, and intestinal dietary lipids.',
      'Collecting lymphatic vessels propel lymph forward through intrinsic smooth-muscle pumping and one-way intraluminal valves.',
      'Lymph passes through lymph nodes where resident leukocytes inspect antigen-presenting cells and initiate adaptive immunity.',
      'Returning drained fluid to the central venous circulation prevents tissue edema and maintains intravascular volume balance.',
    ],
    references: [
      { reference: 'PMID 32707093', note: 'Oliver et al. (2020), The Lymphatic Vasculature in the 21(st) Century: Novel Functional Roles in Homeostasis and Disease.' },
      { reference: 'PMID 9419570', note: 'Witte & Witte (1995), Disorders of lymph flow: lymphatic fluid return and interstitial transport dynamics.' },
    ],
    boundary: 'Reference teaching physiology of lymphatic vessels: not a measurement of any person’s lymph flow, edema, or immune status.',
  },
  {
    id: 'epidermal-barrier-repair-homeostasis',
    label: 'Epidermal barrier, moisturization, and aging',
    systems: ['integumentary-surface'],
    summary: [
      'Keratinocytes differentiate outward into flattened corneocytes embedded within structured intercellular lipid lamellae.',
      'This stratum corneum lipid-corneocyte matrix limits transepidermal water loss and resists chemical or microbial entry.',
      'Natural moisturizing factors derived from filaggrin breakdown retain stratum corneum hydration and flexibility.',
      'Barrier disruption triggers epidermal lipid synthesis and renewal, while chronological aging slows barrier recovery.',
    ],
    references: [
      { reference: 'PMID 37717558', note: 'Rajkumar et al. (2023), The Skin Barrier and Moisturization: Function, Disruption, and Mechanisms of Repair.' },
      { reference: 'PMID 38140732', note: 'Fluhr et al. (2024), Epidermal barrier function in dry, flaky and sensitive skin: stratum corneum lipids and hydration.' },
      { reference: 'PMID 32217811', note: 'Wang et al. (2020), Aging-associated alterations in epidermal function and their clinical significance.' },
    ],
    boundary: 'Reference teaching physiology of the epidermal barrier: not a measurement of any person’s skin hydration, dermatologic diagnosis, or treatment guidance.',
  },
]
