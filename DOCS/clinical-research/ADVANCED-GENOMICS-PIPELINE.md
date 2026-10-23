# Panacea advanced genomics source contract

This pipeline keeps raw evidence, upstream analytical tools, curated knowledge bases, and clinical interpretation as separate layers.

## 1. Sequence evidence

Panacea parses FASTA, FASTQ, VCF, and gzip-compressed equivalents locally in the browser. The decoded evidence preview is capped and labelled when sampled. The existing transparent metrics remain sequence/file metrics, not diagnosis.

## 2. Small variants

Small VCF alleles can be submitted to Ensembl VEP only after explicit user consent and genome-assembly confirmation. Symbolic structural alleles and breakends are deliberately excluded from the small-variant VEP path.

## 3. Structural variation / copy number

Panacea retains a dedicated structural-event stream from analyzed VCF evidence and recognizes explicit structural evidence such as `SVTYPE`, `SVLEN`, symbolic ALT alleles, copy-number fields, and breakend notation. `END` by itself is not considered evidence of an SV because gVCF reference blocks commonly use `END`. `<NON_REF>`, `<*>`, and `*` reference/spanning alleles are not interpreted as structural calls.

This is a parser of calls already present in a VCF. Panacea does not perform structural-variant or CNV calling in the browser.

## 4. Pharmacogenomics

Panacea does not invent star alleles or diplotypes from a generic VCF. PharmCAT is the upstream named-allele/phenotype engine. Panacea can import PharmCAT `*.phenotype.json` locally and display its `geneReports`, recommendation diplotypes, phenotype labels, activity score, allele functions, and source version metadata.

Official source:
- https://github.com/PharmGKB/PharmCAT
- https://pharmcat.org/using/running-pharmcat/

Existing CPIC API integration remains a gene-drug/guideline context layer. CPIC pairs are not treated as a patient-specific prescription unless the required upstream PGx call and clinical context exist.

## 5. Somatic cancer evidence

When Ensembl VEP returns a recognizable protein substitution, Panacea can query the CIViC GraphQL API using a gene + protein-variant candidate such as `BRAF V600E`. It displays CIViC molecular-profile evidence items with source status, evidence type, evidence level, direction, disease, therapy, and publication metadata.

If a reliable protein-level candidate cannot be derived, Panacea does not guess a cancer variant from genomic coordinates alone.

Official source:
- https://civicdb.org/api/graphiql
- https://docs.civicdb.org/en/latest/model/evidence.html
- https://github.com/griffithlab/civic-v2

## 6. Oxford Nanopore raw signal

POD5/FAST5 files are inventoried locally. Raw ionic-current signal is not falsely presented as basecalled sequence. Panacea generates an explicit handoff command for Oxford Nanopore Dorado/EPI2ME `wf-basecalling`; model/chemistry compatibility must be selected from the current ONT release.

Official source:
- https://github.com/nanoporetech/dorado
- https://nanoporetech.com/document/epi2me-workflows/wf-basecalling

## Interpretation boundary

The evidence graph is:

`raw/sequence file -> upstream caller/annotator -> source database -> Panacea presentation -> clinician/research interpretation`

Panacea does not collapse those steps into an automatic diagnosis, cancer stage, drug selection, dose, or expected treatment response.
