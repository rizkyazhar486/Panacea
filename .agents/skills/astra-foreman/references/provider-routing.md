# Provider routing

Use this reference only when an external Foreman runtime or CLI worker router is available in the target environment.

Prefer subscription-backed workers before paid API fallback:

1. Claude Code using subscription authentication.
2. Codex CLI using ChatGPT subscription authentication.
3. Grok CLI using subscription authentication.
4. OpenRouter as an explicitly enabled paid fallback.

Treat this as external CLI routing, not a model-selection instruction for built-in agents. Check installed commands, supported options, authentication, and provider availability before invocation. Skip unavailable routes. Fail over only for provider, quota, authentication, or startup failures after reconciling interrupted work. A test failure, incorrect implementation, safety refusal, or unresolved design problem requires diagnosis.

Keep the Foreman runtime independent of every application repository. Do not require any particular product, service, framework, project layout, or governance system. Read and follow the target repository's own instructions.

For OpenRouter, require explicit enablement through `FOREMAN_OPENROUTER_ENABLED=1`. Preserve the $2/day hard live-spend cap, model allowlist and freshness checks, spend logging, paid-use visibility, and isolated worker configuration. Verify runtime enforcement and current budget state before paid execution. Missing credentials, budget enforcement, or budget state must block the paid route. Never print credentials, put them in prompts, or raise the cap. Credit alone does not authorize paid use.

Use the current Foreman lock mechanism when available. If a lock is held or ownership is uncertain, inspect status and preserve work. Do not unlock based only on age. Confirm the owner stopped before recovering a stale lock.

Loading this skill does not install or start the Foreman runtime. Do not change account settings, install providers, initiate login, or start background automation unless the user requested that work.
