import assert from 'node:assert/strict'
import { createListenerSet } from '../../src/lib/storeSnapshotScope.ts'

// Positif: listener terdaftar dipanggil tiap notify().
const set = createListenerSet()
let calls = 0
const unsubscribe = set.subscribe(() => { calls += 1 })
set.notify()
set.notify()
assert.equal(calls, 2, 'listener terdaftar harus kepanggil tiap notify()')
assert.equal(set.size(), 1)

// Negatif: listener yang sudah unsubscribe tidak boleh kepanggil lagi.
unsubscribe()
set.notify()
assert.equal(calls, 2, 'listener yang sudah unsubscribe tidak boleh ikut ter-notify')
assert.equal(set.size(), 0)

// Dua listener independen: unsubscribe satu tidak mematikan yang lain.
const setTwo = createListenerSet()
let a = 0
let b = 0
const offA = setTwo.subscribe(() => { a += 1 })
setTwo.subscribe(() => { b += 1 })
offA()
setTwo.notify()
assert.equal(a, 0, 'listener A yang sudah unsubscribe diam')
assert.equal(b, 1, 'listener B yang masih subscribe tetap kepanggil')

console.log('store-snapshot-scope: listener subscribe/notify/unsubscribe berperilaku benar.')
