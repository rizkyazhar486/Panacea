// C2: perilaku "nilai hilang bukan nol" untuk ringkasan harian, catatan makan dan tes kebugaran.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { completeKcalByDay, dailyIntakeTotals, focusMinutesOn } from '../../src/domains/personal-health/engine/dailySummaryTotals.ts'
import { DETECTED_LIMITS, PORTION_GRAMS, parseDetectedFoods, parsePortionGrams, scaledPer100 } from '../../src/domains/personal-health/engine/foodEntryInputs.ts'
import { BATAS, BUTIR, parseButir, ringkasTes, skorButir } from '../../src/pages/fitness/fitnessTestScoring.ts'
import { RATE_PCT_MAX, parseMoney, parseRatePct } from '../../src/lib/finance.ts'

const DAY = '2026-10-16'

// ── 1. Ringkasan harian yang dikirim ke server ─────────────────────────────────────────────────
assert.deepEqual(dailyIntakeTotals([{ date: DAY, kcal: 300, protein: 20 }, { date: DAY, kcal: 200, protein: 15 }], DAY), { kkal: 500, proteinG: 35 }, 'complete totals are sent')
assert.deepEqual(dailyIntakeTotals([{ date: DAY, kcal: 0, protein: 0 }], DAY), { kkal: 0, proteinG: 0 }, 'an explicit zero stays zero')
assert.deepEqual(dailyIntakeTotals([], DAY), {}, 'no entries today: nothing to send, not 0')
assert.deepEqual(dailyIntakeTotals([{ date: '2026-10-15', kcal: 900, protein: 50 }], DAY), {}, 'other days are ignored')
// Regresi: satu catatan tanpa kalori membuat total kalori TIDAK dikirim (dulu dikirim sebagian, seolah lengkap); protein yang lengkap tetap dikirim.
assert.deepEqual(dailyIntakeTotals([{ date: DAY, kcal: 300, protein: 20 }, { date: DAY, protein: 15 }], DAY), { proteinG: 35 }, 'a missing calorie value withholds the calorie total')
assert.deepEqual(dailyIntakeTotals([{ date: DAY, kcal: 300 }, { date: DAY, kcal: 200, protein: 15 }], DAY), { kkal: 500 }, 'a missing protein value withholds the protein total')
for (const bad of [Number.NaN, Infinity, -5, '300', null, undefined, {}, [], true]) assert.deepEqual(dailyIntakeTotals([{ date: DAY, kcal: bad, protein: bad }], DAY), {}, `kcal ${JSON.stringify(bad) ?? String(bad)} is not an observation`)
assert.deepEqual(dailyIntakeTotals([{ date: DAY, kcal: 1e308 }, { date: DAY, kcal: 1e308 }], DAY), {}, 'an overflowing sum is not sent')
for (const hostile of [null, undefined, 'x', 5, {}, [null, 5, 'a', [], { date: DAY }]]) assert.doesNotThrow(() => dailyIntakeTotals(hostile, DAY))
assert.deepEqual(dailyIntakeTotals(JSON.parse('[{"__proto__":{"date":"2026-10-16","kcal":999},"date":"2026-10-16"}]'), DAY), {}, 'prototype keys are not trusted')
assert.deepEqual(dailyIntakeTotals([Object.create({ date: DAY, kcal: 100 })], DAY), {}, 'inherited properties are not observations')
assert.equal(focusMinutesOn([{ tanggal: DAY, menit: 25 }, { tanggal: DAY, menit: 30 }], DAY), 55)
assert.equal(focusMinutesOn([{ tanggal: DAY, menit: 25 }, { tanggal: DAY }], DAY), undefined, 'a session without minutes withholds the total')
assert.equal(focusMinutesOn([{ tanggal: DAY, menit: 0 }], DAY), undefined, 'a zero total is not reported as focus time')
assert.equal(focusMinutesOn([{ tanggal: DAY, menit: -3 }], DAY), undefined); assert.equal(focusMinutesOn('x', DAY), undefined); assert.equal(focusMinutesOn([{ tanggal: '2026-10-15', menit: 40 }], DAY), undefined)

