// Uji tekstur jaringan.
//
// Tekstur prosedural adalah tempat kesalahan yang tidak pernah melempar galat:
// pola yang tidak periodik tetap "berhasil" dibuat, lalu memperlihatkan garis
// sambungan di seluruh tubuh; serat yang arahnya tertukar tetap terlihat
// seperti serat, hanya saja melintang. Keduanya hanya bisa ditangkap dengan
// menghitung, bukan dengan melihat sekilas.

import {
  petaTinggi, petaPola, buatTekstur, keterarahan, RESEP,
  type JenisJaringan,
} from '../../src/lib/tissueTexture'

let lulus = 0, gagal = 0
function ok(nama: string, syarat: boolean, ket = '') {
  if (syarat) { lulus++; console.log('ok    ', nama) }
  else { gagal++; console.log('GAGAL ', nama, ket) }
}
const SEMUA: JenisJaringan[] = ['otot', 'tulang', 'organ', 'pembuluh', 'lemak', 'tendon', 'saraf']
const N = 64

// ── Bentuk dasar ────────────────────────────────────────────────────────────
ok('tujuh jenis jaringan punya resep', Object.keys(RESEP).length === 7)
ok('setiap jenis punya pengulangan positif',
  SEMUA.every((j) => RESEP[j].ulangU > 0 && RESEP[j].ulangV > 0))
ok('setiap jenis punya minimal tiga oktaf', SEMUA.every((j) => RESEP[j].oktaf >= 3))
ok('kontras selalu di bawah setengah — tekstur menghias, bukan menguasai',
  SEMUA.every((j) => RESEP[j].kontras > 0 && RESEP[j].kontras < 0.5))

for (const j of SEMUA) {
  const t = petaTinggi(j, N)
  ok(`peta tinggi ${j} berukuran benar`, t.length === N * N)
  ok(`peta tinggi ${j} berada di 0..1`, t.every((v) => v >= -1e-6 && v <= 1 + 1e-6))
  // Normalisasi harus benar-benar merentangkan nilainya; peta yang datar
  // menghasilkan permukaan rata lagi, yaitu persis masalah yang dipecahkan.
  ok(`peta tinggi ${j} memakai rentang penuh`,
    Math.min(...t) < 0.02 && Math.max(...t) > 0.98)
  const rata = t.reduce((a, b) => a + b, 0) / t.length
  ok(`peta tinggi ${j} tidak menumpuk di satu ujung`, rata > 0.25 && rata < 0.75, String(rata.toFixed(3)))
}

// ── Determinisme ────────────────────────────────────────────────────────────
{
  const a = petaTinggi('otot', N, 5), b = petaTinggi('otot', N, 5), c = petaTinggi('otot', N, 6)
  ok('benih sama memberi peta yang sama persis', a.every((v, i) => v === b[i]))
  ok('benih berbeda memberi peta berbeda', a.some((v, i) => v !== c[i]))
}

// ── Periodisitas ────────────────────────────────────────────────────────────
//
// Inilah uji yang paling penting. Triplanar menyusun tekstur berdampingan
// berkali-kali; pola yang tidak menyambung akan memperlihatkan kotak-kotak di
// sekujur tubuh, dan tidak ada parameter bahan yang bisa menyembunyikannya.
for (const j of SEMUA) {
  const t = petaTinggi(j, N)
  let bedaTepi = 0, bedaDalam = 0
  for (let i = 0; i < N; i++) {
    bedaTepi += Math.abs(t[i * N + (N - 1)] - t[i * N + 0])
    bedaTepi += Math.abs(t[(N - 1) * N + i] - t[0 * N + i])
    bedaDalam += Math.abs(t[i * N + Math.floor(N / 2)] - t[i * N + Math.floor(N / 2) + 1])
    bedaDalam += Math.abs(t[Math.floor(N / 2) * N + i] - t[(Math.floor(N / 2) + 1) * N + i])
  }
  // Sambungan ubin tidak boleh lebih menonjol daripada perubahan biasa di
  // tengah tekstur; kalau lebih, garisnya akan terlihat.
  ok(`tekstur ${j} menyambung di tepi ubin`, bedaTepi <= bedaDalam * 1.6,
    `tepi ${bedaTepi.toFixed(1)} vs dalam ${bedaDalam.toFixed(1)}`)
}

