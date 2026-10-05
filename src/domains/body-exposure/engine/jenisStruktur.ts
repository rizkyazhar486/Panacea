/**
 * Classifies a structure from the words in its atlas name.
 * This is the same name-reading used for artery, vein and bone. It does not
 * infer a patient organ, a disease, or a measurement.
 */
export function jenisDariNamaStruktur(nama: string): string {
  const n = nama.toLowerCase()
  if (!n.trim()) return ''
  if (/muscle/.test(n)) return 'a skeletal muscle — it produces movement by shortening across a joint'
  if (/nerve|plexus|ganglion/.test(n)) return 'part of the nervous system — it carries signals rather than producing force'
  if (/artery|arteria|aorta/.test(n)) return 'an artery — it carries blood away from the heart, under pressure'
  if (/vein|vena/.test(n)) return 'a vein — it returns blood towards the heart, at low pressure, and usually has valves'
  if (/bone|vertebra|rib|costa|femur|humerus|tibia|fibula|ulna|radius|scapula|clavicle|sternum/.test(n)) return 'a bone — structural support, a lever for muscles, and a store of calcium'
  if (/cartilage/.test(n)) return 'cartilage — it bears load and lets surfaces glide, and it has almost no blood supply, which is why it heals poorly'
  if (/tendon/.test(n)) return 'a tendon — it transmits muscle force to bone and stores elastic energy'
  if (/ligament/.test(n)) return 'a ligament — it joins bone to bone and limits how far a joint can travel'
  if (/node|lymph/.test(n)) return 'part of the lymphatic system — it filters tissue fluid and hosts the immune response'
  if (/gland/.test(n)) return 'a gland — it secretes, either into a duct or directly into the blood'
  if (/lung|lobe|pleura|bronch|trachea|alveol/.test(n)) return 'part of the respiratory tract — it conducts air or forms a gas-exchange surface'
  if (/diaphragm/.test(n)) return 'the diaphragm — the main muscle of quiet breathing'
  if (/heart|atrium|ventricle|myocardium/.test(n)) return 'part of the heart — it moves blood through the circulation'
  if (/kidney|renal|liver|hepat|spleen|pancrea|stomach|gastric|intestin|colon|oesophag|esophag/.test(n)) return 'a visceral organ — it lies in a body cavity and is named for that organ'
  return 'an anatomical structure in the human body'
}
