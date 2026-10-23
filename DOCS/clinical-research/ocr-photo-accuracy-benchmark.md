# Original-photo OCR accuracy audit

## Purpose

Panacea already uses server-side vision to draft text from photographed laboratory reports. This audit layer measures how faithfully that OCR draft matches a **human-verified transcription of the same original photo**. It does not treat provider confidence as accuracy and it does not authorize automatic clinical ingestion.

## Metrics

For a human reference transcription with (N) reference items:

[
CER = \frac{S + D + I}{N_{char}}
]

[
WER = \frac{S + D + I}{N_{word}}
]

where (S) is substitutions, (D) deletions, and (I) insertions under Levenshtein edit distance.

For display only:

[
Accuracy = \max(0, 1 - ErrorRate)
]

The implementation also calculates **numeric-token accuracy**, using the same edit-distance formulation over ordered numeric tokens. This is important for clinical documents because a single wrong digit can be more consequential than several typographic errors elsewhere.

Numeric tokens retain Unicode numeric glyphs, superscripts, signs and separators without conversion. This is a text-agreement measure, not semantic validation of measurements or units. When the human reference has no numeric tokens, the numeric metric is unassessed (N/A); CER/WER still detect invented numeric text. An empty human reference is rejected.

The local interactive audit rejects input longer than 16,384 UTF-16 code units or a character comparison exceeding 1,000,000 edit-distance cells. These are engineering work limits, not clinical or accuracy thresholds. Oversized comparisons show an unavailable message with no partial or truncated score; larger benchmark datasets require a separately bounded offline runner.

## Benchmark protocol for real photos

1. Use original, de-identified or appropriately consented report photos covering different devices, lighting, skew, blur, table density, decimal separators, units, and Indonesian/English labels.
2. Produce a human-verified reference transcription from each exact photo. Do not correct or normalize the source values beyond whitespace.
3. Run the existing OCR/vision path without manual editing.
4. Compare the raw OCR draft with the reference using CER, WER, and numeric-token error rate.
5. Stratify results by capture quality and document source. Report sample count and confidence intervals rather than one undifferentiated headline number.
6. Keep automatic clinical commit disabled. The current import flow remains confirm-before-save and fail-closed on unreadable/mismatched units.

## Initial acceptance policy

Do **not** claim a production accuracy percentage until a representative original-photo benchmark exists. The first dataset establishes the baseline. A later release threshold must be set from that evidence and should include a stricter critical-numeric gate than the general text gate.

For any workflow that could automatically commit clinical values, the safe target is exact agreement on every accepted critical numeric field or an explicit human verification step. Aggregate CER/WER alone is insufficient for clinical acceptance.

## Scope

This slice adds deterministic measurement and a local ground-truth audit UI to the existing lab-photo OCR path. It does not add a new OCR provider, alter patient state, bypass user confirmation, or modify Body Exposure.

## References

- Levenshtein VI. Binary codes capable of correcting deletions, insertions, and reversals. *Soviet Physics Doklady*. 1966;10(8):707-710.
- Smith R. An Overview of the Tesseract OCR Engine. *Ninth International Conference on Document Analysis and Recognition (ICDAR 2007)*. 2007:629-633. doi:10.1109/ICDAR.2007.4376991.
