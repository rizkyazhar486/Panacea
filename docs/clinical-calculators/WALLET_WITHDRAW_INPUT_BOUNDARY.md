# Demo wallet withdrawal input boundary

This closes the Billing entry in the C2 blank-to-zero inventory. It is a financial input repair, not a clinical calculation or authorization.

The amount begins empty and retains the browser's raw string until submission. `parseWithdrawAmount` accepts a positive safe whole number of PNC and rejects blank, zero, negative, fractional, nonfinite, unsafe and unsupported values. The StoreProvider repeats validation before its demo ledger mutation. An explicit zero is meaningful input but cannot represent a positive withdrawal.

`scripts/uji/wallet-withdraw-amount.mts` exercises the boundaries and 1,000 paired whole/fractional inputs. `scripts/qa/wallet-withdraw-smoke.mjs` uses the actual built Billing page, a synthetic account and a 100-PNC demo balance at 390 × 844. Refused amounts and insufficient balance must leave both balance and transactions unchanged; a valid 25-PNC entry must produce one -25 transaction and a 75-PNC balance. A previous built version fails the initially-empty field assertion because it displays a default 10.

These are client-demo checks. They do not prove bank disbursement, server wallet authorization, concurrent transaction correctness, shared-browser privacy or production payment processing. The separate backend wallet HTTP boundary is integrated; `spendPnc` remains independent work. No real transfer is performed by this fixture and no clinical approval is claimed.

The offline action is explicitly a demo debit: its UI and newly created transaction note state that no money was sent and no bank payout was requested. When `VITE_API_URL` configures the server wallet, the demo withdrawal form is absent and the StoreProvider action rejects before any local ledger write. The production-action regression executes both modes; the old action incorrectly wrote once even with the backend enabled. Existing historical transaction notes are not rewritten.
