import assert from 'node:assert/strict'
import {
  ventilasiMenit, ventilasiAlveolar, fraksiRuangRugi, deretNapasCepatDangkal,
  potensialNernst, gayaDorong, arusMembran, deretArus, ION_RUJUKAN, RENTANG_VM,
} from '../../src/lib/ventilasiMembran.ts'

const dekat = (a: number, b: number, tol = 1e-9) => Math.abs(a - b) <= tol

// ── 1. Ruang rugi dikurangi PER NAPAS ──────────────────────────────────────
{
  assert.ok(dekat(ventilasiMenit(12, 500), 6), 'V̇E 12×500 harus 6 L/menit')
  assert.ok(dekat(ventilasiAlveolar({ rr: 12, vt: 500, vd: 150 }), 4.2), 'V̇A harus 4,2 L/menit')
}

// ── 2. V̇A tepat NOL saat VT sama dengan ruang rugi, dan tak pernah negatif ─
//
// Napas yang lebih kecil dari ruang rugi tidak memventilasi apa pun; ia tidak
// meng-anti-ventilasi. Tanpa penjepitan nol, kurvanya menukik ke bawah sumbu.
{
  assert.equal(ventilasiAlveolar({ rr: 20, vt: 150, vd: 150 }), 0, 'VT = VD harus memberi V̇A tepat nol')
  for (const vt of [10, 50, 100, 149]) {
    const va = ventilasiAlveolar({ rr: 30, vt, vd: 150 })
    assert.equal(va, 0, `VT ${vt} < VD harus nol, dapat ${va}`)
    assert.ok(va >= 0, 'V̇A tidak boleh negatif')
  }
}

// ── 3. Cepat-dangkal: V̇E datar, V̇A runtuh ────────────────────────────────
//
// Inilah seluruh alasan kurva ini digambar. Kalau V̇A tidak monoton turun saat
// laju naik pada V̇E tetap, gambarnya tidak mengajarkan apa pun.
{
  const deret = deretNapasCepatDangkal(6, 150)
  for (const t of deret) assert.ok(dekat(t.menit, 6, 1e-9), `V̇E harus tetap 6; dapat ${t.menit}`)
  for (let i = 1; i < deret.length; i++) {
    assert.ok(deret[i].alveolar <= deret[i - 1].alveolar + 1e-12,
      `V̇A harus turun saat laju naik: ${deret[i - 1].rr}→${deret[i].rr}`)
    assert.ok(deret[i].alveolar >= 0, 'V̇A tidak boleh negatif di sepanjang kurva')
  }
  const lambat = deret.find((t) => t.rr === 10)!
  const cepat = deret.find((t) => t.rr === 40)!
  assert.ok(cepat.alveolar < lambat.alveolar * 0.6,
    `Cepat-dangkal harus meruntuhkan V̇A: ${lambat.alveolar} → ${cepat.alveolar}`)
  // Pada V̇E 6 L/menit dan laju 40, VT = 150 mL = ruang rugi tepat: V̇A = 0.
  assert.equal(cepat.alveolar, 0, 'VT jatuh ke ruang rugi pada laju 40 → V̇A nol')
}

// ── 4. Fraksi ruang rugi ───────────────────────────────────────────────────
{
  assert.ok(dekat(fraksiRuangRugi(500, 150), 0.3), 'VD/VT harus 0,30')
  assert.ok(Number.isNaN(fraksiRuangRugi(0, 150)), 'Tanpa napas fraksi tidak terdefinisi')
}

// ── 5. Nernst harus MENDARAT pada nilai klasik, bukan menghafalnya ─────────
{
  const k = ION_RUJUKAN.find((i) => i.id === 'k')!
  const ek = potensialNernst({ luar: k.luar, dalam: k.dalam, z: k.z, suhuC: 37 })
  assert.ok(ek > -100 && ek < -85, `E_K harus ≈ −90 mV; dapat ${ek.toFixed(1)}`)

  const na = ION_RUJUKAN.find((i) => i.id === 'na')!
  const ena = potensialNernst({ luar: na.luar, dalam: na.dalam, z: na.z, suhuC: 37 })
  assert.ok(ena > 55 && ena < 70, `E_Na harus ≈ +60 mV; dapat ${ena.toFixed(1)}`)

  // Gradien terbalik harus membalik tanda, bukan sekadar menggeser besaran.
  assert.ok(potensialNernst({ luar: 140, dalam: 4, z: 1, suhuC: 37 }) > 0, 'Gradien terbalik harus positif')
  assert.ok(dekat(potensialNernst({ luar: 10, dalam: 10, z: 1, suhuC: 37 }), 0), 'Tanpa gradien E harus nol')
}