// ── Arah serat ──────────────────────────────────────────────────────────────
//
// Otot, tendon, saraf dan pembuluh berserat SEARAH; parenkim organ, tulang dan
// lemak tidak. Kalau arahnya tertukar, ototnya akan bergaris melintang — masih
// terlihat seperti tekstur, tetapi anatominya salah.
{
  const berserat: JenisJaringan[] = ['otot', 'tendon', 'saraf', 'pembuluh']
  const takBerserat: JenisJaringan[] = ['organ', 'tulang', 'lemak']
  // Dirata-ratakan atas beberapa benih: satu realisasi derau acak bisa
  // kebetulan miring ke satu arah, dan yang hendak diuji adalah RESEPNYA,
  // bukan satu keping kebetulan.
  const arahRata = (j: JenisJaringan) =>
    [1, 2, 3, 4].reduce((a, b) => a + keterarahan(petaTinggi(j, N, b), N), 0) / 4
  for (const j of berserat) {
    const k = arahRata(j)
    ok(`${j} berserat searah`, k > 1.5, `keterarahan ${k.toFixed(2)}`)
  }
  for (const j of takBerserat) {
    const k = arahRata(j)
    ok(`${j} tidak berarah`, k > 0.7 && k < 1.4, `keterarahan ${k.toFixed(2)}`)
  }
  ok('otot lebih berserat daripada parenkim organ', arahRata('otot') > arahRata('organ'))
}

// ── Peta pola ───────────────────────────────────────────────────────────────
//
// Uji di bagian ini ditulis ulang setelah satu bug lolos. Versi lamanya
// memeriksa bahwa rata-rata pengali "berada di sekitar satu" dengan toleransi
// 0,93–1,07 — dan tekstur yang RUSAK, yang rata-ratanya 0,97 karena separuh
// nilainya terpotong di 255, lolos dengan mudah. Sifat yang benar untuk diuji
// bukan rata-ratanya, melainkan bahwa nilainya TIDAK TERPOTONG dan tersebar
// memenuhi rentang yang tersedia.
{
  const t = petaTinggi('otot', N)
  const w = petaPola(t, N)
  ok('peta pola berukuran RGBA penuh', w.length === N * N * 4)
  ok('peta pola kelabu — tidak menggeser rona', (() => {
    for (let i = 0; i < N * N; i++) if (w[i * 4] !== w[i * 4 + 1] || w[i * 4 + 1] !== w[i * 4 + 2]) return false
    return true
  })())
  ok('peta pola buram penuh', (() => {
    for (let i = 0; i < N * N; i++) if (w[i * 4 + 3] !== 255) return false
    return true
  })())

  const nilai = Array.from({ length: N * N }, (_, i) => w[i * 4])
  const min = Math.min(...nilai), maks = Math.max(...nilai)
  const rata = nilai.reduce((a, b) => a + b, 0) / nilai.length
  ok('pola memakai hampir seluruh rentang 8-bit', min <= 4 && maks >= 251, `${min}..${maks}`)
  // Inilah uji yang seharusnya ada sejak awal: rata-rata di dekat tengah.
  // Tekstur yang terpotong punya rata-rata 247 dari 255, dan uji ini
  // menangkapnya seketika.
  ok('pola berpusat di tengah rentang, bukan menempel di ujung',
    rata > 100 && rata < 155, String(rata.toFixed(1)))
  // Nilai yang menumpuk tepat di 0 atau 255 adalah tanda pemotongan.
  const diUjung = nilai.filter((v) => v === 0 || v === 255).length / nilai.length
  ok('hampir tidak ada nilai yang terpotong di ujung', diUjung < 0.01,
    `${(diUjung * 100).toFixed(2)}%`)
  // Sebaran harus lebar; tekstur berkontras rendah menghasilkan permukaan
  // yang secara visual tetap rata.
  const sd = Math.sqrt(nilai.reduce((a, b) => a + (b - rata) ** 2, 0) / nilai.length)
  ok('sebaran pola cukup lebar untuk terlihat', sd > 35, `sd ${sd.toFixed(1)}`)
}

// ── Perakitan ───────────────────────────────────────────────────────────────
{
  const t = buatTekstur('otot', 32)
  ok('buatTekstur mengembalikan pola pada ukuran yang diminta',
    t.ukuran === 32 && t.pola.length === 32 * 32 * 4)
  ok('buatTekstur meneruskan amplitudo ke pemanggil',
    t.kontras === RESEP.otot.kontras && t.variasiKasar === RESEP.otot.variasiKasar)
  ok('buatTekstur deterministik', (() => {
    const lagi = buatTekstur('otot', 32)
    return t.pola.every((v, i) => v === lagi.pola[i])
  })())
  // Ukuran besar dipakai di produksi; harus tetap selesai dan tetap benar.
  const besar = buatTekstur('organ', 256)
  ok('ukuran 256 terbentuk penuh', besar.pola.length === 256 * 256 * 4)
  const n = Array.from({ length: 256 * 256 }, (_, i) => besar.pola[i * 4])
  const r = n.reduce((a, b) => a + b, 0) / n.length
  ok('tekstur ukuran produksi juga tidak terpotong', r > 100 && r < 155, String(r.toFixed(1)))
}

