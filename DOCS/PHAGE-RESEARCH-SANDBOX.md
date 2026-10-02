# Phage Research Sandbox

Panaceamed OS supports research analysis and non-executable simulation for bacteriophage work without turning Genome Lab into a synthesis pipeline.

## First slice

The sandbox lives inside the existing Genome Lab route and supports:

- completed campaign analysis;
- assembly, viability, overall-yield and off-target no-growth summaries;
- 95% Wilson intervals for observed viability;
- dimensionless abstract scenario sensitivity;
- provenance, uncertainty and biosafety review.

It deliberately does not expose nucleotide sequences, gene or protein design, culture conditions, MOI, wet-lab construction steps, synthesis export, host-range expansion, pathogenicity optimization, or clinically important antimicrobial-resistance engineering.

## Statistical formulas

```
assembly_rate = assembled / designed
viability_rate = viable / assembled
overall_yield = viable / designed
off_target_no_growth = 1 - (off_target_growth / off_target_hosts_tested)
```

Viability uncertainty uses a two-sided 95% Wilson score interval.

## Non-executable simulation

The virtual candidate accepts only four dimensionless 0..1 teaching variables: target selectivity, evidence coverage, environmental robustness, and novelty pressure.

These variables intentionally have no mapping to nucleotide bases, genes, proteins, laboratory parameters or synthesis instructions. The output is a digital hypothesis only.

## Biosafety governance

Real recombinant or synthetic nucleic-acid work requires protocol-driven risk assessment and the applicable institutional and jurisdictional oversight. Public reference points include the NIH Guidelines for Research Involving Recombinant or Synthetic Nucleic Acid Molecules and the CDC/NIH BMBL 6th edition.