// ── 6. Ketergantungan valensi dan suhu ─────────────────────────────────────
{
  // Menggandakan z harus MEMBAGI DUA potensialnya, persis.
  const satu = potensialNernst({ luar: 2, dalam: 0.0001, z: 1, suhuC: 37 })
  const dua = potensialNernst({ luar: 2, dalam: 0.0001, z: 2, suhuC: 37 })
  assert.ok(dekat(dua, satu / 2, 1e-9), `z ganda harus separuh: ${satu} vs ${dua}`)

  // Ion divalen nyata: kalsium harus tetap besar dan positif.
  const ca = ION_RUJUKAN.find((i) => i.id === 'ca')!
  const eca = potensialNernst({ luar: ca.luar, dalam: ca.dalam, z: ca.z, suhuC: 37 })
  assert.ok(eca > 100, `E_Ca harus jauh positif; dapat ${eca.toFixed(1)}`)

  // Valensi negatif membalik tanda.
  const cl = ION_RUJUKAN.find((i) => i.id === 'cl')!
  assert.ok(potensialNernst({ luar: cl.luar, dalam: cl.dalam, z: cl.z, suhuC: 37 }) < 0, 'E_Cl harus negatif')

  // Suhu benar-benar masuk hitungan: rasio harus tepat rasio Kelvin-nya.
  const dingin = potensialNernst({ luar: 4, dalam: 140, z: 1, suhuC: 0 })
  const hangat = potensialNernst({ luar: 4, dalam: 140, z: 1, suhuC: 37 })
  assert.ok(dekat(hangat / dingin, 310.15 / 273.15, 1e-9), 'Skala suhu harus rasio Kelvin')
  assert.ok(Math.abs(hangat) > Math.abs(dingin), 'Lebih hangat harus memberi besaran lebih besar')
}

// ── 7. Kendali NEGATIF: konsentrasi nol atau negatif harus NaN ─────────────
//
// Angka yang tampak masuk akal dari masukan mustahil adalah cacat yang paling
// mahal: tidak ada yang memeriksanya.
for (const buruk of [
  { luar: 0, dalam: 140 }, { luar: 4, dalam: 0 }, { luar: -4, dalam: 140 },
  { luar: 4, dalam: -140 }, { luar: 0, dalam: 0 },
]) {
  const e = potensialNernst({ ...buruk, z: 1, suhuC: 37 })
  assert.ok(Number.isNaN(e), `Konsentrasi ${JSON.stringify(buruk)} harus NaN; dapat ${e}`)
}
assert.ok(Number.isNaN(potensialNernst({ luar: 4, dalam: 140, z: 0, suhuC: 37 })), 'Valensi nol harus NaN')
assert.ok(Number.isNaN(potensialNernst({ luar: 4, dalam: 140, z: 1, suhuC: Number.NaN })), 'Suhu NaN harus NaN')

// ── 8. Arus: tepat nol di Erev, berbalik tanda di kedua sisi ───────────────
{
  const erev = -90
  assert.equal(arusMembran({ g: 10, v: erev, erev }), 0, 'I harus tepat nol di V = Erev')
  assert.ok(arusMembran({ g: 10, v: erev + 10, erev }) > 0, 'Di atas Erev arus harus keluar')
  assert.ok(arusMembran({ g: 10, v: erev - 10, erev }) < 0, 'Di bawah Erev arus harus masuk')
  assert.ok(dekat(gayaDorong(-40, erev), 50), 'Gaya dorong harus V − Erev')

  // Kurva yang digambar harus memotong nol tepat satu kali, di Erev.
  const deret = deretArus(10, erev)
  const nol = deret.filter((t) => t.i === 0)
  assert.equal(nol.length, 1, 'I-V hanya boleh menyentuh nol sekali')
  assert.equal(nol[0].v, erev, 'Perpotongan nol harus tepat di Erev')
  for (const t of deret) {
    assert.equal(Math.sign(t.i), Math.sign(t.v - erev), `Tanda arus salah di V = ${t.v}`)
  }

  // Konduktansi nol: tidak ada arus di mana pun, tetapi tetap angka.
  for (const t of deretArus(0, erev)) assert.equal(t.i, 0, 'g = 0 harus memberi arus nol')
}

// ── 9. Batas penggeser harus memuat keadaan yang diajarkan ────────────────
{
  assert.ok(RENTANG_VM.vt.min <= 150 && RENTANG_VM.vd.maks >= 150,
    'Penggeser harus bisa mencapai VT = VD, keadaan yang jadi pelajarannya')
  assert.ok(RENTANG_VM.v.min <= -90 && RENTANG_VM.v.maks >= 60,
    'Penggeser tegangan harus melewati E_K dan E_Na agar tandanya bisa dibalik')
}

console.log('ventilasi-membran: semua uji lulus')
