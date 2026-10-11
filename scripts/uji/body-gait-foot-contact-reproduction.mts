// D7: reproduksi independen kontak kaki WALK/RUN dari GLB publik. Laporan yang dikomit harus identik dengan hasil jalan ulang
// skrip (deterministik), loop tertutup ditangani (fase melintasi jahitan terhitung SATU), dan vonis terhadap kriteria penelitian
// eksplisit dicatat apa adanya (tidak ada ambang yang disetel agar lulus).
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import { evaluateFootSlide, RESEARCH_FOOT_SLIDE_CRITERIA as C } from '../../src/domains/body-exposure/engine/gaitFootMetrics.ts'

const BODIES = ['adult_male', 'vhf_denver_ct_adult_female'] as const
const regen = (b: string) => JSON.parse(execFileSync(process.execPath, ['scripts/qa/glb-foot-contact-reproduce.mjs', `public/bodyexposure/${b}.rig_rom.glb`], { encoding: 'utf8' }))
const committed = (b: string) => JSON.parse(fs.readFileSync(`bodyexposure/qa_reports/gait_foot_contact_reproduction.${b}.json`, 'utf8'))

for (const b of BODIES) {
  assert.deepEqual(regen(b), committed(b), `laporan ${b} tidak sama dengan hasil jalan ulang: jalankan skrip dengan --out`)
  assert.deepEqual(regen(b), regen(b), `jalan ulang ${b} tidak deterministik`)
}

const m = committed('adult_male'), f = committed('vhf_denver_ct_adult_female')
// loop tertutup: bingkai terakhir adalah duplikat dan dibuang (WALK 27 -> 26, RUN 19 -> 18)
for (const rep of [m, f]) {
  assert.equal(rep.clips.WALK.loop_closed_duplicate_end_frame_dropped, true, 'WALK: loop tertutup harus terdeteksi'); assert.equal(rep.clips.WALK.frames, 26, 'WALK: bingkai duplikat harus dibuang (27 -> 26)')
  assert.equal(rep.clips.RUN.loop_closed_duplicate_end_frame_dropped, true, 'RUN: loop tertutup harus terdeteksi'); assert.equal(rep.clips.RUN.frames, 18, 'RUN: bingkai duplikat harus dibuang (19 -> 18)')
}
// fase yang melintasi jahitan loop dihitung satu kali: jari WALK jantan = 2 fase (satu per kaki), bukan 3
assert.equal(m.clips.WALK.toe.stance_phases, 2, 'fase tumpu melintasi jahitan loop harus dihitung satu kali')
assert.deepEqual(m.clips.WALK.toe.phases_by_side, { L: ['22-25+0-9'], R: ['9-22'] }, 'fase kiri harus tersambung melintasi jahitan')
// penanda tumit tidak pernah menapak terhadap SATU lantai klip (laporan Blender lama menemukan 1 fase karena lantai per-penanda)
for (const rep of [m, f]) for (const clip of ['WALK', 'RUN']) assert.equal(rep.clips[clip].heel.stance_phases, 0, `tumit ${clip} tidak boleh punya fase tumpu`)

// vonis terhadap kriteria penelitian (apa adanya)
const v = (rep: any, clip: string, k: string) => evaluateFootSlide(rep.clips[clip][k], C)
assert.deepEqual(v(m, 'WALK', 'toe'), { status: 'exceeds', criteria: C, failed: ['peak'] }, 'jari WALK jantan: RMS 12,6 <= 15 tetapi maks 32,2 > 30')
assert.equal((v(m, 'WALK', 'heel') as any).reason, 'no_stance')
assert.equal((v(m, 'RUN', 'toe') as any).reason, 'no_stance')
assert.equal((v(m, 'RUN', 'sole') as any).reason, 'too_few_phases', 'RUN hanya 1 fase tumpu pada definisi titik terendah')
assert.equal((v(f, 'WALK', 'toe') as any).reason, 'too_few_phases', 'betina: hanya kaki kanan (1 fase)')
// pasangan: hanya satu angka yang berbeda dari kasus yang melampaui -> dalam kriteria
assert.equal(evaluateFootSlide({ ...m.clips.WALK.toe, slide_max_mm: 30 }, C).status, 'within')
// definisi sol memakai simpul terendah yang berpindah-pindah antara tumit dan jari: selipnya tidak boleh dibaca sebagai selip nyata
assert.ok(m.clips.WALK.sole.slide_rms_mm > 4 * m.clips.WALK.toe.slide_rms_mm, 'sol lebih besar dari jari (derau pergantian simpul), dicatat sebagai batasan metode')
console.log('body-gait-foot-contact-reproduction: laporan = jalan ulang; loop tertutup dihitung benar; jari WALK jantan 2 fase melampaui maks 30 mm (placeholder); 6 ukuran lain tidak terukur')
