# Panacea variant evidence pipeline

Panacea keeps variant evidence source-labelled and separates evidence retrieval from diagnosis or treatment recommendation.

## Flow

1. FASTA/FASTQ/VCF is parsed locally in the browser.
2. VCF ALT alleles are sent to Ensembl VEP only after explicit user consent and assembly confirmation.
3. Ensembl colocated-variant metadata is used to display returned gnomAD / 1000 Genomes population frequencies when available.
4. NCBI ClinVar evidence is a separate user-triggered lookup through E-utilities. Aggregate classifications, review status, conditions and dates are displayed as upstream database assertions.
5. CPIC `pair_view` is queried using gene symbols returned by VEP to show gene-drug and guideline context. A VCF variant is not automatically converted into a star allele, diplotype, phenotype or dosing recommendation.

## Reliability rules

- Each external request has a timeout and independent error boundary.
- ClinVar ESearch and ESummary calls share a serial request gate with at least 360 ms between request starts; the UI also limits enrichment to five variants per action.
- ClinVar and CPIC results are cached in the browser session so repeated inspection does not repeatedly hit the upstream service.
- CPIC requests are isolated per gene and merged with `Promise.allSettled`, so one failed gene does not erase successful gene-drug context from the others.
- Partial API failure does not hide evidence returned successfully by other sources.
- Population allele frequency is descriptive evidence and is not treated as a pathogenicity formula.
- If an upstream API is unavailable or browser CORS/network policy blocks it, Panacea keeps the local/VEP result visible and shows the source failure instead of fabricating fallback data.

## Sources

- Ensembl REST VEP: https://rest.ensembl.org/
- NCBI ClinVar programmatic access: https://www.ncbi.nlm.nih.gov/clinvar/docs/programmatic_access/
- CPIC REST API: https://api.cpicpgx.org/
- CPIC data source: https://github.com/cpicpgx/cpic-data
