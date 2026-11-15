export type CanonicalStructureKind = "skeletal" | "muscular" | "cardiovascular" | "nervous" | "lymphoid" | "visceral" | "surface";

export function structureKindFromName(meshOrStructureName: string): CanonicalStructureKind {
  const lower = (meshOrStructureName || "").toLowerCase();
  if (/bone|femur|tibia|cranium|vertebra|rib|pelvis|skeletal/.test(lower)) return "skeletal";
  if (/muscle|oblique|pectoralis|biceps|quadriceps|diaphragm|tendon/.test(lower)) return "muscular";
  if (/heart|artery|vein|aorta|coronary|myocardium|vena/.test(lower)) return "cardiovascular";
  if (/brain|cortex|nerve|spinal|plexus|oculomotor|tract/.test(lower)) return "nervous";
  if (/lymph|spleen|thymus|node|thoracic_duct/.test(lower)) return "lymphoid";
  if (/skin|epidermis|dermis|surface/.test(lower)) return "surface";
  return "visceral";
}
export const jenisDariNamaStruktur = structureKindFromName;