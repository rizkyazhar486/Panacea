export type CanonicalAnatomicalRegionId = "head_neck" | "thorax" | "abdomen" | "pelvis" | "upper_limb" | "lower_limb";

export const ATLAS_REGION_NAMES: Readonly<Record<CanonicalAnatomicalRegionId, { readonly en: string; readonly id: string }>> = {
  head_neck: { en: "Head & Neck", id: "Kepala & Leher" },
  thorax: { en: "Thorax", id: "Toraks (Dada)" },
  abdomen: { en: "Abdomen", id: "Abdomen (Perut)" },
  pelvis: { en: "Pelvis", id: "Pelvis (Panggul)" },
  upper_limb: { en: "Upper Extremity", id: "Ekstremitas Atas" },
  lower_limb: { en: "Lower Extremity", id: "Ekstremitas Bawah" }
};
export function atlasRegionNames(regionId: CanonicalAnatomicalRegionId, locale: "en" | "id" = "en"): string {
  const entry = ATLAS_REGION_NAMES[regionId];
  if (!entry) throw new RangeError("Unknown anatomical region ID: " + regionId);
  return entry[locale] ?? entry.en;
}
export const namaBagianAtlas = atlasRegionNames;