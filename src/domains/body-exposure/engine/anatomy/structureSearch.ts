import { ORGAN_FACT_REGISTRY, type OrganFactCandidate } from "./organFactIndex.ts";
import { tBodyExposure, type SupportedLocale } from "../../../../locales/bodyExposureLocales.ts";

export interface StructureSearchResult {
  readonly query: string;
  readonly matches: readonly OrganFactCandidate[];
  readonly emptyStateMessage: string | null;
}

export function searchStructures(query: string, locale: SupportedLocale = "en"): StructureSearchResult {
  const dict = tBodyExposure(locale);
  const cleaned = typeof query === "string" ? query.trim().toLowerCase() : "";
  if (!cleaned) {
    return { query: "", matches: [], emptyStateMessage: dict.searchEmptyState };
  }
  const matches = ORGAN_FACT_REGISTRY.filter((cand) => {
    const loc = dict.structures[cand.sourceMeshName];
    const hay = [
      cand.sourceMeshName,
      cand.fmaId,
      cand.uberonId,
      cand.regionId,
      cand.layerId,
      loc ? loc.canonicalNameEn : "",
      loc ? loc.localizedName : ""
    ].join(" ").toLowerCase();
    return hay.includes(cleaned);
  });
  return {
    query: cleaned,
    matches,
    emptyStateMessage: matches.length === 0 ? dict.searchEmptyState : null
  };
}