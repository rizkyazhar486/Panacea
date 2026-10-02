---
name: panacea-medical-evidence-validator
description: Use when adding or reviewing biomedical claims, guideline content, pharmacology, anatomy, physiology, pathology, genomics, diagnostics, or clinical-reference material in Panaceamed.
---

# Panacea Medical Evidence Validator

## Evidence ladder
Prefer the strongest source appropriate to the claim:
1. current authoritative guideline/regulatory source;
2. systematic review/meta-analysis;
3. high-quality primary study;
4. curated biomedical database;
5. expert/reference text;
6. model synthesis only when clearly labeled and grounded.

## Validation
For each material claim capture:
- claim text or structured fact;
- source identifier/URL/DOI/accession;
- publication or database version/date;
- population/context;
- evidence type;
- confidence/limitations;
- last verification date where freshness matters.

## Rules
- Do not cite a source that does not support the exact claim.
- Do not generalize evidence from a different population without saying so.
- Separate correlation, mechanism, diagnostic performance, and treatment effect.
- For drug information preserve dose/context, contraindications, interactions, and regulatory jurisdiction when relevant.
- For anatomy datasets record asset/source license and provenance separately from medical-claim citations.

## Output contract
Clinical UI may stay concise, but provenance must remain retrievable. A compact visible statement may point to a deeper evidence drawer rather than deleting context.