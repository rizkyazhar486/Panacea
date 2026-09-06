// ─────────────────────────────────────────────────────────────────────────────
// BANK VARIAN KLINIS — dari DNA ke tindakan.
//
// Tiap entri menjawab satu pertanyaan yang sama: kalau varian ini ditemukan
// pada seseorang, APA YANG BERUBAH dalam penanganannya. Varian yang tidak
// mengubah apa pun tidak dimasukkan, betapa pun terkenalnya.
//
// Tautannya diperiksa oleh uji: id keadaan harus ada di atlas patologi, id obat
// harus ada di bank obat, dan nama penyakit harus ada persis seperti di daftar
// SKDI. Tautan mati tidak terlihat di layar — halamannya tetap rapi, isinya
// saja yang kosong.
//
// BATASNYA. Ini bank varian yang SUDAH MAPAN secara klinis, bukan mesin
// penilai patogenisitas: aplikasi ini tidak bisa memutuskan apakah varian baru
// yang belum pernah dilaporkan bersifat patogen. Itu memerlukan basis data
// populasi, bukti fungsional, dan penilaian kurator — kerangka ACMG/AMP, bukan
// tabel di dalam satu aplikasi.
// ─────────────────────────────────────────────────────────────────────────────

export type PolaWaris =
  | 'autosomal dominant' | 'autosomal recessive' | 'X-linked' | 'somatic' | 'mitochondrial' | 'multifactorial'

export type BidangVarian =
  | 'haematology' | 'oncology' | 'pharmacogenomics' | 'metabolic' | 'neurodevelopmental' | 'respiratory' | 'bone'

export interface VarianKlinis {
  id: string
  gen: string
  /** Penulisan HGVS pada tingkat DNA pengkode, kalau berlaku. */
  hgvsC?: string
  /** Penulisan HGVS pada tingkat protein, kalau berlaku. */
  hgvsP?: string
  /** Bentuk lain: fusi, ekspansi ulang, alel HLA. */
  bentukLain?: string
  bidang: BidangVarian
  waris: PolaWaris
  penyakit: string
  /** Mekanisme di tingkat molekul — kenapa varian ini menimbulkan penyakitnya. */
  mekanisme: string
  /** APA YANG BERUBAH kalau varian ini ditemukan. Ini inti berkas ini. */
  tindakan: string[]
  /** Bagaimana varian ini terdeteksi dalam praktik. */
  deteksi: string
  /** id keadaan di atlas patologi. */
  kondisi: string[]
  /** id obat di bank obat. */
  obat: string[]
  /** Nama penyakit PERSIS seperti di daftar SKDI. */
  skdi: string[]
}

