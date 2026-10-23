/** Tiny observable used by `useStoreSelector` in store.tsx to notify selector
 * subscribers without requiring every field change to re-render every
 * `useStore()` consumer. Pulled out as a pure unit so it's testable without a
 * React renderer. */
export function createListenerSet() {
  const listeners = new Set<() => void>()
  return {
    notify: () => listeners.forEach((listener) => listener()),
    subscribe: (listener: () => void): (() => void) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    size: () => listeners.size,
  }
}
