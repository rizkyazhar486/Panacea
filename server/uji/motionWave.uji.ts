// Uji bentuk gelombang gerak fisiologis pada model 3D (src/lib/motionWave.ts).
//
// Perhitungannya sengaja dipisahkan dari komponen 3D supaya bisa diuji seperti
// ini. Sifat yang paling penting — bahwa peristaltik MENJALAR satu arah dan
// denyut arteri TERTUNDA menurut jaraknya dari jantung — tidak kelihatan dari
// satu tangkapan layar, dan tidak dapat diperiksa sama sekali di lingkungan
// tanpa GPU. Uji ini yang menangkap arah jalar peristaltik yang semula keliru.
import { gelombangJantung, gelombangNapas, gelombangPeristaltik, gelombangNadi } from '../../src/lib/motionWave.js'
let gagal = 0
const ok = (nama: string, syarat: boolean) => { console.log((syarat ? 'ok   ' : 'GAGAL') + '  ' + nama); if (!syarat) gagal++ }

// Jantung: mengecil saat sistol, kembali >1 saat diastol mengisi.
ok('heart contracts during systole', gelombangJantung(0.16) < 0.96)
ok('heart refills during diastole', gelombangJantung(0.66) > 1.0)
ok('heart returns to baseline each cycle', Math.abs(gelombangJantung(0) - gelombangJantung(1)) < 1e-9)

// Napas: mengembang di inspirasi, mengempis di ekspirasi.
ok('lung expands on inspiration', gelombangNapas(0.4) > gelombangNapas(0))
ok('inspiration shorter than expiration', gelombangNapas(0.2) > gelombangNapas(0.8))

// PERISTALTIK: sifat yang paling penting — gelombangnya MENJALAR.
const t0 = 0.1
const atas = gelombangPeristaltik(t0, 0.0)
const bawah = gelombangPeristaltik(t0, 0.5)
ok('gut segments differ at one instant (wave, not synchronous squeeze)', Math.abs(atas - bawah) > 1e-6)
// Ruas bawah mengalami puncak remasan LEBIH LAMBAT daripada ruas atas.
const puncak = (posisi: number) => {
  let tBaik = 0, nilai = 1
  for (let i = 0; i < 1000; i++) { const t = i / 1000; const v = gelombangPeristaltik(t, posisi); if (v < nilai) { nilai = v; tBaik = t } }
  return tBaik
}
ok('squeeze reaches distal gut later than proximal', puncak(0.6) > puncak(0.0))
ok('most of the gut is relaxed at any instant', [0,0.2,0.4,0.6,0.8].filter(p=>gelombangPeristaltik(0.1,p) > 0.999).length >= 3)

// NADI: arteri jauh berdenyut TERTUNDA dari jantung.
const periode = 60/70
const dada = gelombangNadi(0.05, periode, 0)
const kaki = gelombangNadi(0.05, periode, 0.18)
ok('distal artery pulses later than proximal', Math.abs(dada - kaki) > 1e-6)
const puncakNadi = (jeda: number) => { let tB=0,v=0; for(let i=0;i<2000;i++){const t=i/2000*periode; const x=gelombangNadi(t,periode,jeda); if(x>v){v=x;tB=t}} return tB }
ok('pulse peak is delayed by transit time', puncakNadi(0.18) > puncakNadi(0))
ok('artery returns to baseline between beats', Math.abs(gelombangNadi(periode*0.6, periode, 0) - 1) < 1e-9)

console.log(gagal === 0 ? `\n${11 - gagal} lulus, 0 gagal` : `\n${11 - gagal} lulus, ${gagal} gagal`)
if (gagal > 0) process.exit(1)
