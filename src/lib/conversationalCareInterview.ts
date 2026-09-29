import {
  buildDailyInterview,
  submitDailyAnamnesis,
  type CareAnswerValue,
  type ContinuousCarePlan,
  type DailyAnamnesisAnswer,
} from './continuousCareOperatingSystem.ts'

export interface ConversationalCarePromptProposal {
  planId: string
  planVersion: string
  questionnaireId: string
  questionId: string
  /** AI-generated wording only. Clinical semantics stay in the source question. */
  displayPrompt: string
}

export interface ConversationalCareTurn {
  planId: string
  planVersion: string
  questionnaireId: string
  subjectId: string
  scheduledFor: string
  questionId: string
  sourcePrompt: string
  displayPrompt: string
  kind: 'boolean' | 'number' | 'text' | 'choice'
  required: boolean
  unit?: string
  choices?: readonly string[]
  sourceRef: string
  wordingSource: 'questionnaire' | 'ai-draft'
}

export interface SourceLinkedCareAnswer extends DailyAnamnesisAnswer {
  sourceRef: string
  sourcePrompt: string
  planVersion: string
  questionnaireId: string
}

function nonBlank(value: string, field: string) {
  const normalized = value.trim()
  if (!normalized) throw new Error(`${field} must not be blank`)
  return normalized
}

function sourceRef(plan: ContinuousCarePlan, questionId: string) {
  return `Questionnaire/${plan.questionnaireId}|${plan.version}#${questionId}`
}

function answeredIds(answers: readonly DailyAnamnesisAnswer[]) {
  return new Set(answers.map((answer) => answer.questionId))
}

/**
 * Selects exactly one currently-visible Questionnaire question.
 *
 * A model may propose different wording and a sequence choice, but the returned
 * answer schema, requiredness, units and choices always come from the versioned
 * clinician-owned plan. Unknown/stale/hidden questions fail closed.
 */
export function buildConstrainedConversationalTurn(
  plan: ContinuousCarePlan,
  scheduledFor: string,
  answers: readonly DailyAnamnesisAnswer[],
  proposal?: ConversationalCarePromptProposal,
): ConversationalCareTurn | null {
  const interview = buildDailyInterview(plan, scheduledFor, answers)
  const done = answeredIds(answers)
  const unanswered = interview.questions.filter((question) => !done.has(question.id))
  if (!unanswered.length) return null

  let question = unanswered.find((candidate) => candidate.required) ?? unanswered[0]
  let displayPrompt = question.prompt
  let wordingSource: ConversationalCareTurn['wordingSource'] = 'questionnaire'

  if (proposal) {
    if (proposal.planId !== plan.id) throw new Error('AI proposal planId does not match active plan')
    if (proposal.planVersion !== plan.version) throw new Error('AI proposal planVersion does not match active plan')
    if (proposal.questionnaireId !== plan.questionnaireId) throw new Error('AI proposal questionnaireId does not match active plan')
    const proposed = unanswered.find((candidate) => candidate.id === proposal.questionId)
    if (!proposed) throw new Error('AI proposal references a hidden, answered, or unknown question')
    const wording = nonBlank(proposal.displayPrompt, 'AI displayPrompt')
    if (wording.length > 600) throw new Error('AI displayPrompt exceeds 600 characters')
    question = proposed
    displayPrompt = wording
    wordingSource = 'ai-draft'
  }

  return Object.freeze({
    planId: plan.id,
    planVersion: plan.version,
    questionnaireId: plan.questionnaireId,
    subjectId: plan.subjectId,
    scheduledFor,
    questionId: question.id,
    sourcePrompt: question.prompt,
    displayPrompt,
    kind: question.kind,
    required: question.required,
    unit: question.unit,
    choices: question.choices ? [...question.choices] : undefined,
    sourceRef: sourceRef(plan, question.id),
    wordingSource,
  })
}

/**
 * Accept one answer through the same typed Questionnaire validation as the
 * standard form. A conversational layer cannot create new answer types or
 * bypass the source plan.
 */
export function acceptConstrainedConversationalAnswer(
  plan: ContinuousCarePlan,
  turn: ConversationalCareTurn,
  value: CareAnswerValue,
  existing: readonly DailyAnamnesisAnswer[],
  authoredAt: string,
): { answers: DailyAnamnesisAnswer[]; accepted: SourceLinkedCareAnswer } {
  if (turn.planId !== plan.id || turn.planVersion !== plan.version || turn.questionnaireId !== plan.questionnaireId) {
    throw new Error('conversation turn does not match the active care plan')
  }
  const question = plan.questions.find((candidate) => candidate.id === turn.questionId)
  if (!question || question.prompt !== turn.sourcePrompt) throw new Error('conversation turn source question drifted')

  const merged = [
    ...existing.filter((answer) => answer.questionId !== turn.questionId),
    { questionId: turn.questionId, value },
  ]

  // The canonical submit validator enforces question existence, answer type and
  // choice membership. Missing other required questions is allowed mid-dialogue.
  submitDailyAnamnesis(plan, {
    id: `conversation-validation:${turn.questionId}`,
    planId: plan.id,
    planVersion: plan.version,
    subjectId: plan.subjectId,
    scheduledFor: turn.scheduledFor,
    authoredAt,
    answers: merged,
  })

  return {
    answers: merged,
    accepted: {
      questionId: turn.questionId,
      value,
      sourceRef: turn.sourceRef,
      sourcePrompt: turn.sourcePrompt,
      planVersion: plan.version,
      questionnaireId: plan.questionnaireId,
    },
  }
}

/**
 * Deterministic patient-reported draft only. No diagnosis, inference, threshold
 * interpretation or treatment recommendation is generated here.
 */
export function draftSourceLinkedAnamnesis(
  plan: ContinuousCarePlan,
  answers: readonly DailyAnamnesisAnswer[],
): { text: string; sources: string[]; clinicianReviewRequired: true } {
  const rows = answers.flatMap((answer) => {
    const question = plan.questions.find((candidate) => candidate.id === answer.questionId)
    if (!question) return []
    const value = typeof answer.value === 'boolean' ? (answer.value ? 'Yes' : 'No') : String(answer.value)
    return [{
      text: `${question.prompt}: ${value}`,
      source: sourceRef(plan, question.id),
    }]
  })

  return Object.freeze({
    text: rows.length
      ? `Patient-reported draft — clinician verification required. ${rows.map((row) => row.text).join(' · ')}`
      : 'Patient-reported draft — no answers recorded yet; clinician verification required.',
    sources: rows.map((row) => row.source),
    clinicianReviewRequired: true as const,
  })
}

export const CONVERSATIONAL_CARE_SAFETY_CONTRACT =
  'AI may change wording and sequence only among visible questions in the exact active Questionnaire version. Requiredness, answer type, choices, clinical rules and thresholds remain clinician-owned; all summaries are patient-reported drafts requiring clinician verification.'
