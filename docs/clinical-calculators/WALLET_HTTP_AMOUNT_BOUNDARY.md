# Backend wallet amount boundary

The existing top-up normalization helper is reused by manual top-up requests and withdrawals. Unknown JSON shapes are rejected before coercion: booleans, arrays, objects and empty strings cannot become a numeric amount. Finite ordinary numbers and nonblank numeric strings retain the existing integer-floor behavior. Positive safe PNC and safe PNC × configured-IDR-rate arithmetic are required before storing a request or attempting a withdrawal.

This deliberately preserves the existing backend fractional-input compatibility (25.9 becomes 25); the client demo withdrawal UI separately requires a whole PNC value. It does not establish that every wallet operation follows the same contract.

The extended real-HTTP fixture reproduces `true` being accepted as one PNC by the prior candidate, then checks both routes refuse malformed input with `400 bad_amount`. It uses `JSON.rawJSON('1e999')` under the repository's Node 24 test environment: ordinary `JSON.stringify(Infinity)` would send `null` and would not prove overflow-token handling. Negative cases must leave the manual-request queue empty; the paired valid 25.9 case must store exactly 25 PNC. The HTTP fixture is included in mandatory `server` tests. Unit properties preserve numeric-string and ordinary floor compatibility over 1,000 paired cases.

Tests run against synthetic users and isolated file storage with live payment/disbursement credentials disabled. They are not production-Mongo, bank-transfer, clinical authorization or regulatory evidence. Live deployment revision and other wallet operations remain separate verification requirements.