export const VARIAN: VarianKlinis[] = [
  // ══ HEMATOLOGI ════════════════════════════════════════════════════════════
  {
    id: 'hbb-glu7val',
    gen: 'HBB', hgvsC: 'c.20A>T', hgvsP: 'p.Glu7Val',
    bidang: 'haematology', waris: 'autosomal recessive',
    penyakit: 'Sickle cell disease',
    mekanisme:
      'Glutamate becomes valine at the sixth residue of the mature beta chain, replacing a charged surface amino acid ' +
      'with a hydrophobic one. Deoxygenated haemoglobin S polymerises into fibres that deform the red cell; the ' +
      'sickled cell is rigid, adheres to endothelium and haemolyses. Heterozygotes are protected against falciparum ' +
      'malaria, which is why the allele persists at high frequency where malaria is endemic.',
    tindakan: [
      'Hydroxyurea raises fetal haemoglobin and reduces crises — the single most useful long-term drug',
      'Penicillin prophylaxis and pneumococcal vaccination from infancy: the spleen autoinfarcts early',
      'Transcranial Doppler screening in children to prevent stroke; transfusion programme if velocities are high',
      'Avoid the triggers of polymerisation: hypoxia, dehydration, cold, acidosis',
    ],
    deteksi: 'Haemoglobin electrophoresis or HPLC; confirmed by targeted HBB sequencing. Newborn screening where it exists.',
    kondisi: [], obat: [], skdi: ['Hemoglobinopati', 'Anemia hemolitik'],
  },
  {
    id: 'hbb-ivs1-5',
    gen: 'HBB', hgvsC: 'c.92+5G>C',
    bidang: 'haematology', waris: 'autosomal recessive',
    penyakit: 'Beta thalassaemia (the commonest allele across South-East Asia)',
    mekanisme:
      'The change sits in the first intron near the donor splice site and weakens it, so most transcripts are spliced ' +
      'incorrectly and beta-globin output falls. Alpha chains are then produced in excess, precipitate in the ' +
      'erythroblast and destroy it inside the marrow — ineffective erythropoiesis, which is why the marrow expands ' +
      'and the bones deform in untreated disease.',
    tindakan: [
      'Regular transfusion to suppress ineffective erythropoiesis in transfusion-dependent disease',
      'Iron chelation from the start of a transfusion programme — iron overload, not anaemia, is what kills',
      'Carrier screening and genetic counselling in endemic regions; both parents carrying it gives a 1 in 4 risk',
      'Curative options: matched allogeneic transplant, and now gene therapy or gene editing that re-activates fetal haemoglobin',
    ],
    deteksi: 'Full blood count with microcytosis, HbA2 raised on HPLC, then HBB sequencing or targeted allele panel.',
    kondisi: [], obat: [], skdi: ['Hemoglobinopati', 'Anemia defisiensi besi'],
  },
  {
    id: 'g6pd-mediterranean',
    gen: 'G6PD', hgvsC: 'c.563C>T', hgvsP: 'p.Ser188Phe',
    bidang: 'pharmacogenomics', waris: 'X-linked',
    penyakit: 'G6PD deficiency, Mediterranean class II variant',
    mekanisme:
      'G6PD is the only source of NADPH in the mature red cell, and NADPH is what keeps glutathione reduced. Without ' +
      'it an oxidant challenge overwhelms the cell: haemoglobin denatures into Heinz bodies, the spleen bites them ' +
      'out leaving bite cells, and acute intravascular haemolysis follows. Enzyme activity falls with red cell age, ' +
      'so an assay taken DURING haemolysis can read falsely normal — the young cells that survive still have enzyme.',
    tindakan: [
      'Avoid the established triggers: primaquine and tafenoquine, rasburicase, nitrofurantoin, dapsone, methylene blue, fava beans',
      'Test G6PD BEFORE giving primaquine or rasburicase — this is the commonest preventable drug-induced haemolysis',
      'Treat acute haemolysis supportively; transfuse if severe; recheck the enzyme weeks after recovery, not during',
      'Neonatal jaundice can be severe — screen and monitor bilirubin in at-risk newborns',
    ],
    deteksi: 'Quantitative G6PD enzyme assay, timed away from an acute episode; genotyping confirms the class.',
    kondisi: [], obat: ['ciprofloxacin'], skdi: ['Anemia hemolitik', 'Malaria'],
  },
  {
    id: 'jak2-v617f',
    gen: 'JAK2', hgvsC: 'c.1849G>T', hgvsP: 'p.Val617Phe',
    bidang: 'haematology', waris: 'somatic',
    penyakit: 'Polycythaemia vera and other myeloproliferative neoplasms',
    mekanisme:
      'The mutation sits in the JH2 pseudokinase domain, whose job is to restrain the kinase domain. Losing that ' +
      'restraint makes JAK2 signal without a cytokine bound, so erythroid progenitors proliferate independently of ' +
      'erythropoietin — which is exactly why the erythropoietin level is LOW in polycythaemia vera and high in ' +
      'secondary polycythaemia.',
    tindakan: [
      'Aspirin plus venesection to a haematocrit target below 0.45 — thrombosis is the main cause of death',
      'Cytoreduction (hydroxycarbamide, or ruxolitinib for intolerance) in high-risk patients',
      'Assess cardiovascular risk aggressively; the risk is thrombotic, not bleeding, despite the high platelet count',
    ],
    deteksi: 'Allele-specific PCR or next-generation sequencing on peripheral blood; low serum erythropoietin supports it.',
    kondisi: ['leukemia'], obat: ['aspirin'], skdi: ['Polisitemia', 'Leukemia akut, kronik'],
  },
  {
    id: 'bcr-abl1',
    gen: 'BCR::ABL1', bentukLain: 't(9;22)(q34;q11) Philadelphia chromosome, p210 fusion transcript',
    bidang: 'oncology', waris: 'somatic',
    penyakit: 'Chronic myeloid leukaemia',
    mekanisme:
      'The translocation fuses BCR to ABL1, and the BCR portion forces the ABL1 kinase to dimerise, locking it on. ' +
      'One constitutively active tyrosine kinase drives the entire disease — which is why a single targeted drug can ' +
      'control it, and why CML became the proof that targeted therapy works at all.',
    tindakan: [
      'A tyrosine kinase inhibitor (imatinib and successors) — turns a fatal leukaemia into a chronic condition',
      'Monitor BCR::ABL1 transcript by quantitative PCR on the international scale; a rising level means resistance or non-adherence',
      'Sequence the kinase domain when response is lost — the mutation found determines which inhibitor comes next',
    ],
    deteksi: 'Karyotype, FISH, and quantitative RT-PCR for the fusion transcript.',
    kondisi: ['leukemia'], obat: [], skdi: ['Leukemia akut, kronik'],
  },
  {
    id: 'abl1-t315i',
    gen: 'ABL1', hgvsC: 'c.944C>T', hgvsP: 'p.Thr315Ile',
    bidang: 'oncology', waris: 'somatic',
    penyakit: 'Tyrosine kinase inhibitor resistance in CML',
    mekanisme:
      'Threonine 315 is the gatekeeper residue: its side-chain hydroxyl makes a hydrogen bond that most inhibitors ' +
      'depend on, and the larger isoleucine both removes that bond and blocks the hydrophobic pocket sterically. ' +
      'That single substitution defeats imatinib, dasatinib, nilotinib and bosutinib at once — a textbook example of ' +
      'why resistance is predictable from structure.',
    tindakan: [
      'Switch to an inhibitor that does not depend on the gatekeeper contact (ponatinib, or asciminib which binds the myristoyl pocket)',
      'Consider allogeneic transplant in suitable patients',
      'Never simply escalate the dose of a drug the gatekeeper mutation has structurally excluded',
    ],
    deteksi: 'Kinase domain sequencing at loss of response, before changing therapy.',
    kondisi: ['leukemia'], obat: [], skdi: ['Leukemia akut, kronik'],
  },
  {
    id: 'flt3-itd',
    gen: 'FLT3', bentukLain: 'Internal tandem duplication in the juxtamembrane domain',
    bidang: 'oncology', waris: 'somatic',
    penyakit: 'Acute myeloid leukaemia with FLT3-ITD',
    mekanisme:
      'The duplication disrupts the juxtamembrane domain that normally holds the receptor kinase inactive, so it ' +
      'signals without ligand. It confers a high white cell count, high relapse risk and shorter survival — and the ' +
      'allelic ratio matters, which is why the report gives a number and not just "present".',
    tindakan: [
      'Add a FLT3 inhibitor (midostaurin with induction, gilteritinib in relapse) — a survival benefit, not a refinement',
      'Result is needed within days: it changes the induction regimen, so testing cannot wait for the full panel',
      'Consider allogeneic transplant in first remission for high allelic ratio',
    ],
    deteksi: 'Fragment-length PCR or NGS on marrow at diagnosis, with the allelic ratio reported.',
    kondisi: ['leukemia'], obat: [], skdi: ['Leukemia akut, kronik'],
  },
  {
    id: 'pml-rara',
    gen: 'PML::RARA', bentukLain: 't(15;17)(q24;q21)',
    bidang: 'oncology', waris: 'somatic',
    penyakit: 'Acute promyelocytic leukaemia',
    mekanisme:
      'The fusion protein recruits co-repressors to retinoic acid response elements and blocks myeloid maturation at ' +
      'the promyelocyte stage. Pharmacological retinoic acid displaces the repressor and lets the cells mature ' +
      'instead of killing them — differentiation therapy. The promyelocyte granules are rich in procoagulants, which ' +
      'is why this leukaemia bleeds catastrophically before treatment starts.',
    tindakan: [
      'START ALL-TRANS RETINOIC ACID ON SUSPICION, before genetic confirmation — the early deaths are from haemorrhage',
      'Combine with arsenic trioxide; support fibrinogen and platelets aggressively',
      'Watch for differentiation syndrome: fever, hypoxia, oedema — treat with dexamethasone immediately',
    ],
    deteksi: 'Morphology plus urgent FISH or PCR for PML::RARA; treatment begins before the result returns.',
    kondisi: ['leukemia'], obat: ['dexamethasone'], skdi: ['Leukemia akut, kronik', 'DIC (Disseminated Intravascular Coagulation)'],
  },
  {
    id: 'spectrin-spherocytosis',
    gen: 'ANK1 / SPTB / SLC4A1',
    bentukLain: 'Loss-of-function variants in ankyrin, beta-spectrin or band 3',
    bidang: 'haematology', waris: 'autosomal dominant',
    penyakit: 'Hereditary spherocytosis',
    mekanisme:
      'Defects in the vertical links between the membrane and its spectrin skeleton let the lipid bilayer shed as ' +
      'microvesicles. The cell loses surface area but keeps its volume, so it becomes a sphere — and a sphere cannot ' +
      'deform through splenic cords, so it is destroyed there. That single geometric fact explains the spherocytes, ' +
      'the splenomegaly, and why splenectomy works.',
    tindakan: [
      'Folate supplementation; transfusion during aplastic crisis (parvovirus B19)',
      'Splenectomy for severe disease — weigh against lifelong sepsis risk; vaccinate and give prophylaxis first',
      'Cholecystectomy for pigment gallstones, which are common and often symptomatic',
    ],
    deteksi: 'Blood film, EMA binding test or osmotic gradient ektacytometry; genetic testing when atypical.',
    kondisi: ['kolelitiasis'], obat: [], skdi: ['Anemia hemolitik', 'Kole(doko)litiasis'],
  },

  // ══ ONKOLOGI TERARAH ══════════════════════════════════════════════════════
  {
    id: 'kras-g12c',
    gen: 'KRAS', hgvsC: 'c.34G>T', hgvsP: 'p.Gly12Cys',
    bidang: 'oncology', waris: 'somatic',
    penyakit: 'KRAS G12C-mutant lung and colorectal cancer',
    mekanisme:
      'Glycine 12 sits in the P-loop; replacing it blocks GAP-stimulated GTP hydrolysis, so KRAS stays GTP-bound and ' +
      'signals continuously down RAF-MEK-ERK. KRAS was called undruggable for thirty years until the cysteine ' +
      'introduced by this specific substitution gave covalent inhibitors something to attach to — the mutation ' +
      'created its own drug target.',
    tindakan: [
      'Covalent G12C inhibitors (sotorasib, adagrasib) in previously treated advanced disease',
      'In colorectal cancer, ANY KRAS mutation predicts failure of anti-EGFR antibodies — test before prescribing them',
      'Resistance emerges through new RAS/MAPK alterations; re-biopsy or use circulating tumour DNA at progression',
    ],
    deteksi: 'Tumour NGS panel or circulating tumour DNA.',
    kondisi: ['ca-paru', 'ca-kolon'], obat: [], skdi: ['Karsinoma paru', 'Karsinoma kolon'],
  },
  {
    id: 'braf-v600e',
    gen: 'BRAF', hgvsC: 'c.1799T>A', hgvsP: 'p.Val600Glu',
    bidang: 'oncology', waris: 'somatic',
    penyakit: 'BRAF V600E melanoma, thyroid and colorectal cancer',
    mekanisme:
      'The substitution mimics phosphorylation of the activation loop, so BRAF signals as a monomer without RAS ' +
      'input. In melanoma, inhibiting it works; in colorectal cancer the same inhibition triggers feedback EGFR ' +
      'activation that rescues the tumour — which is why the same mutation needs a different combination in a ' +
      'different organ. The tissue context, not the mutation alone, decides the regimen.',
    tindakan: [
      'Melanoma: BRAF plus MEK inhibitor combination (dabrafenib with trametinib)',
      'Colorectal: BRAF inhibitor must be combined with an anti-EGFR antibody to block the feedback loop',
      'Never give a BRAF inhibitor to a BRAF wild-type tumour — it paradoxically activates the pathway',
    ],
    deteksi: 'Immunohistochemistry (VE1) or tumour NGS.',
    kondisi: ['melanoma', 'ca-tiroid', 'ca-kolon'], obat: [], skdi: ['Melanoma maligna', 'Karsinoma tiroid'],
  },
  {
    id: 'egfr-l858r',
    gen: 'EGFR', hgvsC: 'c.2573T>G', hgvsP: 'p.Leu858Arg',
    bidang: 'oncology', waris: 'somatic',
    penyakit: 'EGFR-mutant non-small cell lung cancer',
    mekanisme:
      'The substitution destabilises the inactive conformation of the kinase, leaving it constitutively active and ' +
      'the tumour addicted to that one signal. Response rates to targeted inhibitors are high precisely because of ' +
      'that addiction — and relapse is equally predictable, most often through the T790M gatekeeper change.',
    tindakan: [
      'Third-generation inhibitor (osimertinib) first line — it also covers T790M and crosses into the brain',
      'Test EVERY advanced lung adenocarcinoma before starting chemotherapy; the order of treatment matters',
      'Re-biopsy or use circulating tumour DNA at progression to find the resistance mechanism',
    ],
    deteksi: 'Tumour NGS or targeted PCR; plasma circulating tumour DNA when tissue is inadequate.',
    kondisi: ['ca-paru'], obat: [], skdi: ['Karsinoma paru'],
  },
  {
    id: 'egfr-t790m',
    gen: 'EGFR', hgvsC: 'c.2369C>T', hgvsP: 'p.Thr790Met',
    bidang: 'oncology', waris: 'somatic',
    penyakit: 'Acquired resistance to first-generation EGFR inhibitors',
    mekanisme:
      'Another gatekeeper substitution: methionine restores the kinase\'s affinity for ATP so that reversible ' +
      'inhibitors can no longer compete. Covalent third-generation inhibitors bind a nearby cysteine instead and ' +
      'therefore keep working — the same structural logic as ABL1 T315I, in a different kinase.',
    tindakan: [
      'Switch to osimertinib if it was not used first line',
      'Look for other mechanisms too: MET amplification, small cell transformation on repeat biopsy',
    ],
    deteksi: 'Plasma circulating tumour DNA at progression, or repeat tumour biopsy.',
    kondisi: ['ca-paru'], obat: [], skdi: ['Karsinoma paru'],
  },
  {
    id: 'brca1',
    gen: 'BRCA1', bentukLain: 'Pathogenic loss-of-function variants across the gene',
    bidang: 'oncology', waris: 'autosomal dominant',
    penyakit: 'Hereditary breast and ovarian cancer syndrome',
    mekanisme:
      'BRCA1 is required for homologous recombination repair of double-strand breaks. Cells that lose it survive by ' +
      'using error-prone repair, which is what makes the tumours genomically unstable — and what makes them ' +
      'vulnerable: block PARP-dependent single-strand repair as well and the cell has no route left. That is ' +
      'synthetic lethality, and it is the reason a DNA repair defect can be exploited as a drug target.',
    tindakan: [
      'PARP inhibitor (olaparib) for BRCA-associated breast, ovarian, pancreatic and prostate cancer',
      'Risk-reducing surgery and intensified surveillance discussed formally, with genetic counselling',
      'Cascade testing of relatives — the result changes their care, not only the patient\'s',
    ],
    deteksi: 'Germline panel on blood or saliva, with counselling before and after; tumour testing does not replace it.',
    kondisi: ['ca-payudara'], obat: [], skdi: ['Karsinoma payudara', 'Karsinoma ovarium'],
  },

  // ══ FARMAKOGENOMIKA ═══════════════════════════════════════════════════════
  {
    id: 'cyp2c19-2',
    gen: 'CYP2C19', hgvsC: 'c.681G>A', bentukLain: 'CYP2C19*2 (rs4244285)',
    bidang: 'pharmacogenomics', waris: 'autosomal recessive',
    penyakit: 'Clopidogrel non-response',
    mekanisme:
      'The variant creates a cryptic splice site and abolishes enzyme activity. Clopidogrel is a prodrug that needs ' +
      'CYP2C19 for its activation step, so a poor metaboliser takes the drug, has the bleeding risk of taking it, ' +
      'and gets little antiplatelet effect. This allele is common in East and South-East Asian populations, which ' +
      'makes it a population-level issue rather than a rarity.',
    tindakan: [
      'Use prasugrel or ticagrelor instead in poor metabolisers after percutaneous coronary intervention',
      'Do not increase the clopidogrel dose to compensate — the activation step is the bottleneck',
      'Remember the same interaction pathway: omeprazole inhibits CYP2C19 and blunts clopidogrel',
    ],
    deteksi: 'Targeted genotyping, increasingly point-of-care in cardiology units.',
    kondisi: ['stemi-anterior', 'stable-angina'], obat: ['clopidogrel', 'omeprazole'], skdi: ['Infark miokard', 'Angina pektoris'],
  },
  {
    id: 'hla-b1502',
    gen: 'HLA-B', bentukLain: 'HLA-B*15:02 allele',
    bidang: 'pharmacogenomics', waris: 'autosomal dominant',
    penyakit: 'Carbamazepine and phenytoin Stevens-Johnson syndrome',
    mekanisme:
      'The drug binds directly to this particular HLA molecule and alters the repertoire of peptides it presents, so ' +
      'cytotoxic T cells attack keratinocytes as if they were foreign. The association is with the allele, not with ' +
      'dose or duration — which is why it can be predicted before the first tablet, and why the allele is common ' +
      'enough in South-East Asian populations for screening to be recommended there.',
    tindakan: [
      'Screen before starting carbamazepine in patients of South-East Asian ancestry; avoid the drug if positive',
      'Phenytoin carries the same association — a positive result changes the whole aromatic anticonvulsant class',
      'Record the result permanently: this is a lifelong contraindication, not an episode',
    ],
    deteksi: 'HLA typing on blood before prescribing.',
    kondisi: ['sjs', 'epilepsi-temporal'], obat: ['phenytoin'], skdi: ['Sindrom Stevens-Johnson', 'Epilepsi'],
  },
  {
    id: 'tpmt-nudt15',
    gen: 'TPMT / NUDT15', bentukLain: 'TPMT*3A, TPMT*3C, NUDT15 c.415C>T',
    bidang: 'pharmacogenomics', waris: 'autosomal recessive',
    penyakit: 'Thiopurine myelosuppression',
    mekanisme:
      'Azathioprine and mercaptopurine are inactivated along a pathway that these enzymes control. Reduced activity ' +
      'shunts more drug into active thioguanine nucleotides, and profound, sometimes fatal marrow suppression ' +
      'follows a standard dose. NUDT15 variants matter more in Asian populations while TPMT variants dominate in ' +
      'European ones — testing only TPMT misses most of the risk in Asia.',
    tindakan: [
      'Test TPMT and NUDT15 before the first thiopurine dose',
      'Reduce the starting dose substantially in intermediate metabolisers; avoid thiopurines in poor metabolisers',
      'Monitor the full blood count regardless of genotype — the test lowers risk, it does not remove it',
    ],
    deteksi: 'Genotyping, or TPMT enzyme activity where genotyping is unavailable.',
    kondisi: ['crohn', 'sle'], obat: [], skdi: ['Penyakit Crohn', 'Lupus eritematosus sistemik', 'Agranulositosis'],
  },
  {
    id: 'dpyd',
    gen: 'DPYD', hgvsC: 'c.1905+1G>A', bentukLain: 'DPYD*2A',
    bidang: 'pharmacogenomics', waris: 'autosomal recessive',
    penyakit: 'Fluoropyrimidine toxicity',
    mekanisme:
      'Dihydropyrimidine dehydrogenase clears more than 80% of a fluorouracil dose. A splice-site variant that ' +
      'abolishes activity leaves the drug circulating far longer, and standard dosing then produces severe mucositis, ' +
      'diarrhoea, neutropenia and death. The toxicity looks idiosyncratic but is entirely predictable from genotype.',
    tindakan: [
      'Test DPYD before fluorouracil or capecitabine — recommended before the first cycle',
      'Reduce the dose substantially for intermediate metabolisers; avoid entirely in complete deficiency',
      'Uridine triacetate is the rescue agent for early overdose or severe toxicity',
    ],
    deteksi: 'Genotyping of the four established variants, ideally before the first cycle.',
    kondisi: ['ca-kolon'], obat: [], skdi: ['Karsinoma kolon'],
  },

  // ══ METABOLIK, RESPIRASI, TULANG ══════════════════════════════════════════
  {
    id: 'cftr-f508del',
    gen: 'CFTR', hgvsC: 'c.1521_1523delCTT', hgvsP: 'p.Phe508del',
    bidang: 'respiratory', waris: 'autosomal recessive',
    penyakit: 'Cystic fibrosis',
    mekanisme:
      'Deleting one phenylalanine misfolds the protein, so it is degraded before reaching the cell surface — a ' +
      'trafficking defect rather than a channel defect. Correctors help it fold and reach the membrane while ' +
      'potentiators hold the channel open once it is there, which is why modern therapy needs both and why the ' +
      'mutation CLASS, not the diagnosis, chooses the drug.',
    tindakan: [
      'CFTR modulator therapy by genotype (elexacaftor-tezacaftor-ivacaftor for eligible patients) — it changes the disease trajectory',
      'Airway clearance, inhaled mucolytics and antibiotics, high-energy nutrition and pancreatic enzyme replacement',
      'Newborn screening and carrier testing; annual review in a specialist centre',
    ],
    deteksi: 'Sweat chloride test, then CFTR genotyping — the genotype is required to choose a modulator.',
    kondisi: ['bronkiektasis', 'pankreatitis'], obat: ['salbutamol'], skdi: ['Kistik fibrosis', 'Bronkiektasis'],
  },
  {
    id: 'serpina1-piz',
    gen: 'SERPINA1', hgvsC: 'c.1096G>A', hgvsP: 'p.Glu366Lys', bentukLain: 'PiZ allele',
    bidang: 'respiratory', waris: 'autosomal recessive',
    penyakit: 'Alpha-1 antitrypsin deficiency',
    mekanisme:
      'The Z variant polymerises inside the hepatocyte instead of being secreted. Two organs suffer for opposite ' +
      'reasons: the liver is damaged by what is retained, and the lung by what never arrives — unopposed neutrophil ' +
      'elastase digests alveolar walls. That is why the emphysema is basal and panacinar, unlike the apical ' +
      'centrilobular emphysema of smoking, and why it appears decades early.',
    tindakan: [
      'Test any emphysema before 45, basal emphysema, or unexplained liver disease',
      'Absolute smoking cessation — smoking multiplies the risk far more than in normal individuals',
      'Augmentation therapy in selected patients; screen family members; liver surveillance',
    ],
    deteksi: 'Serum alpha-1 antitrypsin level with phenotyping or genotyping — a normal level during inflammation can mislead.',
    kondisi: ['copd', 'sirosis'], obat: ['salbutamol', 'prednisolone'], skdi: ['Emfisema paru', 'Penyakit Paru Obstruksi Kronik (PPOK) eksaserbasi akut'],
  },
  {
    id: 'pah-pku',
    gen: 'PAH', bentukLain: 'Biallelic pathogenic variants',
    bidang: 'metabolic', waris: 'autosomal recessive',
    penyakit: 'Phenylketonuria',
    mekanisme:
      'Phenylalanine hydroxylase cannot convert phenylalanine to tyrosine, so phenylalanine accumulates and is toxic ' +
      'to the developing brain, while tyrosine becomes conditionally essential. The damage is done in infancy and is ' +
      'irreversible — which is the entire justification for newborn screening: the treatment is simple and the window is short.',
    tindakan: [
      'Lifelong phenylalanine-restricted diet with an amino acid supplement, started in the first weeks of life',
      'Sapropterin in responsive genotypes; monitor phenylalanine levels regularly',
      'MATERNAL PKU: strict control before and during pregnancy, or the fetus is damaged regardless of its own genotype',
    ],
    deteksi: 'Newborn screening by tandem mass spectrometry, confirmed by PAH genotyping.',
    kondisi: [], obat: [], skdi: ['Fenilketonuria', 'Retardasi mental'],
  },
  {
    id: 'phex-xlh',
    gen: 'PHEX', bentukLain: 'Loss-of-function variants',
    bidang: 'bone', waris: 'X-linked',
    penyakit: 'X-linked hypophosphataemic rickets',
    mekanisme:
      'Loss of PHEX raises circulating FGF23, which forces the kidney to waste phosphate and suppresses activation of ' +
      'vitamin D. The child therefore has rickets with a LOW phosphate and an inappropriately normal or low calcitriol, ' +
      'while calcium and PTH are near normal — a biochemical pattern that separates it immediately from ' +
      'nutritional vitamin D deficiency, which is far commoner and treated completely differently.',
    tindakan: [
      'Burosumab, an anti-FGF23 antibody, is now first-line where available and outperforms phosphate with calcitriol',
      'Do not treat as simple vitamin D deficiency: plain vitamin D alone does not correct renal phosphate wasting',
      'Orthopaedic follow-up for deformity, dental abscess surveillance, growth monitoring',
    ],
    deteksi: 'Serum phosphate, tubular reabsorption of phosphate, FGF23, then PHEX sequencing.',
    kondisi: ['fraktur-osteoporosis'], obat: [], skdi: ['Ricketsia, osteomalasia', 'Osteoporosis'],
  },
  {
    id: 'hfe-c282y',
    gen: 'HFE', hgvsC: 'c.845G>A', hgvsP: 'p.Cys282Tyr',
    bidang: 'metabolic', waris: 'autosomal recessive',
    penyakit: 'Hereditary haemochromatosis',
    mekanisme:
      'The variant disrupts a disulfide bond needed for HFE to reach the cell surface, so hepcidin signalling fails ' +
      'and the gut keeps absorbing iron that the body cannot excrete. Iron deposits in liver, pancreas, heart, ' +
      'pituitary and joints over decades — which is why it presents in middle age and why penetrance is far from complete.',
    tindakan: [
      'Venesection to a ferritin target — cheap, effective, and it prevents cirrhosis if started before it develops',
      'Screen first-degree relatives; avoid iron and vitamin C supplements and uncooked shellfish',
      'Surveillance for hepatocellular carcinoma once cirrhosis is established',
    ],
    deteksi: 'Transferrin saturation and ferritin first, then HFE genotyping; liver assessment for fibrosis.',
    kondisi: ['sirosis', 'dm2'], obat: [], skdi: ['Sirosis hepatis', 'Diabetes melitus tipe lain (intoleransi glukosa akibat penyakit lain atau obat-obatan)'],
  },

  // ══ NEURODEVELOPMENTAL ════════════════════════════════════════════════════
  {
    id: 'fmr1-cgg',
    gen: 'FMR1', bentukLain: 'CGG trinucleotide repeat expansion above 200 with promoter methylation',
    bidang: 'neurodevelopmental', waris: 'X-linked',
    penyakit: 'Fragile X syndrome — the commonest inherited cause of intellectual disability and autism',
    mekanisme:
      'Expansion beyond about 200 repeats methylates the promoter and silences FMR1, so FMRP is absent. FMRP normally ' +
      'restrains translation at the synapse, and losing that brake leaves excessive metabotropic glutamate signalling ' +
      'and immature dendritic spines. Premutation carriers (55–200 repeats) are a separate matter entirely: they ' +
      'make the protein but have toxic RNA, causing tremor-ataxia syndrome and primary ovarian insufficiency.',
    tindakan: [
      'Test any child with unexplained developmental delay, intellectual disability or autism — this is a first-line genetic test',
      'Early intervention: speech and language, occupational therapy, behavioural support, education planning',
      'Genetic counselling for the whole family: the premutation expands between generations through the maternal line',
    ],
    deteksi: 'PCR with Southern blot or triplet-primed PCR for repeat size and methylation status.',
    kondisi: [], obat: [], skdi: ['Retardasi mental', 'Gangguan perkembangan pervasif'],
  },
  {
    id: 'mecp2-rett',
    gen: 'MECP2', bentukLain: 'De novo loss-of-function variants',
    bidang: 'neurodevelopmental', waris: 'X-linked',
    penyakit: 'Rett syndrome',
    mekanisme:
      'MECP2 reads methylated DNA and regulates transcription in mature neurons — it is needed to MAINTAIN neuronal ' +
      'function, not to build the brain. That is why development is normal for 6–18 months and then regresses, and ' +
      'why animal work showing that restoring the gene reverses features has made this a target for gene therapy ' +
      'rather than a fixed developmental fate.',
    tindakan: [
      'Recognise the pattern: regression after normal early development, loss of purposeful hand use, hand-wringing stereotypies, acquired microcephaly',
      'Multidisciplinary care: seizures, scoliosis, breathing dysrhythmia, feeding and communication',
      'Almost always de novo, so recurrence risk for siblings is low — but confirm before counselling',
    ],
    deteksi: 'MECP2 sequencing and deletion/duplication analysis, usually within a neurodevelopmental panel.',
    kondisi: ['epilepsi-temporal', 'skoliosis'], obat: ['phenytoin'], skdi: ['Retardasi mental', 'Epilepsi', 'Kelainan bentuk tulang belakang (kifosis, skoliosis, lordosis)'],
  },
  {
    id: 'shank3',
    gen: 'SHANK3', bentukLain: '22q13.3 deletion or truncating variants',
    bidang: 'neurodevelopmental', waris: 'autosomal dominant',
    penyakit: 'Phelan-McDermid syndrome with autism spectrum disorder',
    mekanisme:
      'SHANK3 is a scaffolding protein of the postsynaptic density at glutamatergic synapses. Losing one copy reduces ' +
      'synaptic strength and maturation — evidence that a substantial part of autism genetics converges on the ' +
      'synapse itself rather than on any single behavioural circuit.',
    tindakan: [
      'Chromosomal microarray as a first-line test in unexplained developmental delay or autism',
      'Structured developmental and communication support; monitor for regression, seizures and renal anomalies',
      'Genetic counselling, including parental testing for balanced rearrangements',
    ],
    deteksi: 'Chromosomal microarray; exome sequencing when the array is normal.',
    kondisi: [], obat: [], skdi: ['Gangguan perkembangan pervasif', 'Retardasi mental'],
  },
]

export function varianUntukBidang(bidang: BidangVarian): VarianKlinis[] {
  return VARIAN.filter((v) => v.bidang === bidang)
}

export function varianUntukKondisi(conditionId: string): VarianKlinis[] {
  return VARIAN.filter((v) => v.kondisi.includes(conditionId))
}

export function varianUntukObat(drugId: string): VarianKlinis[] {
  return VARIAN.filter((v) => v.obat.includes(drugId))
}

/** Penulisan pendek untuk daftar: gen dengan varian utamanya. */
export function labelVarian(v: VarianKlinis): string {
  return `${v.gen} ${v.hgvsP ?? v.hgvsC ?? v.bentukLain ?? ''}`.trim()
}
