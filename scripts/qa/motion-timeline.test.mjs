import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parseMotionTimeline, parseMotionLibrary, movementAt, advanceClock, scrubToTime } from '../../src/domains/body-exposure/engine/motionTimeline.ts'

const library = JSON.parse(readFileSync(new URL('../../public/bodyexposure/adult_male.rig_motion.json', import.meta.url), 'utf8'))
const published = library.clips[0]
const valid = {
  clip: 'ROM', fps: 24, frames: 97, source: 'AAOS', truth_class: 'simulated', label: 'demo',
  movements: [{ name: 'a', start_s: 0, end_s: 2, note: '' }, { name: 'b', start_s: 2, end_s: 4, note: 'n' }],
}
const clock = { timeS: 0, playing: true, speed: 1, loop: false }

test('menerima_timeline_terbitan_pipeline', () => {
  const r = parseMotionTimeline(published)
  assert.equal(r.ok, true)
  assert.equal(r.timeline.truthClass, 'simulated')
  assert.equal(r.timeline.movements.length, 11)
  assert.equal(r.timeline.durationS, (published.frames - 1) / published.fps)
})

test('menerima_timeline_minimal_valid', () => {
  const r = parseMotionTimeline(valid)
  assert.equal(r.ok, true)
  assert.equal(r.timeline.durationS, 4)
})

test('menolak_kelas_kebenaran_di_luar_daftar', () => {
  const r = parseMotionTimeline({ ...valid, truth_class: 'measured' })
  assert.deepEqual(r, { ok: false, error: 'truth_class must be "simulated" or "measured-retargeted"' })
  assert.equal(parseMotionTimeline({ ...valid, truth_class: 'patient' }).ok, false)
})

test('menerima_gerak_terukur_dengan_atribusi_dan_menolak_tanpa_atribusi', () => {
  const m = { ...valid, truth_class: 'measured-retargeted', acknowledgement: 'mocap.cs.cmu.edu' }
  assert.equal(parseMotionTimeline(m).timeline.truthClass, 'measured-retargeted')
  assert.deepEqual(parseMotionTimeline({ ...m, acknowledgement: '' }), { ok: false, error: 'measured motion needs a source acknowledgement' })
})

test('pustaka_terbitan_valid_dengan_rom_jalan_lari', () => {
  const r = parseMotionLibrary(library)
  assert.equal(r.ok, true)
  assert.deepEqual(r.clips.map((c) => c.clip), ['ROM', 'WALK', 'RUN'])
  assert.deepEqual(r.clips.map((c) => c.truthClass), ['simulated', 'measured-retargeted', 'measured-retargeted'])
})

test('pustaka_menolak_kosong_duplikat_dan_klip_cacat', () => {
  assert.equal(parseMotionLibrary({ clips: [] }).ok, false)
  assert.equal(parseMotionLibrary(null).ok, false)
  assert.deepEqual(parseMotionLibrary({ clips: [valid, valid] }), { ok: false, error: 'duplicate clip "ROM"' })
  assert.deepEqual(parseMotionLibrary({ clips: [valid, { ...valid, clip: 'X', fps: 0 }] }), { ok: false, error: 'clip 2: fps must be a positive number' })
})

test('menolak_tanpa_sumber', () => {
  assert.deepEqual(parseMotionTimeline({ ...valid, source: ' ' }), { ok: false, error: 'source missing' })
})

test('menolak_fps_nol_atau_nan', () => {
  assert.equal(parseMotionTimeline({ ...valid, fps: 0 }).ok, false)
  assert.equal(parseMotionTimeline({ ...valid, fps: Number.NaN }).ok, false)
})

test('menolak_gerakan_tumpang_tindih', () => {
  const r = parseMotionTimeline({ ...valid, movements: [{ name: 'a', start_s: 0, end_s: 3 }, { name: 'b', start_s: 2, end_s: 4 }] })
  assert.deepEqual(r, { ok: false, error: 'movement "b" overlaps the previous one' })
})

test('menolak_gerakan_melewati_klip', () => {
  const r = parseMotionTimeline({ ...valid, movements: [{ name: 'a', start_s: 0, end_s: 4.5 }] })
  assert.deepEqual(r, { ok: false, error: 'movement "a" ends after the clip' })
})

test('menerima_akhir_gerakan_dalam_setengah_frame_pembulatan', () => {
  const r = parseMotionTimeline({ ...valid, movements: [{ name: 'a', start_s: 0, end_s: 4 + 0.4 / 24 }] })
  assert.equal(r.ok, true)
})

test('menolak_akhir_gerakan_lebih_dari_setengah_frame', () => {
  const r = parseMotionTimeline({ ...valid, movements: [{ name: 'a', start_s: 0, end_s: 4 + 0.6 / 24 }] })
  assert.deepEqual(r, { ok: false, error: 'movement "a" ends after the clip' })
})

test('menolak_bukan_objek', () => {
  assert.deepEqual(parseMotionTimeline(null), { ok: false, error: 'timeline must be an object' })
})

test('gerakan_aktif_pada_batas_awal_dan_akhir', () => {
  const tl = parseMotionTimeline(valid).timeline
  assert.equal(movementAt(tl, 0).name, 'a')
  assert.equal(movementAt(tl, 2).name, 'b')      // batas: awal b
  assert.equal(movementAt(tl, 1.999).name, 'a')
  assert.equal(movementAt(tl, 4), null)           // akhir eksklusif
  assert.equal(movementAt(tl, Number.NaN), null)
})

test('jam_maju_dengan_waktu_bukan_frame', () => {
  const r = advanceClock(clock, 0.2, 4)
  assert.equal(r.ok, true)
  assert.equal(r.clock.timeS, 0.2)
  const fast = advanceClock({ ...clock, speed: 2 }, 0.2, 4)
  assert.equal(fast.clock.timeS, 0.4)
})

test('jam_membatasi_lompatan_dt', () => {
  assert.equal(advanceClock(clock, 5, 10).clock.timeS, 0.25)
})

test('jam_berhenti_di_akhir_tanpa_loop_dan_berputar_dengan_loop', () => {
  const end = advanceClock({ ...clock, timeS: 3.9 }, 0.2, 4)
  assert.equal(end.clock.timeS, 4); assert.equal(end.clock.playing, false)
  const loop = advanceClock({ ...clock, timeS: 3.9, loop: true }, 0.2, 4)
  assert.ok(Math.abs(loop.clock.timeS - 0.1) < 1e-9); assert.equal(loop.clock.playing, true)
})

test('jam_menolak_dt_negatif_dan_kecepatan_tak_didukung_tanpa_mengubah_state', () => {
  const neg = advanceClock(clock, -0.1, 4)
  assert.equal(neg.ok, false); assert.equal(neg.clock, clock)
  const bad = advanceClock({ ...clock, speed: 3 }, 0.1, 4)
  assert.deepEqual([bad.ok, bad.error], [false, 'unsupported speed'])
  assert.equal(advanceClock(clock, 0.1, 0).ok, false)
})

test('jam_dijeda_tidak_maju', () => {
  const p = { ...clock, playing: false, timeS: 1 }
  assert.equal(advanceClock(p, 0.2, 4).clock.timeS, 1)
})

test('scrub_dijepit_dan_menolak_nan', () => {
  assert.equal(scrubToTime(0.5, 4), 2)
  assert.equal(scrubToTime(1.5, 4), 4)
  assert.equal(scrubToTime(-1, 4), 0)
  assert.equal(scrubToTime(Number.NaN, 4), null)
  assert.equal(scrubToTime(0.5, 0), null)
})
