# Clinical Evidence Operating System

Panaceamed must distinguish **implemented**, **instrumented**, **under prospective study**, and **clinically validated**. A working feature, green software test, attractive UI, or plausible medical logic is not clinical validation.

The machine-readable source of truth is:

`governance/clinical-evidence-registry.json`

and CI enforcement is:

`scripts/qa/clinical-evidence-gate.mjs`

## Required evidence path

```
planned
  ↓
instrumented
  ↓
prospective-study
  ↓
validated
```

A workflow may only enter `validated` when all of the following are present:

1. The predeclared minimum cohort size has been met.
2. The predeclared minimum number of clinicians has participated.
3. Prospective evaluation has occurred.
4. Clinician review is part of the workflow.
5. A primary usefulness metric is recorded.
6. At least one explicit safety metric is recorded.
7. Provenance is mandatory and FHIR Provenance is declared in the data contract.
8. An analysis date exists.
9. An inspectable evidence artifact is linked.

CI fails if a workflow claims `validated` without those requirements.

## Initial priority workflows

### 1. Lab → longitudinal baseline → biological-age trajectory

Primary measure:
```
complete_baseline_rate = users_with_required_baseline_markers / eligible_users
```

Safety measure:
```
incorrect_unit_or_value_accepted_rate = incorrectly_accepted_values / submitted_values
```

This workflow should measure whether Panaceamed reliably converts real laboratory data into a usable longitudinal baseline, not merely whether the UI stores values.

### 2. Daily anamnesis → longitudinal signal → clinician review

Primary measure:
```
clinically_actionable_signal_precision =
clinician_confirmed_actionable_signals / all_signals_shown_to_clinicians
```

Safety measure:
```
unsafe_autonomous_action_rate =
unsafe_actions_executed_without_clinician_confirmation / all_clinical_actions
```

The expected safe target for autonomous unsafe actions is zero.

### 3. AI draft → clinician edit/sign-off → final EMR

Primary measure:
```
median_documentation_time_saved =
median(manual_documentation_time - panaceamed_assisted_documentation_time)
```

Safety measure:
```
major_clinical_error_escape_rate =
major_errors_remaining_after_signoff / reviewed_encounters
```

The study must report edit distance/correction burden as supporting evidence so time savings are not achieved by silently shifting error-checking work onto clinicians.

### 4. Body Exposure → localization → comprehension/action

Primary measure:
```
localization_task_accuracy =
correct_clinical_localizations / attempted_localization_tasks
```

Safety measure:
```
misleading_anatomy_or_overlay_rate =
clinician_flagged_misleading_visualizations / reviewed_visualizations
```

Body Exposure is considered clinically useful only when it improves localization, comprehension, or workflow performance in measured tasks. Visual impressiveness alone is not evidence.

## Evidence hierarchy

Software QA and unit tests prove implementation behavior. They do **not** prove clinical benefit.

The preferred maturity sequence is:

```
software correctness
→ retrospective clinical review
→ prospective shadow-mode evaluation
→ clinician-in-the-loop prospective use
→ measured workflow benefit + safety
→ external/multisite validation where appropriate
```

No stage should be skipped merely to accelerate a marketing claim.

## Change rule

Any new high-impact clinical workflow should receive an entry in the clinical evidence registry before it is described as validated. Metrics should be defined before prospective data collection whenever practical to reduce post-hoc metric selection.
