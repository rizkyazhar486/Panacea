const {
  DEFAULT_ASSISTIVE_PREFERENCES,
  normalizeAssistivePreferences,
  registeredContextActionIds,
  clampAssistivePosition,
  snapAssistivePosition,
} = await import('../../src/lib/interaction/assistive.ts')

const { KATALOG_AKSI } = await import('../../src/lib/aksiFab.ts')
const chk = (name: string, condition: boolean, detail = '') => console.log(condition ? 'PASS' : 'FAIL', name, detail)

const fallback = normalizeAssistivePreferences(null)
chk('null preference falls back to defaults', fallback.size === DEFAULT_ASSISTIVE_PREFERENCES.size && fallback.gestures.singleTap === 'menu')

const invalid = normalizeAssistivePreferences({
  size: 999,
  idleOpacity: -4,
  menuActionIds: ['missing'],
  gestures: { swipeRight: 'not-a-real-action' },
})
chk('assistive size is bounded', invalid.size === 76)
chk('assistive idle opacity is bounded', invalid.idleOpacity === 0.42)
chk('invalid menu restores at least four defaults', invalid.menuActionIds.length >= 4)
chk('unknown gesture action falls back safely', invalid.gestures.swipeRight === DEFAULT_ASSISTIVE_PREFERENCES.gestures.swipeRight)

const registered = new Set(KATALOG_AKSI.map((a: { id: string }) => a.id))
for (const route of ['/', '/tubuh', '/fitness-hub?view=training', '/clinical-hub', '/?t=for-you', '/body-explorer']) {
  const ids = registeredContextActionIds(route)
  chk(`route context only exposes registered actions: ${route}`, ids.length > 0 && ids.every((id: string) => registered.has(id)))
}

const clamped = clampAssistivePosition({ x: -100, y: 9999 }, { width: 390, height: 844, topInset: 20, bottomInset: 12 }, 60)
chk('position respects left safe bound', clamped.x >= 12)
chk('position respects top safe bound', clamped.y >= 32)
chk('position respects bottom safe bound', clamped.y <= 844 - 60 - 12 - 12)

const snapped = snapAssistivePosition({ x: 200, y: 300 }, { width: 390, height: 844 }, 60)
chk('snap chooses a horizontal edge', snapped.x === 12 || snapped.x === 390 - 60 - 12)
