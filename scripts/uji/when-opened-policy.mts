import assert from 'node:assert/strict'
import { mountsAtOnce } from '../../src/shared/ui/whenOpenedPolicy.ts'

// positif: tanpa <details> atau <details> sudah terbuka → pasang seketika
assert.equal(mountsAtOnce(null), true, 'luar <details> dipasang seketika')
assert.equal(mountsAtOnce({ open: true }), true, 'details terbuka (folds=open) dipasang seketika')
// negatif: details tertutup → ditunda, tanpa efek samping pada objek
const tertutup = Object.freeze({ open: false })
assert.equal(mountsAtOnce(tertutup), false, 'details tertutup menunda pemasangan')
// berpasangan: hanya `open` yang membedakan
assert.notEqual(mountsAtOnce({ open: true }), mountsAtOnce({ open: false }))
// determinisme
assert.equal(mountsAtOnce(tertutup), mountsAtOnce(tertutup))
console.log('when-opened-policy: OK')
