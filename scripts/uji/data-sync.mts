import assert from 'node:assert/strict'

class MemoryStorage {
  private data = new Map<string, string>()
  getItem(key: string) { return this.data.get(key) ?? null }
  setItem(key: string, value: string) { this.data.set(key, String(value)) }
  removeItem(key: string) { this.data.delete(key) }
  clear() { this.data.clear() }
}

const storage = new MemoryStorage()
const events: Event[] = []
const listeners = new Map<string, Set<(event: Event) => void>>()

Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true })
Object.defineProperty(globalThis, 'BroadcastChannel', { value: undefined, configurable: true })
Object.defineProperty(globalThis, 'window', {
  value: {
    dispatchEvent(event: Event) {
      events.push(event)
      for (const listener of listeners.get(event.type) ?? []) listener(event)
      return true
    },
    addEventListener(type: string, listener: (event: Event) => void) {
      if (!listeners.has(type)) listeners.set(type, new Set())
      listeners.get(type)!.add(listener)
    },
    removeEventListener(type: string, listener: (event: Event) => void) {
      listeners.get(type)?.delete(listener)
    },
  },
  configurable: true,
})

const { mergeDemoStored, getDemoTersimpan, broadcastHealthUpdate } = await import('../../src/lib/profile.ts')

mergeDemoStored({ restingHr: 54 }, 'test-device')
const stored = getDemoTersimpan()
assert.equal(stored.restingHr, 54)
assert.equal(stored.age, undefined, 'neutral age default must never be persisted by biometric sync')
assert.equal(stored.weightKg, undefined, 'neutral weight default must never be persisted by biometric sync')
assert.equal(stored.heightCm, undefined, 'neutral height default must never be persisted by biometric sync')

mergeDemoStored({ age: 42, weightKg: 81 }, 'test-profile')
const merged = getDemoTersimpan()
assert.equal(merged.age, 42)
assert.equal(merged.weightKg, 81)
assert.equal(merged.restingHr, 54, 'partial sync must preserve already-known good values')

const before = events.length
broadcastHealthUpdate(['workouts', 'health'], 'test-bus')
const emitted = events.slice(before)
assert.ok(emitted.some((event) => event.type === 'panacea:data-updated'), 'structured data event must be emitted')
assert.ok(emitted.some((event) => event.type === 'panacea:health-updated'), 'legacy event must remain compatible')
const structured = emitted.find((event) => event.type === 'panacea:data-updated') as CustomEvent
assert.deepEqual(structured.detail.domains, ['workouts', 'health'])
assert.equal(structured.detail.source, 'test-bus')

console.log('Shared data sync preserves provenance and publishes both structured and legacy update events.')
