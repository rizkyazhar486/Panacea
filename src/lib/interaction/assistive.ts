import { AKSI_BAWAAN, KATALOG_AKSI } from '../aksiFab'

export type AssistiveSpecialAction = 'menu' | 'customize'
export type AssistiveActionId = string

export interface AssistiveGestureMap {
  singleTap: AssistiveActionId | AssistiveSpecialAction
  doubleTap: AssistiveActionId | AssistiveSpecialAction
  longPress: AssistiveActionId | AssistiveSpecialAction
  swipeUp: AssistiveActionId | AssistiveSpecialAction
  swipeDown: AssistiveActionId | AssistiveSpecialAction
  swipeLeft: AssistiveActionId | AssistiveSpecialAction
  swipeRight: AssistiveActionId | AssistiveSpecialAction
}

export interface AssistivePreferences {
  gestures: AssistiveGestureMap
  menuActionIds: string[]
  size: number
  idleOpacity: number
  snap: boolean
  haptics: boolean
}

export interface AssistivePosition { x: number; y: number }
export interface AssistiveViewport {
  width: number
  height: number
  topInset?: number
  rightInset?: number
  bottomInset?: number
  leftInset?: number
}

const SPECIAL = new Set<AssistiveSpecialAction>(['menu', 'customize'])
const actionIds = () => new Set(KATALOG_AKSI.map((action) => action.id))

export const DEFAULT_ASSISTIVE_PREFERENCES: AssistivePreferences = {
  gestures: {
    singleTap: 'menu',
    doubleTap: 'tanya',
    longPress: 'customize',
    swipeUp: 'cari',
    swipeDown: 'beranda',
    swipeLeft: 'kembali',
    swipeRight: 'pesan',
  },
  menuActionIds: [...AKSI_BAWAAN],
  size: 60,
  idleOpacity: 0.46,
  snap: true,
  haptics: true,
}

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function validAction(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback
  if (SPECIAL.has(value as AssistiveSpecialAction) || actionIds().has(value)) return value
  return fallback
}

export function normalizeAssistivePreferences(value: unknown): AssistivePreferences {
  const source = value && typeof value === 'object' ? value as Partial<AssistivePreferences> : {}
  const gestures = source.gestures && typeof source.gestures === 'object' ? source.gestures as Partial<AssistiveGestureMap> : {}
  const ids = actionIds()
  const rawMenu = Array.isArray(source.menuActionIds) ? source.menuActionIds : DEFAULT_ASSISTIVE_PREFERENCES.menuActionIds
  const menuActionIds = rawMenu
    .filter((id): id is string => typeof id === 'string' && ids.has(id))
    .filter((id, index, list) => list.indexOf(id) === index)
    .slice(0, 12)
  const safeMenu = menuActionIds.length >= 4 ? menuActionIds : [...DEFAULT_ASSISTIVE_PREFERENCES.menuActionIds].slice(0, 12)

  return {
    gestures: {
      singleTap: validAction(gestures.singleTap, DEFAULT_ASSISTIVE_PREFERENCES.gestures.singleTap),
      doubleTap: validAction(gestures.doubleTap, DEFAULT_ASSISTIVE_PREFERENCES.gestures.doubleTap),
      longPress: validAction(gestures.longPress, DEFAULT_ASSISTIVE_PREFERENCES.gestures.longPress),
      swipeUp: validAction(gestures.swipeUp, DEFAULT_ASSISTIVE_PREFERENCES.gestures.swipeUp),
      swipeDown: validAction(gestures.swipeDown, DEFAULT_ASSISTIVE_PREFERENCES.gestures.swipeDown),
      swipeLeft: validAction(gestures.swipeLeft, DEFAULT_ASSISTIVE_PREFERENCES.gestures.swipeLeft),
      swipeRight: validAction(gestures.swipeRight, DEFAULT_ASSISTIVE_PREFERENCES.gestures.swipeRight),
    },
    menuActionIds: safeMenu,
    size: clamp(finiteNumber(source.size, DEFAULT_ASSISTIVE_PREFERENCES.size), 56, 76),
    idleOpacity: clamp(finiteNumber(source.idleOpacity, DEFAULT_ASSISTIVE_PREFERENCES.idleOpacity), 0.42, 1),
    snap: typeof source.snap === 'boolean' ? source.snap : DEFAULT_ASSISTIVE_PREFERENCES.snap,
    haptics: typeof source.haptics === 'boolean' ? source.haptics : DEFAULT_ASSISTIVE_PREFERENCES.haptics,
  }
}

export function contextActionIds(route: string): string[] {
  const normalized = route || '/'
  if (normalized.startsWith('/body-explorer')) return ['tubuh', 'kalkulator', 'belajar']
  if (/^\/(fitness-hub|tubuh|latihan|workout|recovery|nutrition|health-data)/.test(normalized)) return ['tubuh', 'latihan', 'recovery', 'ikhtisar']
  if (/^\/(clinical-hub|med-study|clinical-calculators|drug-info|emr|evidence|radiology)/.test(normalized)) return ['tanya', 'kalkulator', 'obat', 'rekam']
  if (normalized.includes('t=for-you') || /^\/(messages|community|profile|settings|scripture|keuangan)/.test(normalized)) return ['pesan', 'komunitas', 'profil', 'pengaturan']
  return ['tanya', 'catat', 'tubuh', 'kalkulator']
}

export function registeredContextActionIds(route: string): string[] {
  const ids = actionIds()
  return contextActionIds(route).filter((id) => ids.has(id))
}

export function clampAssistivePosition(position: AssistivePosition, viewport: AssistiveViewport, size: number, safeInset = 12): AssistivePosition {
  const top = safeInset + Math.max(0, viewport.topInset ?? 0)
  const left = safeInset + Math.max(0, viewport.leftInset ?? 0)
  const right = Math.max(left, viewport.width - size - safeInset - Math.max(0, viewport.rightInset ?? 0))
  const bottom = Math.max(top, viewport.height - size - safeInset - Math.max(0, viewport.bottomInset ?? 0))
  return {
    x: clamp(finiteNumber(position.x, right), left, right),
    y: clamp(finiteNumber(position.y, bottom), top, bottom),
  }
}

export function snapAssistivePosition(position: AssistivePosition, viewport: AssistiveViewport, size: number, safeInset = 12): AssistivePosition {
  const clamped = clampAssistivePosition(position, viewport, size, safeInset)
  const left = safeInset + Math.max(0, viewport.leftInset ?? 0)
  const right = Math.max(left, viewport.width - size - safeInset - Math.max(0, viewport.rightInset ?? 0))
  return clampAssistivePosition({ x: clamped.x + size / 2 < viewport.width / 2 ? left : right, y: clamped.y }, viewport, size, safeInset)
}
