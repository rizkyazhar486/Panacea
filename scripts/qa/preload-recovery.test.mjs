import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'

const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8')
const script = html.match(/<script data-panacea-preload-recovery>([\s\S]*?)<\/script>/)?.[1]
assert.ok(script, 'inline recovery handler must exist before Vite entry module')
assert.ok(html.indexOf('data-panacea-preload-recovery') < html.indexOf('type="module" src="/src/main.tsx"'))

function simulate({ online = true, previous = null, storageThrows = false, now = 1000000 } = {}) {
  const handlers = new Map()
  const store = new Map()
  if (previous !== null) store.set('pmd-vite-preload-retry-at', String(previous))
  const redirects = []
  const window = {
    location: { href: 'https://www.panaceamed.id/?q=1#/home' ,
      replace(url) { redirects.push(url) } },
    addEventListener(name, fn) { handlers.set(name, fn) },
  }
  const storage = {
    getItem(k) { if (storageThrows) throw new Error('storage disabled'); return store.get(k) ?? null },
    setItem(k, v) { if (storageThrows) throw new Error('storage disabled'); store.set(k, v) },
  }
  runInNewContext(script, { window, navigator: { onLine: online }, sessionStorage: storage, URL, Date: class extends Date { static now() { return now } } })
  const event = { prevented: false, preventDefault() { this.prevented = true } }
  const trigger = () => handlers.get('vite:preloadError')(event)
  return { event, trigger, redirects, store }
}

test('stale Home CSS preload triggers exactly one cache-busted navigation preserving route', () => {
  const s = simulate()
  s.trigger()
  assert.equal(s.event.prevented, true)
  assert.equal(s.redirects.length, 1)
  const url = new URL(s.redirects[0])
  assert.equal(url.searchParams.get('q'), '1')
  assert.equal(url.searchParams.get('_pmd_asset_refresh'), '1000000')
  assert.equal(url.hash, '#/home')
  s.trigger()
  assert.equal(s.redirects.length, 1, 'do not reload twice in same session')
})

test('cooldown prevents repeated reload and leaves original error visible', () => {
  const s = simulate({ previous: 999999 })
  s.trigger()
  assert.equal(s.event.prevented, false)
  assert.deepEqual(s.redirects, [])
})

test('offline preload failures never trigger reload loops', () => {
  const s = simulate({ online: false })
  s.trigger()
  assert.equal(s.event.prevented, false)
  assert.deepEqual(s.redirects, [])
})

test('unavailable session storage fails safely without reload', () => {
  const s = simulate({ storageThrows: true })
  s.trigger()
  assert.equal(s.event.prevented, false)
  assert.deepEqual(s.redirects, [])
})

test('recovery is allowed again after cooldown', () => {
  const s = simulate({ previous: 1000000 - 300001 })
  s.trigger()
  assert.equal(s.event.prevented, true)
  assert.equal(s.redirects.length, 1)
})
