import type { UrutanLapisan } from './dissection'

/**
 * Educational layer sequence for Caesarean exposure.
 *
 * This deliberately describes anatomy encountered by depth rather than an
 * operative recipe. It contains no incision dimensions, traction/force,
 * device sizing, drug dosing, closure technique or patient-specific target.
 * The female HRA used elsewhere in Body Exposure is a non-pregnant reference
 * body, so pregnancy-specific morphology remains an explicit source gap.
 */
export const CAESAREAN_LAYER_SEQUENCE: UrutanLapisan = {
  kunci: 'caesarean-layered-anatomy',
  wilayah: 'pelvis',
  judul: 'Caesarean section — layered abdominal & pelvic anatomy',
  patokan: 'Lower anterior abdominal wall and female pelvis; reference relationships only, not a patient-specific operative target.',
  lapis: [
    {
      nama: 'Skin',
      catatan: 'External surface landmark. Skin thickness and scar position vary between people and prior operations.',
    },
    {
      nama: 'Superficial fascia and subcutaneous tissue',
      catatan: 'Fatty and membranous superficial layers over the anterior abdominal wall; thickness is highly variable.',
      bahaya: ['Superficial epigastric vessels'],
    },
    {
      nama: 'Anterior rectus sheath',
      catatan: 'Aponeurotic layer anterior to rectus abdominis in the lower abdominal wall.',
    },
    {
      nama: 'Rectus abdominis and midline fascial relationship',
      catatan: 'Paired rectus muscles frame the midline. Inferior epigastric vessels lie deep/lateral to rectus and remain an important spatial relationship.',
      bahaya: ['Inferior epigastric vessels'],
    },
    {
      nama: 'Transversalis fascia and preperitoneal tissue',
      catatan: 'Thin deep fascial and extraperitoneal layers separating the abdominal wall musculature from parietal peritoneum.',
    },
    {
      nama: 'Parietal peritoneum and peritoneal cavity',
      catatan: 'Entry into the peritoneal compartment changes the spatial context from abdominal wall layers to pelvic viscera.',
      bahaya: ['Bowel', 'Urinary bladder'],
    },
    {
      nama: 'Bladder–uterus relationship',
      catatan: 'The urinary bladder lies anterior to the uterus/cervix in the female pelvis. Distension, adhesions and pregnancy can alter this relationship.',
      bahaya: ['Urinary bladder', 'Ureters'],
    },
    {
      nama: 'Uterine wall / lower uterine region concept',
      catatan: 'The reference atlas supplies non-pregnant uterine geometry. A gravid lower uterine segment, placenta, membranes and fetus are not inferred by scaling this mesh.',
      bahaya: ['Uterine vessels'],
    },
  ],
  sumber: 'Gray’s Anatomy 42nd ed.; Williams Obstetrics 26th ed.; HuBMAP Human Reference Atlas female reference body (geometry context).',
}