// Karbohidrat dan lemak mengikuti aturan yang sama: total lengkap atau tidak ada.
assert.deepEqual(dailyIntakeTotals([{ date: DAY, kcal: 300, protein: 20, carbs: 40, fat: 10 }, { date: DAY, kcal: 200, protein: 15, carbs: 25, fat: 5 }], DAY), { kkal: 500, proteinG: 35, carbsG: 65, fatG: 15 })
assert.deepEqual(dailyIntakeTotals([{ date: DAY, kcal: 300, carbs: 40, fat: 10 }, { date: DAY, kcal: 200, carbs: 25 }], DAY), { kkal: 500, carbsG: 65 }, 'a missing fat value withholds only the fat total')
assert.deepEqual(dailyIntakeTotals([{ date: DAY, kcal: 0, carbs: 0, fat: 0, protein: 0 }], DAY), { kkal: 0, proteinG: 0, carbsG: 0, fatG: 0 }, 'explicit zeros stay zeros')
// Total kalori per hari (grafik tujuh hari dan median "biasanya"): hari dengan nilai hilang tidak masuk, bukan menjadi total yang lebih kecil.
{
  const m = completeKcalByDay([{ date: '2026-10-14', kcal: 400 }, { date: '2026-10-14', kcal: 600 }, { date: '2026-10-15', kcal: 500 }, { date: '2026-10-15' }, { date: '2026-10-16', kcal: 0 }, { date: '2026-10-13', kcal: Number.NaN }, { date: '', kcal: 5 }, { kcal: 9 }, null, 5, 'x'])
  assert.deepEqual([...m.entries()], [['2026-10-14', 1000], ['2026-10-16', 0]], 'only fully valid days appear; an explicit zero day stays 0; an incomplete day is absent')
  assert.deepEqual([...completeKcalByDay('x').entries()], []); assert.deepEqual([...completeKcalByDay(undefined).entries()], []); assert.deepEqual([...completeKcalByDay([Object.create({ date: DAY, kcal: 5 })]).entries()], [], 'inherited fields are not observations')
}

// ── 2. Catatan makan: porsi, nilai per 100 g, keluaran model foto ───────────────────────────────
assert.equal(parsePortionGrams('100'), 100); assert.equal(parsePortionGrams('12,5'), 12.5, 'decimal comma accepted'); assert.equal(parsePortionGrams(String(PORTION_GRAMS.min)), PORTION_GRAMS.min); assert.equal(parsePortionGrams(String(PORTION_GRAMS.max)), PORTION_GRAMS.max)
for (const bad of ['', '  ', 'abc', '0', '0,5', '-5', '2001', 'Infinity', 'NaN', '1e999', null, undefined, 100, {}, []]) assert.equal(parsePortionGrams(bad), null, `portion ${JSON.stringify(bad) ?? String(bad)} is "not entered", never silently 1 g or 2000 g`)
assert.equal(scaledPer100(250, 40), 100); assert.equal(scaledPer100(0, 40), 0, 'an explicit 0 kcal/100 g is a recorded zero')
for (const bad of [undefined, null, Number.NaN, -1, Infinity, '250', {}]) assert.equal(scaledPer100(bad, 40), null, `per-100 g ${JSON.stringify(bad) ?? String(bad)} is unavailable, not 0`)
assert.equal(scaledPer100(250, 0), null); assert.equal(scaledPer100(250, Number.NaN), null)
const lengkap = { name: 'Nasi', grams: 150, kcal: 195, carbs: 43, protein: 4, fat: 0.4 }
assert.deepEqual(parseDetectedFoods([lengkap]), { items: [{ name: 'Nasi', grams: 150, kcal: 195, carbs: 43, protein: 4, fat: 0 }], skipped: 0 })
assert.equal(parseDetectedFoods([{ ...lengkap, kcal: 0, carbs: 0, protein: 0, fat: 0 }]).items.length, 1, 'an explicit zero is accepted (water, black coffee)')
assert.equal(parseDetectedFoods([{ ...lengkap, kcal: '195', grams: '150' }]).items.length, 1, 'numeric strings from a model are accepted')
// Regresi: dulu kalori yang hilang jadi 0 dan gram yang hilang jadi 100 g karangan.
for (const bad of [{ kcal: undefined }, { kcal: null }, { kcal: '' }, { kcal: 'banyak' }, { kcal: -1 }, { kcal: DETECTED_LIMITS.kcalMax + 1 }, { grams: undefined }, { grams: 0 }, { grams: '' }, { grams: DETECTED_LIMITS.gramsMax + 1 }, { carbs: undefined }, { protein: Number.NaN }, { fat: Infinity }, { name: '' }, { name: '  ' }, { name: 5 }, { name: undefined }]) {
  const r = parseDetectedFoods([{ ...lengkap, ...bad }, lengkap]); assert.equal(r.items.length, 1, `incomplete item ${JSON.stringify(bad)} is skipped, not filled in`); assert.equal(r.skipped, 1)
}
assert.deepEqual(parseDetectedFoods('x'), { items: [], skipped: 0 }); assert.deepEqual(parseDetectedFoods(null), { items: [], skipped: 0 }); assert.deepEqual(parseDetectedFoods([null, 5, 'a', [], {}]), { items: [], skipped: 5 })
assert.equal(parseDetectedFoods([Object.create(lengkap)]).items.length, 0, 'inherited fields are not trusted'); assert.equal(parseDetectedFoods([{ ...lengkap, name: 'x'.repeat(200) }]).items[0]!.name.length, 60)

