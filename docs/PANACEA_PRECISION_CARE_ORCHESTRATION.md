# Panacea Precision + Care Orchestration

## Objective

Turn the Intelligence OS into an operational care layer without making Panacea financially dependent on overselling tests, scans, consultations or treatments.

The product contract is:

`Health Graph gap → evidence review → information-value review → clinician decision → service → result ingestion → follow-up → outcome measurement`

A paid service should create clinically interpretable information or complete a justified care step, then return measurable outcomes to the longitudinal record.

## Information-value heuristic

The interactive Architecture workbench uses a transparent product-triage heuristic:

`NetInfo = 0.30E + 0.25I + 0.20A + 0.15G + 0.10C − 0.15B − 0.10R`

Where:

- `E` = evidence strength mapped from Panacea evidence tier;
- `I` = expected information contribution;
- `A` = actionability after appropriate review;
- `G` = fit to a real unresolved data gap;
- `C` = cost transparency;
- `B` = patient burden;
- `R` = redundancy with information already available.

All inputs are normalized to 0–100. The output is clamped to 0–100.

This is a Panacea product-planning heuristic, not a validated clinical equation, diagnostic score, medical-necessity rule, payer-coverage rule or authorization to order a test or service.

## Fail-closed governance

- Evidence tier X remains blocked.
- Evidence tier D remains research-only.
- Evidence tier C requires clinician review.
- Patient-specific service selection requires clinician review unless a separately validated and regulated workflow explicitly permits otherwise.
- A high information-value score cannot override an evidence or safety gate.
- Price, margin, engagement or growth targets cannot upgrade an evidence tier.

## Marketplace principle

Panacea should make provider economics visible rather than hiding commercial incentives.

Illustrative sandbox formulas:

`Platform gross = list price × platform rate`

`Provider payout = list price − platform gross`

These values are not production economics. Real launch economics must account for payment processing, tax, refunds, provider contracts, clinical compensation rules, anti-kickback/referral restrictions, consumer protection and local regulation.

## Strategic difference

A conventional longevity marketplace can earn more when a user buys more tests. Panacea should instead optimize for a closed care loop:

- identify what is already known;
- expose uncertainty and missing information;
- avoid redundant testing;
- route clinically meaningful decisions to qualified clinicians;
- track whether the intervention or care plan actually changed the target outcome.

That makes the Health Graph, Evidence Engine, Body Exposure explanation layer, care orchestration and outcome loop mutually reinforcing parts of one operating system.