// ── Tambalan shader triplanar ───────────────────────────────────────────────
//
// Ini kelas kegagalan yang paling berbahaya di seluruh berkas ini.
// onBeforeCompile bekerja dengan MENGGANTI POTONGAN TEKS di dalam shader
// three.js. Kalau nama potongannya berubah — misalnya karena three
// dimutakhirkan — penggantiannya tidak terjadi, tidak ada galat yang dilempar,
// shader tetap dikompilasi, dan gambarnya tetap muncul. Yang hilang hanya
// teksturnya, diam-diam, dan permukaan kembali rata seperti lilin tanpa satu
// pun tanda bahwa ada yang rusak.
{
  const THREE = await import('three')
  const { pasangTriplanar } = await import('../../src/lib/triplanar')

  const bahan = new THREE.MeshPhysicalMaterial({ color: 0x8c2f37, roughness: 0.5 })
  pasangTriplanar(bahan, { jenis: 'otot', skala: 26, kuat: 0.9, kuatKasar: 0.7 })
  ok('onBeforeCompile terpasang', typeof bahan.onBeforeCompile === 'function')

  const asli = THREE.ShaderLib.physical
  const shader = {
    uniforms: {} as Record<string, { value: unknown }>,
    vertexShader: asli.vertexShader,
    fragmentShader: asli.fragmentShader,
  }
  const panjangVertAwal = shader.vertexShader.length
  const panjangFragAwal = shader.fragmentShader.length
  ;(bahan.onBeforeCompile as unknown as (s: typeof shader) => void)(shader)

  ok('uniform pola dikirim', !!shader.uniforms.uPola?.value)
  ok('uniform skala dikirim', shader.uniforms.uSkala?.value === 26)
  // Amplitudo harus SAMPAI ke shader dan tidak boleh nol; nol berarti tekstur
  // terpasang tetapi tidak berpengaruh apa pun — persis wujud bug yang lalu.
  ok('amplitudo terang sampai ke shader dan tidak nol',
    (shader.uniforms.uAmp?.value as number) > 0)
  ok('amplitudo kekasaran sampai ke shader dan tidak nol',
    (shader.uniforms.uAmpKasar?.value as number) > 0)

  // Sumber shader HARUS berubah. Kalau panjangnya sama, penggantiannya gagal
  // total dan teksturnya tidak akan pernah sampai ke piksel.
  ok('sumber vertex benar-benar berubah', shader.vertexShader.length > panjangVertAwal)
  ok('sumber fragment benar-benar berubah', shader.fragmentShader.length > panjangFragAwal)

  ok('varying posisi dunia dideklarasikan di vertex dan fragment',
    shader.vertexShader.includes('varying vec3 vPosDunia') &&
    shader.fragmentShader.includes('varying vec3 vPosDunia'))
  ok('posisi dunia dihitung dari matriks model',
    shader.vertexShader.includes('vPosDunia = (modelMatrix * vec4(transformed, 1.0)).xyz'))
  ok('normal dunia dihitung dari objectNormal',
    shader.vertexShader.includes('vNorDunia = normalize(mat3(modelMatrix) * objectNormal)'))
  ok('fungsi pengambilan triplanar disisipkan',
    shader.fragmentShader.includes('vec3 ambilTriplanar('))
  ok('warna dasar dimodulasi tekstur, dipusatkan di shader',
    shader.fragmentShader.includes('diffuseColor.rgb *= 1.0 + (h - 0.5) * 2.0 * uAmp'))
  ok('kekasaran dimodulasi tekstur',
    shader.fragmentShader.includes('roughnessFactor = clamp(roughnessFactor'))

  // Titik sisip yang dipakai harus benar-benar ada di shader three versi ini.
  for (const jangkar of ['#include <color_fragment>', '#include <roughnessmap_fragment>']) {
    ok(`jangkar ${jangkar} ada di shader physical three`, asli.fragmentShader.includes(jangkar))
  }
  for (const jangkar of ['#include <common>', '#include <begin_vertex>']) {
    ok(`jangkar ${jangkar} ada di vertex shader three`, asli.vertexShader.includes(jangkar))
  }

  // Rona TIDAK boleh digeser: tekstur hanya mengalikan terang secara kelabu.
  // Warna jaringan adalah keterangan klinis.
  ok('modulasi memakai satu kanal kelabu, bukan RGB penuh',
    shader.fragmentShader.includes('ambilTriplanar(uPola, vPosDunia, normalize(vNorDunia)).r'))

  ok('kunci cache program dibedakan per jaringan',
    typeof bahan.customProgramCacheKey === 'function' &&
    bahan.customProgramCacheKey().includes('otot'))
}

console.log(`\n${lulus} lulus, ${gagal} gagal`)
if (gagal) process.exit(1)