// ── 3. Tes kebugaran ────────────────────────────────────────────────────────────────────────────
const kosong = ringkasTes({}, 'L')
assert.deepEqual([kosong.total, kosong.lulus], [null, null], 'nothing entered: no total and no pass/fail (was "0/100 — Needs Improvement")'); assert.deepEqual(kosong.kurang, [...BUTIR]); assert.ok(kosong.skor.every((s) => s.nilai === null))
const tiga = ringkasTes({ pushup: 43, situp: 41, pullup: 18 }, 'L'); assert.equal(tiga.total, null, 'three of four: still no total (the untested item no longer drags it down)'); assert.deepEqual(tiga.kurang, ['cooper'])
assert.equal(ringkasTes({ pushup: 43, situp: 41, pullup: 18, cooper: 2800 }, 'L').total, 100); assert.equal(ringkasTes({ pushup: 43, situp: 41, pullup: 18, cooper: 2800 }, 'L').lulus, true)
assert.equal(ringkasTes({ pushup: 0, situp: 0, pullup: 0, cooper: 0 }, 'L').total, 0, 'an entered zero is a real zero'); assert.equal(ringkasTes({ pushup: 0, situp: 0, pullup: 0, cooper: 0 }, 'L').lulus, false)
assert.equal(ringkasTes({ pushup: 43, situp: 41, pullup: 18, cooper: 100 }, 'L').lulus, false, 'a failing item still fails the whole test'); assert.equal(ringkasTes({ pushup: 30, situp: 30, pullup: 90, cooper: 2300 }, 'P').total, 100, 'female targets')
// Lantai per butir 41: total tinggi (84) tidak cukup bila satu butir 36 (cooper 1008 m = 36 %); tepat 41 % (1148 m) lulus.
assert.deepEqual([ringkasTes({ pushup: 43, situp: 41, pullup: 18, cooper: 1008 }, 'L').total, ringkasTes({ pushup: 43, situp: 41, pullup: 18, cooper: 1008 }, 'L').lulus], [84, false], 'one item below 41 fails the test despite a high total')
assert.equal(ringkasTes({ pushup: 43, situp: 41, pullup: 18, cooper: 1148 }, 'L').lulus, true, 'an item at exactly 41 meets the floor')
assert.equal(ringkasTes({ pushup: 43, situp: 41, pullup: 18, cooper: 1120 }, 'L').lulus, false, 'an item at 40 does not')
assert.equal(skorButir(0, 10), 0); assert.equal(skorButir(undefined, 10), null); assert.equal(skorButir(Number.NaN, 10), null); assert.equal(skorButir(-1, 10), null); assert.equal(skorButir(1000, 10), 100, 'capped at 100')
for (const b of BUTIR) {
  assert.equal(parseButir('0', b), 0, `typed 0 stays 0 (${b})`); assert.equal(parseButir(String(BATAS[b]), b), BATAS[b]); assert.equal(parseButir(String(BATAS[b] + 1), b), undefined)
  for (const bad of ['', ' ', 'abc', '-1', 'Infinity', 'NaN', null, undefined, 5, {}]) assert.equal(parseButir(bad, b), undefined, `${JSON.stringify(bad) ?? String(bad)} is not entered (${b})`)
}

// ── 4. Keuangan: uang/bunga kosong bukan nol ────────────────────────────────────────────────────
assert.equal(parseMoney('0'), 0, 'a typed 0 is a real zero'); assert.equal(parseMoney('10.000.000'), 10000000, 'separators are ignored'); assert.equal(parseMoney('Rp 500000'), 500000); assert.equal(parseMoney('007'), 7)
for (const bad of ['', '   ', 'abc', 'Rp', '-', null, undefined, 5, {}, [], '9'.repeat(30)]) assert.equal(parseMoney(bad), null, `${JSON.stringify(bad) ?? String(bad)} is "not entered", never 0`)
assert.equal(parseRatePct('0'), 0, 'a typed 0 % is a real 0 %'); assert.equal(parseRatePct('24'), 24); assert.equal(parseRatePct('1,5'), 1.5, 'decimal comma accepted'); assert.equal(parseRatePct(String(RATE_PCT_MAX)), RATE_PCT_MAX)
for (const bad of ['', '  ', 'abc', '-1', String(RATE_PCT_MAX + 1), 'Infinity', 'NaN', '1e999', null, undefined, 24, {}]) assert.equal(parseRatePct(bad), null, `rate ${JSON.stringify(bad) ?? String(bad)} is "not entered"`)

