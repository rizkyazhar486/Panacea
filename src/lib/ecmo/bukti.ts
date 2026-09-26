// Registri bukti dan model ilmiah untuk kembaran digital ECMO.
// UI tidak pernah membawa sitasi sendiri: aturan menunjuk ke id bukti di sini.
// Hanya sumber yang metadatanya diperiksa lewat PubMed yang dimasukkan.

export type StatusValidasi =
  | 'terverifikasi-teks-lengkap'   // rumus/klaim dibaca dari teks lengkap sumber
  | 'terverifikasi-abstrak'        // rumus/klaim tercetak di abstrak
  | 'verifikasi-sumber-tertunda'   // rumus lazim; teks lengkap sumber belum terbaca
  | 'ilustratif-tak-terkalibrasi'  // bentuk arah benar, konstanta dipilih untuk mengajar

export interface EvidenceReference {
  id: string
  sitasi: string
  tahun: number
  pmid?: string
  doi?: string
  pmcid?: string
  populasi: string
  konfigurasi: Array<'VV' | 'VA-perifer' | 'VA-sentral' | 'umum'>
}

export interface ScientificModel {
  id: string
  nama: string
  sistem: string
  persamaan: string
  satuan: Record<string, string>
  asumsi: string[]
  rentang?: string
  bukti: string[]
  status: StatusValidasi
}

export const BUKTI: Record<string, EvidenceReference> = {
  'elso-vv-2021': {
    id: 'elso-vv-2021', tahun: 2021, pmid: '33965970', doi: '10.1097/MAT.0000000000001432', pmcid: 'PMC8315725',
    sitasi: 'Tonna JE et al. Management of Adult Patients Supported with VV ECMO: Guideline from ELSO. ASAIO J 2021;67(6):601-610',
    populasi: 'Adults with severe respiratory failure on VV ECMO', konfigurasi: ['VV'],
  },
  'elso-va-2021': {
    id: 'elso-va-2021', tahun: 2021, pmid: '34339398', doi: '10.1097/MAT.0000000000001510',
    sitasi: 'Lorusso R et al. ELSO Interim Guidelines for VA ECMO in Adult Cardiac Patients. ASAIO J 2021;67(8):827-844',
    populasi: 'Adult cardiac patients on VA ECMO', konfigurasi: ['VA-perifer', 'VA-sentral'],
  },
  'abrams-resirkulasi-2015': {
    id: 'abrams-resirkulasi-2015', tahun: 2015, pmid: '25423117', doi: '10.1097/MAT.0000000000000179',
    sitasi: 'Abrams D, Bacchetta M, Brodie D. Recirculation in venovenous ECMO. ASAIO J 2015;61(2):115-21',
    populasi: 'VV ECMO (review)', konfigurasi: ['VV'],
  },
  'lindholm-kanulasi-2018': {
    id: 'lindholm-kanulasi-2018', tahun: 2018, pmid: '29732177', doi: '10.21037/jtd.2018.03.101', pmcid: 'PMC5911563',
    sitasi: 'Lindholm JA. Cannulation for veno-venous ECMO. J Thorac Dis 2018;10(Suppl 5):S606-S612',
    populasi: 'VV ECMO cannulation (review)', konfigurasi: ['VV'],
  },
  'badulak-sirkulasi-ganda-2024': {
    id: 'badulak-sirkulasi-ganda-2024', tahun: 2024, pmid: '39557688', doi: '10.1007/s00134-024-07645-8', pmcid: 'PMC11588769',
    sitasi: 'Badulak J et al. Position paper on the physiology and nomenclature of dual circulation during VA ECMO in adults. Intensive Care Med 2024;50(12):1994-2004',
    populasi: 'Adults on VA ECMO', konfigurasi: ['VA-perifer'],
  },
  'severinghaus-1979': {
    id: 'severinghaus-1979', tahun: 1979, pmid: '35496', doi: '10.1152/jappl.1979.46.3.599',
    sitasi: 'Severinghaus JW. Simple, accurate equations for human blood O2 dissociation computations. J Appl Physiol 1979;46(3):599-602',
    populasi: 'Standard human blood (pH 7.40, 37 °C)', konfigurasi: ['umum'],
  },
}

