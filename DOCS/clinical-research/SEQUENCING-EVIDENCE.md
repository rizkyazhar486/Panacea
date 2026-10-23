# Panacea sequencing evidence contract

Panacea treats sequencing files as source evidence, not as decorative DNA animation.

## Local file layer

`SequenceEvidenceWorkbench` reads FASTA, FASTQ and VCF in the browser. Gzip-compressed `.gz` exports are decoded locally when the browser exposes `DecompressionStream`. The component analyzes at most 32 MB of decoded evidence and labels a truncated analysis as a preview.

The component computes a SHA-256 digest of the decoded bytes that were actually analyzed. It does not upload the FASTA/FASTQ/VCF file as part of local parsing.

## Transparent metrics

- FASTA/FASTQ: record count, total bases, mean length, N50, GC%, ambiguous-base percentage.
- FASTQ: mean Phred quality, Q20 and Q30 percentages using Phred+33 decoding.
- VCF: sites, ALT alleles, SNP alleles, indel alleles, PASS/unfiltered sites, sample count and Ti/Tv.

Formulas implemented in `src/lib/sequenceEvidence.ts`:

- `GC% = (G + C) / (A + C + G + T) × 100`.
- `Q = ASCII(character) − 33` for Phred+33 FASTQ quality strings.
- `Q20% = bases with Q >= 20 / quality-coded bases × 100`; Q30 is analogous.
- N50 is the sequence/read length at which lengths sorted descending cumulatively reach at least 50% of analyzed bases.
- `Ti/Tv = transition SNP alleles / transversion SNP alleles` when at least one transversion exists.

## VCF assembly boundary

The parser looks for `##reference=` and VCF metadata containing GRCh37/hg19 or GRCh38/hg38. When it cannot identify the assembly, external consequence annotation remains blocked until the user explicitly chooses one. Panacea does not silently interpret unknown coordinates against GRCh38.

## Ensembl VEP evidence layer

`VariantEvidenceWorkbench` never sends VCF content automatically. The user chooses how many ALT alleles to annotate (maximum 20), confirms GRCh37 or GRCh38, and explicitly checks a consent control explaining that selected locus/ref/alt records will be sent to Ensembl REST.

`src/lib/variantEvidence.ts` then calls Ensembl VEP `POST /vep/homo_sapiens/region` using the current REST service for GRCh38 or the Ensembl GRCh37 archive service for GRCh37. Returned evidence can include most-severe consequence, variant class, gene/transcript consequences, MANE/canonical transcript metadata, HGVS, SIFT/PolyPhen fields when returned, colocated variant IDs and colocated clinical-significance metadata.

VEP consequence terms are not equivalent to an ACMG/AMP pathogenicity classification. Colocated clinical-significance metadata is shown as upstream metadata and can be incomplete or conflicting. Panacea does not turn the response into a diagnosis or treatment recommendation.

## Cell → DNA boundary

Body Exposure now follows:

`HRA source anatomy → Human Protein Atlas / Ensembl reference evidence → local FASTA/FASTQ/VCF evidence → optional consented VEP consequence lookup`.

Generated cell or DNA renderers are not required to use this evidence path and are not presented as microscopy, sequencing output or patient-specific evidence.
