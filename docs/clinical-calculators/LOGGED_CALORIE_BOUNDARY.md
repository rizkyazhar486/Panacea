# Logged-calorie display boundary

The home widget compares logged food calories with logged exercise calories, not energy balance or total energy expenditure. Preserve this limitation and all existing units; no new clinical formula or threshold is introduced.

Only explicit finite, nonnegative numeric values contribute. An explicit zero remains a recorded zero. Missing, wrong-type, negative or nonfinite values are counted as unavailable, never converted to observations. A known sum with unavailable records is labelled a partial logged subtotal. No records says “Not logged”; records without usable calories say “Calories unavailable”. Finite inputs whose sum overflows say “Total unavailable”. Unknown totals have no quantitative bar.

Food date-only records and workout timestamps are grouped by the user's local calendar day. The original UTC grouping omitted Jakarta's current local-date food records after UTC midnight boundaries. Unit fixtures also cover Los Angeles, explicit zero, missing values, mixed partial logs, 1,001 paired totals and overflow. The actual built 390×844 Chromium fixture uses synthetic scoped workout history and verifies visible zero, unavailable/partial labels, local grouping and no runtime errors or horizontal overflow. The old built widget fails the zero-record scenario because it hides the entire widget.

This does not establish source accuracy, clinical validation, complete dietary logging, account isolation for all food caches, or duration provenance. C2 remains incomplete until the remaining duration consumers and ambiguous upstream historical defaults are addressed. No clinical approval is claimed.
