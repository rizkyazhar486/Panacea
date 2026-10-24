# Production rollback (ENG-E7-03)

`scripts/qa/rollback-plan.mjs` is a **dry-run**. It resolves a target commit to the production deployment that was built from it and prints the Vercel command. It never runs that command and has no execute mode: a real rollback stays an infra-owner action.

```
node scripts/qa/rollback-plan.mjs --target <40-hex sha> --evidence <vercel-release-evidence.json | dir> \
  [--main-ref origin/main] [--current <sha>] [--repo <dir>]
```

Evidence is the `vercel-release-evidence` artifact of the Vercel Prebuilt Production workflow (retention 30 days).

It refuses, with exit code 1 and a named code, when:

| code | meaning |
|---|---|
| `invalid-target-sha` / `invalid-current-sha` | not a full 40-character lowercase hex SHA |
| `target-is-current` | the target is already the deployed commit |
| `target-not-on-main` | not an ancestor of main, or git cannot say |
| `no-release-evidence` | no evidence names the commit (older than the 30-day artifact retention, or never built) |
| `evidence-not-verified` | evidence exists but none has status `DEPLOYED_SMOKE_VERIFIED` |
| `ambiguous-deployment` | verified evidence names more than one deployment URL |
| `deployment-url-invalid` | the URL is not `https://*.vercel.app` |
| `bad-arguments` / `evidence-unreadable` | the invocation or the evidence file is unusable |

On success it prints the deployment URL and `vercel rollback <url> --scope=panaceamed`, marked `NOT EXECUTED`.

## Limits

- It proves the target resolves to a smoke-verified deployment; it does not prove the old deployment still serves, or that its API is compatible with the current backend or data.
- The Vercel alias move itself, any database or backend change, and the decision to roll back are not covered. Run the printed command only as the infra owner.
- A target whose evidence artifact expired is refused rather than guessed.
