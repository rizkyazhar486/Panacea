import { broadcastHealthUpdate } from './profile'

export interface BodyCharacterProfile {
  bodyType?: string
  bodyAssessment?: string
  postureSummary?: string
  postureScore?: number
  updatedAt?: string
}

const KEY = 'pmd_body_character'

export function getBodyCharacter(): BodyCharacterProfile {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || '{}') as BodyCharacterProfile
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export function saveBodyCharacter(patch: Partial<BodyCharacterProfile>): BodyCharacterProfile {
  const clean: BodyCharacterProfile = { ...getBodyCharacter() }
  if (typeof patch.bodyType === 'string' && patch.bodyType.trim()) clean.bodyType = patch.bodyType.trim().slice(0, 120)
  if (typeof patch.bodyAssessment === 'string' && patch.bodyAssessment.trim()) clean.bodyAssessment = patch.bodyAssessment.trim().slice(0, 800)
  if (typeof patch.postureSummary === 'string' && patch.postureSummary.trim()) clean.postureSummary = patch.postureSummary.trim().slice(0, 800)
  if (typeof patch.postureScore === 'number' && Number.isFinite(patch.postureScore)) clean.postureScore = Math.max(0, Math.min(100, patch.postureScore))
  clean.updatedAt = new Date().toISOString()
  try { localStorage.setItem(KEY, JSON.stringify(clean)) } catch { /* local quota */ }
  broadcastHealthUpdate(['profile'], 'body-character')
  try { window.dispatchEvent(new Event('panacea:body-character-updated')) } catch { /* SSR/test */ }
  return clean
}

export function characterShape(bodyType?: string): 'slim' | 'balanced' | 'athletic' | 'broad' | 'curvy' {
  const text = (bodyType ?? '').toLowerCase()
  if (/ecto|slim|lean|thin/.test(text)) return 'slim'
  if (/meso|athlet|muscular/.test(text)) return 'athletic'
  if (/endo|broad|stocky/.test(text)) return 'broad'
  if (/curvy|pear|hourglass/.test(text)) return 'curvy'
  return 'balanced'
}