// ── Regresi sumber: perbaikan tidak boleh kembali ───────────────────────────────────────────────
const src = (p: string) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8')
const ringkasan = src('src/lib/ringkasan.ts'); assert.ok(!/Number\(f\.kcal\) \|\| 0|Number\(f\.protein\) \|\| 0|Number\(s\.menit\) \|\| 0/.test(ringkasan), 'ringkasan no longer sums missing values as 0'); assert.ok(ringkasan.includes('dailyIntakeTotals(st.foods, hariIni)') && ringkasan.includes('focusMinutesOn(sesi, hariIni)'))
const pangan = src('src/components/tiles/UbinPangan.tsx'); assert.ok(!/Number\(gram\.replace/.test(pangan) && !/Math\.max\(1, Math\.min\(2000/.test(pangan), 'a blank portion is no longer clamped to 1 g'); assert.ok(pangan.includes('parsePortionGrams(gram)') && pangan.includes('disabled={!bisaCatat}') && !/kkal100 \?\? 0/.test(pangan), 'calories are not defaulted to 0')
const nutrisi = src('src/pages/bodyhub/Nutrition.tsx'); assert.ok(!/\+i\.(grams|kcal|carbs|protein|fat) \|\|/.test(nutrisi), 'AI photo output is not coerced'); assert.ok(nutrisi.includes('parseDetectedFoods(JSON.parse(jsonStr))'))
const tes = src('src/pages/fitness/FitnessTest.tsx'); assert.ok(!/\+e\.target\.value \|\| 0/.test(tes) && !/useState\(\{ pushup: 0/.test(tes), 'reps no longer start at or coerce to 0'); assert.ok(tes.includes('ringkasTes(reps, sex)') && tes.includes('parseButir('))
const gerak = src('src/pages/fitness/MovementToolkit.tsx'); assert.ok(!/Number\(localStorage\.getItem\(BALANCE_KEY\) \|\| 0\)/.test(gerak) && gerak.includes("best === null ? '—'"), 'an unrecorded balance best is not shown as 0 s')
const pikir = src('src/pages/mental/MindToolkit.tsx'); assert.ok(!/pmd_reaction_best_v1'\) \|\| 0/.test(pikir) && pikir.includes("best === null ? '—'"), 'an unrecorded reaction best is not 0 ms')
const uang = src('src/pages/finance/MoneyHub.tsx'); assert.ok(!/replace\(\/\[\^\\d\]\/g, ''\)\) \|\| 0/.test(uang), 'MoneyHub no longer reads blank money fields as 0'); assert.ok(uang.includes('parseRatePct(rate)') && uang.includes('parseMoney(minPay)') && /if \(r === null\)/.test(uang) && /if \(mp === null\)/.test(uang), 'a debt cannot be added with a blank rate or minimum payment'); assert.ok(!/Number\.isFinite\(r\) \? r : 0/.test(uang), 'a blank interest rate is not silently 0 %')
const gizi = src('src/components/tiles/UbinTidurGizi.tsx'); assert.ok(!/\(f\.kcal \?\? 0\)|kkal \+= f\.kcal \?\? 0|karbo \+= f\.carbs \?\? 0|protein \+= f\.protein \?\? 0|lemak \+= f\.fat \?\? 0/.test(gizi), "today's intake no longer sums missing values as 0"); assert.ok(gizi.includes('dailyIntakeTotals(state.foods, hariIni)') && gizi.includes('completeKcalByDay(state.foods)') && gizi.includes('data-intake-incomplete') && gizi.includes('some entries have no calories'))
const grafik = src('src/components/tiles/UbinGrafik.tsx'); assert.ok(!/\(f\.kcal \?\? 0\)/.test(grafik) && grafik.includes('completeKcalByDay(state.foods)'), 'the seven-day calorie chart does not draw an incomplete day as a smaller total')
const kartu = src('src/components/clinical/KartuKlinisTubuh.tsx'); assert.ok(!/\(f\.kcal \?\? 0\)/.test(kartu) && !/toISOString\(\)\.slice\(0, 10\)/.test(kartu), 'the clinical card neither sums missing calories as 0 nor compares food dates with a UTC day'); assert.ok(kartu.includes('dailyIntakeTotals(state.foods, hariIni).kkal') && kartu.includes('localCalorieDay(Date.now())'))
console.log('angka-kosong-perbaikan: missing values are withheld, skipped or shown as unavailable, never counted as 0; explicit zeros stay zero; passed')