export const MODEL: Record<string, ScientificModel> = {
  'kurva-disosiasi': {
    id: 'kurva-disosiasi', nama: 'O2 dissociation curve', sistem: 'hematologi',
    persamaan: 'S = 1 / (23400 / (PO2^3 + 150·PO2) + 1)', satuan: { S: 'fraction', PO2: 'mmHg' },
    asumsi: ['standard curve: pH 7.40, 37 °C, normal P50; shifts (temperature, pH, 2,3-DPG) not yet applied'],
    rentang: 'fit within ±0.0055 S (source)', bukti: ['severinghaus-1979'], status: 'terverifikasi-abstrak',
  },
  'kandungan-o2': {
    id: 'kandungan-o2', nama: 'Blood O2 content', sistem: 'transport-o2',
    persamaan: 'C = 1.39·Hb·S + 0.0034·PO2', satuan: { C: 'mL O2/dL', Hb: 'g/dL', S: 'fraction', PO2: 'mmHg' },
    asumsi: [
      'ELSO prints Hb in g/L; taken literally the dissolved term would be 10× too small. Hb is used in g/dL so both terms are mL/dL.',
      'hemodinamik.ts uses the other published convention (1.34, 0.003); one registered choice is pending in the Human Digital Twin registry.',
    ],
    bukti: ['elso-vv-2021'], status: 'terverifikasi-teks-lengkap',
  },
  'hantaran-o2': {
    id: 'hantaran-o2', nama: 'Systemic O2 delivery / consumption', sistem: 'transport-o2',
    persamaan: 'DO2 = 10·CO·CaO2;  VO2 = 10·CO·(CaO2 − CvO2);  OER = VO2/DO2', satuan: { DO2: 'mL/min', CO: 'L/min', C: 'mL/dL' },
    asumsi: ['×10 converts L/min × mL/dL to mL/min'], bukti: ['elso-vv-2021'], status: 'terverifikasi-teks-lengkap',
  },
  'aliran-efektif-vv': {
    id: 'aliran-efektif-vv', nama: 'Effective VV ECMO flow', sistem: 'ecmo',
    persamaan: 'fraction = (Q_ECMO − Q_recirc) / CO', satuan: { Q: 'L/min' },
    asumsi: ['recirculated blood is not counted as systemic extracorporeal flow'], bukti: ['elso-vv-2021'], status: 'terverifikasi-teks-lengkap',
  },
  'pencampuran-vv': {
    id: 'pencampuran-vv', nama: 'VV right-heart mixing (mass balance)', sistem: 'ecmo',
    persamaan: 'C_PA = (Q_eff·C_post + (CO − Q_eff)·C_v) / CO', satuan: { C: 'mL/dL', Q: 'L/min' },
    asumsi: ['steady state', 'complete mixing in RA/RV', 'Q_eff ≤ CO'], bukti: ['elso-vv-2021'], status: 'terverifikasi-teks-lengkap',
  },
  'fraksi-resirkulasi': {
    id: 'fraksi-resirkulasi', nama: 'Recirculation fraction (saturation method)', sistem: 'ecmo',
    persamaan: 'R = (S_pre − S_v) / (S_post − S_v)', satuan: { S: 'fraction' },
    asumsi: ['S_v is true venous saturation not contaminated by return flow'], bukti: ['abrams-resirkulasi-2015'], status: 'verifikasi-sumber-tertunda',
  },
  'resirkulasi-geometri': {
    id: 'resirkulasi-geometri', nama: 'Recirculation vs cannula distance and Q/CO', sistem: 'ecmo',
    persamaan: 'R = 0.6/(1+exp((d−8)/2.5)) · (0.4 + 0.6·min(1, Q/CO))', satuan: { d: 'cm between drainage and return ports', Q: 'L/min' },
    asumsi: ['directional teaching model: closer cannulas and higher Q/CO raise recirculation (sources); constants are illustrative, not fitted'],
    bukti: ['abrams-resirkulasi-2015', 'lindholm-kanulasi-2018', 'elso-vv-2021'], status: 'ilustratif-tak-terkalibrasi',
  },
  'membran-o2': {
    id: 'membran-o2', nama: 'Membrane-lung O2 equilibration', sistem: 'ecmo',
    persamaan: 'P_post = P_pre + m·(FdO2·(PB − 47) − P_pre); sweep = 0 ⇒ P_post = P_pre', satuan: { P: 'mmHg', m: 'membrane function 0–1' },
    asumsi: ['healthy membrane approaches sweep-gas PO2; transfer impairment scales with m'], bukti: ['elso-vv-2021'], status: 'ilustratif-tak-terkalibrasi',
  },
  'co2-keseimbangan': {
    id: 'co2-keseimbangan', nama: 'Steady-state PaCO2 with ECMO CO2 removal', sistem: 'respirasi',
    persamaan: 'PaCO2 = VCO2 / (VA/0.863 + 7·m·sweep/(sweep+1.5)·Q/(Q+1)); VCO2 = RQ·VO2', satuan: { VA: 'L/min', VCO2: 'mL/min', sweep: 'L/min' },
    asumsi: ['alveolar ventilation equation for native lungs', 'membrane term: CO2 removal rises with sweep (source) and saturates; k illustrative'],
    bukti: ['elso-vv-2021'], status: 'ilustratif-tak-terkalibrasi',
  },
  'henderson-hasselbalch': {
    id: 'henderson-hasselbalch', nama: 'Henderson–Hasselbalch (bicarbonate buffer)', sistem: 'asam-basa',
    persamaan: 'pH = 6.1 + log10(HCO3 / (0.03·PaCO2))', satuan: { HCO3: 'mmol/L', PaCO2: 'mmHg' },
    asumsi: ['HCO3 held constant: acute renal/buffer compensation not modeled', 'does not describe every ICU acid–base disorder'],
    bukti: [], status: 'verifikasi-sumber-tertunda',
  },
  'partisi-aorta-va': {
    id: 'partisi-aorta-va', nama: 'Peripheral VA aortic flow partition (mixing point)', sistem: 'ecmo',
    persamaan: 'antegrade native flow fills aortic branches from the root; retrograde ECMO flow fills from the iliac end; the branch where they meet receives mixed content',
    satuan: { Q: 'L/min' },
    asumsi: ['plug-flow partition, no diffusion/turbulent mixing', 'branch flow fractions are illustrative adult proportions, not measured', 'native LV blood leaves the lungs; ECMO blood leaves the membrane'],
    bukti: ['badulak-sirkulasi-ganda-2024', 'elso-va-2021'], status: 'ilustratif-tak-terkalibrasi',
  },
}

export function buktiUntuk(idModel: string): EvidenceReference[] {
  const m = MODEL[idModel]
  if (!m) throw new Error(`model tidak terdaftar: ${idModel}`)
  return m.bukti.map((id) => { const b = BUKTI[id]; if (!b) throw new Error(`bukti hilang: ${id}`); return b })
}
