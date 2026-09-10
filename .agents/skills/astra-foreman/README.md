# Astra Foreman

Astra Foreman is a standalone engineering supervision skill for ChatGPT and Codex. It turns a broad coding request into controlled work, directs available coding workers, checks their output against evidence, and reports whether the result was implemented, verified, merged, or deployed.

It has no dependency on Nova, AEGIS applications, or any particular repository. It reads and follows the instructions of whichever repository it is working in.

## What it does

Astra Foreman:

- inspects the repository, branch, working tree, project instructions, and relevant source before changing code;
- converts the requested outcome into observable acceptance criteria;
- handles work directly, coordinates available coding workers, or produces a complete handoff;
- gives each worker a bounded assignment with owned files, evidence, checks, and return requirements;
- prevents concurrent writers from editing the same checkout;
- reviews diffs, test results, and the original failure before accepting worker claims;
- resumes interrupted work from the actual repository state;
- distinguishes provider failure from an engineering failure;
- follows the target repository's review, documentation, release, and deployment rules;
- reports completion honestly, including remaining limits and blockers.

## How it works

Astra Foreman uses three operating modes:

1. **Execute**  
   It works directly with the source and tools available in the current session.

2. **Coordinate**  
   It divides suitable work between available coding workers. Each worker receives a bounded assignment. Astra retains responsibility for integration and the final decision.

3. **Handoff**  
   If the target machine or coding worker is unavailable, it produces one complete copy-and-paste assignment containing the repository target, evidence, acceptance criteria, scope, checks, authority, and expected return.

The normal workflow is:

```text
Request
  -> inspect repository and instructions
  -> define acceptance criteria
  -> choose Execute, Coordinate, or Handoff
  -> implement or direct workers
  -> inspect changes and test evidence
  -> complete repository requirements
  -> report the exact completion state
```

The main instructions live in [SKILL.md](SKILL.md). The reusable assignment format is in [references/worker-contract.md](references/worker-contract.md). External worker routing rules are in [references/provider-routing.md](references/provider-routing.md).

## Provider routing

When an external Foreman runtime or CLI router is available, the preferred order is:

1. Claude Code through subscription authentication.
2. Codex CLI through ChatGPT subscription authentication.
3. Grok CLI through subscription authentication.
4. OpenRouter as an explicitly enabled paid fallback.

Provider routing is conditional. The skill checks what is actually installed and authorized in the current environment.

OpenRouter requires `FOREMAN_OPENROUTER_ENABLED=1`, working runtime budget enforcement, a model allowlist, freshness checks, spend logging, paid-use visibility, and an isolated worker configuration. The hard live-spend limit is **US$2 per day**. Missing enforcement or budget state blocks the paid route.

Astra Foreman does not silently spend money, install providers, sign in to accounts, start background services, or create machine access.

## Install with Codex Skill Installer

In Codex, invoke the built-in skill installer and give it this repository:

```text
$skill-installer Install Astra Foreman from https://github.com/aegis-systemsv1/Astra-Foreman
```

After installation, invoke it with:

```text
$astra-foreman Fix the failing checkout flow and verify the regression.
```

Codex can also select it automatically when a request clearly involves Foreman-led engineering work.

## Install manually for your user

Codex loads user skills from `~/.agents/skills`.

```bash
mkdir -p "$HOME/.agents/skills"
git clone https://github.com/aegis-systemsv1/Astra-Foreman.git \
  "$HOME/.agents/skills/astra-foreman"
```

To update it later:

```bash
git -C "$HOME/.agents/skills/astra-foreman" pull --ff-only
```

Codex normally detects skill changes automatically. If it does not appear, restart Codex and run `/skills` to check the installed list.

## Install inside one repository

Use this option when Astra Foreman should apply only while Codex is working in a particular repository.

From that repository's root:

```bash
mkdir -p .agents/skills
git subtree add \
  --prefix=.agents/skills/astra-foreman \
  https://github.com/aegis-systemsv1/Astra-Foreman.git main --squash
```

Update the repository-scoped copy with:

```bash
git subtree pull \
  --prefix=.agents/skills/astra-foreman \
  https://github.com/aegis-systemsv1/Astra-Foreman.git main --squash
```

Commit the resulting files to the target repository so the same skill is available to everyone working there.

## Use in ChatGPT

Standalone skills are supported in the ChatGPT desktop app. Open **Skills** from the sidebar, install or select Astra Foreman, then invoke it by name:

```text
@astra-foreman Take this bug from diagnosis through verified completion.
```

For wider distribution across ChatGPT web, desktop, mobile, and Work, the repository can later be packaged as a plugin. This repository currently contains the standalone skill.

## Example requests

```text
$astra-foreman Diagnose this CI failure, implement the fix, and show the evidence.

$astra-foreman Review the worker's handoff and determine whether the feature is actually complete.

$astra-foreman Continue this interrupted task from the current branch without losing existing edits.

$astra-foreman Break this feature into safe worker assignments, integrate the results, and run the required checks.
```

## What the skill does not provide

Astra Foreman is an instruction package. Loading it does not create a standalone executable, background daemon, provider account, API credential, or remote machine connection. It can direct only the tools and workers that the current ChatGPT or Codex environment exposes.

The `$2/day` OpenRouter limit must be enforced by the external Foreman runtime. Written instructions alone cannot enforce a monetary cap.

## Repository structure

```text
Astra-Foreman/
├── SKILL.md
├── agents/
│   └── openai.yaml
├── assets/
│   └── icon.svg
└── references/
    ├── provider-routing.md
    └── worker-contract.md
```

## Requirements

- ChatGPT desktop app, Codex CLI, or Codex IDE extension with skill support.
- Access to the target repository for engineering work.
- Any external coding-worker CLIs you choose to use.
- Existing authentication for those workers.
- Runtime budget enforcement before using the paid OpenRouter fallback.

## Official skill documentation

OpenAI's [Build skills guide](https://learn.chatgpt.com/docs/build-skills) explains skill structure, invocation, discovery, and local install locations.
