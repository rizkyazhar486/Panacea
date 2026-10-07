import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import { build } from 'esbuild'
import { openFoldsAround } from '../../src/shared/ui/openFolds.ts'
import { foldsForcedOpen, foldsOpenForSession } from '../../src/shared/ui/foldsPreference.ts'

const out = await build({
  entryPoints: ['src/shared/ui/Fold.tsx'], bundle: true, write: false, format: 'esm', platform: 'node',
  jsx: 'automatic', external: ['react', 'react/jsx-runtime'], loader: { '.css': 'empty' },
})
mkdirSync('node_modules/.cache', { recursive: true })
writeFileSync('node_modules/.cache/fold.uji.mjs', out.outputFiles[0].text)
const { Fold } = await import(pathToFileURL(resolve('node_modules/.cache/fold.uji.mjs')).href)

// Positif / negatif / batas untuk parameter tautan.
assert.equal(foldsForcedOpen('#/body-explorer?folds=open'), true, 'folds=open opens every fold')
assert.equal(foldsForcedOpen('#/body-explorer?x=1&folds=open'), true, 'folds=open is found among other params')
assert.equal(foldsForcedOpen('#/body-explorer'), false, 'no query keeps folds closed')
assert.equal(foldsForcedOpen('#/body-explorer?folds=closed'), false, 'any other value keeps folds closed')
assert.equal(foldsForcedOpen('#/body-explorer?folds='), false, 'an empty value keeps folds closed')
assert.equal(foldsForcedOpen(''), false, 'an empty hash keeps folds closed')
assert.equal(foldsForcedOpen('#/x?xfolds=open'), false, 'a different param name does not open folds')

// Sesi: tautan sekali sudah cukup, bahkan bila hash ditulis ulang kemudian; tanpa tautan tetap tertutup.
const mem = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k, v) } } }
{
  const st = mem()
  assert.equal(foldsOpenForSession('#/body-explorer', st), false, 'no link, no stored preference: closed')
  assert.equal(foldsOpenForSession('#/body-explorer?folds=open', st), true, 'the link opens folds and is remembered')
  assert.equal(foldsOpenForSession('#/body-explorer', st), true, 'a later rewrite of the hash does not close them again')
  assert.equal(foldsOpenForSession('#/body-explorer', mem()), false, 'a different session without the link stays closed')
  assert.equal(foldsOpenForSession('#/x?folds=open', null), true, 'without storage the link alone still applies')
  const blocked = { getItem: () => { throw new Error('blocked') }, setItem: () => { throw new Error('blocked') } }
  assert.equal(foldsOpenForSession('#/x?folds=open', blocked), true, 'blocked storage falls back to the link')
  assert.equal(foldsOpenForSession('#/x', blocked), false, 'blocked storage without the link stays closed')
}

// Render: tertutup bawaan, satu kata, isi tetap ada di DOM (tak ada kendali yang hilang).
const html = renderToStaticMarkup(createElement(Fold, { label: 'Layers' }, createElement('button', null, 'Vessels')))
assert.match(html, /<details class="fold"/, 'a fold is a native details element')
assert.doesNotMatch(html, /<details[^>]*\sopen/, 'a fold is closed by default')
assert.match(html, /fold__word">Layers</, 'the fold shows one word')
assert.match(html, /<button>Vessels<\/button>/, 'folded content stays in the DOM, so no control disappears')

const openHtml = renderToStaticMarkup(createElement(Fold, { label: 'Topics', defaultOpen: true }, createElement('p', null, 'x')))
assert.match(openHtml, /<details[^>]*\sopen/, 'defaultOpen renders the fold open (search results must be visible)')
assert.doesNotMatch(renderToStaticMarkup(createElement(Fold, { label: 'Topics', defaultOpen: false }, createElement('p', null, 'x'))), /<details[^>]*\sopen/, 'defaultOpen=false stays closed')

// Gaya: lantai sentuh dan huruf besar, fokus terlihat, gerak dihormati.
const css = readFileSync('src/shared/ui/fold.css', 'utf8')
assert.match(css, /min-height: 56px/, 'summary keeps a generous touch target')
assert.match(css, /fold__word \{ font-size: 1\.125rem/, 'fold word is 18px, not small print')
assert.match(css, /fold__summary:focus-visible/, 'summary keeps a visible keyboard focus ring')
assert.match(css, /prefers-reduced-motion: reduce/, 'chevron motion respects reduced motion')

// Pemakaian di Body Explorer: tiga lipatan satu kata; satu kanvas 3D utama.
const page = readFileSync('src/pages/bodyhub/BodyExplorer.tsx', 'utf8')
for (const w of ['Modality', 'Ask', 'Explore']) assert.match(page, new RegExp(`<Fold label="${w}">`), `Body Explorer folds ${w}`)
assert.equal((page.match(/<Body3D\b/g) ?? []).length, 1, 'Body Explorer renders exactly one main 3D projection')
// Home: ringkasan harian, alat esensial dan tujuh kategori tetap terlihat (kontrak hierarki Home);
// bagian sekunder dilipat satu kata.
const home = readFileSync('src/pages/HomeSocialWorkspace.tsx', 'utf8')
for (const w of ['Recovery', 'Widgets', 'Live', 'Stories', 'Deck']) assert.match(home, new RegExp(`<Fold label="${w}">`), `Home folds ${w}`)
assert.doesNotMatch(home, /<Fold label="[A-Za-z]+"><(HomeHealthBrief|HomeVisualLanding|HomeEssentialTools|SuperPageLauncher) \/>/, 'the first-viewport hierarchy (status, actions, tools, categories) is never folded')
// Clinical: Ask, aksi utama, proyeksi tubuh dan rujukan tetap terlihat; bagian sekunder dilipat satu kata.
const clinical = readFileSync('src/pages/clinical/ClinicalHub.tsx', 'utf8')
for (const w of ['Calculators', 'Research', 'Patient', 'Depth', 'Guide', 'Capabilities']) assert.match(clinical, new RegExp(`<Fold label="${w}">`), `Clinical folds ${w}`)
assert.doesNotMatch(clinical, /<Fold label="[A-Za-z]+">\s*<PersonalBodyUnifiedSurface/, 'the body projection is the main surface and is never folded')
// Learn: hasil pencarian bukti tidak boleh tersembunyi di lipatan tertutup.
const learn = readFileSync('src/pages/medstudy/MedStudyHub.tsx', 'utf8')
assert.match(learn, /<Fold label="Topics" defaultOpen=\{params\.has\('bagian'\)\}>/, 'Learn opens Topics itself when an evidence query sets `bagian`')
assert.match(learn, /<Fold label="Planner">/, 'Learn folds the study planner')
assert.match(learn, /<MedicalLibraryWorkbench onRun=\{runEvidenceQuery\} \/>/, 'the library search stays the visible main surface')
const bench = readFileSync('src/components/MedicalLibraryWorkbench.tsx', 'utf8')
for (const w of ['Guide', 'Appraisal']) assert.match(bench, new RegExp(`<Fold label="${w}">`), `the library workbench folds ${w}`)
assert.doesNotMatch(bench, /<Fold label="[A-Za-z]+">\s*<div className="mt-3 rounded-\[22px\] bg-neutral-950/, 'the generated query and its search/save actions are never folded')
// Health > Body: satu hero (skor + tipe tubuh) lalu empat lipatan satu kata; formulir pengukuran dilipat.
const comp = readFileSync('src/pages/bodyhub/BodyComposition.tsx', 'utf8')
for (const w of ['Measurements', 'Analysis', 'Screening', 'Markers']) assert.match(comp, new RegExp(`<Fold label="${w}">`), `Body folds ${w}`)
assert.ok(comp.indexOf('Composition Score') < comp.indexOf('<Fold label="Measurements">'), 'the score hero comes before every fold')
assert.doesNotMatch(comp, /<Fold label="[A-Za-z]+">\s*\{\/\* Score \+ bento header/, 'the score hero is never folded')
// Lompatan ke jangkar membuka lipatan yang membungkusnya (dua tingkat), dan tidak menyentuh yang lain.
{
  const mkDetails = (parent: any) => { const d: any = { open: false, parentElement: parent, closest(sel: string) { return sel === 'details.fold' ? d : null } }; return d }
  const outer: any = { open: false, parentElement: null, closest: () => outer }
  const inner: any = { open: false, parentElement: outer, closest: () => inner }
  const target: any = { parentElement: inner, closest: () => inner }
  assert.equal(openFoldsAround(target), 2, 'both enclosing folds are opened')
  assert.equal(outer.open && inner.open, true, 'the target is no longer hidden')
  assert.equal(openFoldsAround(target), 0, 'already-open folds are left alone (idempotent)')
  assert.equal(openFoldsAround(null), 0, 'a missing target is a no-op')
  const loose: any = { parentElement: null, closest: () => null }
  assert.equal(openFoldsAround(loose), 0, 'an element outside any fold opens nothing')
  void mkDetails
}
// Nutrition: angka hari ini adalah hero; pencatatan, kalkulator dan sumber dilipat; lompatan membuka lipatan.
const gizi = readFileSync('src/pages/bodyhub/Nutrition.tsx', 'utf8')
for (const w of ['Longevity', 'Log', 'Calculators', 'Sources']) assert.match(gizi, new RegExp(`<Fold label="${w}">`), `Nutrition folds ${w}`)
assert.ok(gizi.indexOf('<PanelAngka angka={angkaHariIni} />') < gizi.indexOf('<Fold label="Longevity">'), "today's numbers come before every fold")
assert.match(gizi, /openFoldsAround\(el\)/, 'anchor jumps (lompat) open the fold that holds their target')
// Health > Data: kartu sumber data tetap terlihat; impor, sinkronisasi, metrik dan wawasan dilipat; Simpan tetap melekat.
const data = readFileSync('src/pages/HealthProfile.tsx', 'utf8')
for (const w of ['Import', 'Sync', 'Metrics', 'Insights']) assert.match(data, new RegExp(`<Fold label="${w}">`), `Health Data folds ${w}`)
assert.ok(data.indexOf('title="My Health Data"') < data.indexOf('<Fold label="Import">'), 'the source card comes before every fold')
assert.ok(data.indexOf('<div className="sticky bottom-4 z-10">') > data.indexOf('<Fold label="Insights">'), 'the Save bar stays outside the folds (always reachable)')
assert.doesNotMatch(data, /<Fold label="[A-Za-z]+">\s*<div className="sticky bottom-4/, 'the Save bar is never folded')
// League: peringkat + indeks kemenangan adalah hero; lima bagian lain dilipat satu kata.
const liga = readFileSync('src/pages/HealthPerformanceLeague.tsx', 'utf8')
for (const w of ['Components', 'Matches', 'Ladder', 'Promotion', 'Scoring', 'Seasons']) assert.match(liga, new RegExp(`<Fold label="${w}"`), `League folds ${w}`)
assert.ok(liga.indexOf('Current rank') < liga.indexOf('<Fold label="Components"'), 'the rank hero comes before every fold')
assert.ok(liga.indexOf('AI victory index') < liga.indexOf('<Fold label="Matches">'), 'the victory index stays outside the folds')
// Longevity: skor + usia biologis adalah hero; enam bagian lain dilipat satu kata.
const umur = readFileSync('src/pages/bodyhub/Longevity.tsx', 'utf8')
for (const w of ['Evidence', 'Pillars', 'Projection', 'Labs', 'Testing', 'Sources']) assert.match(umur, new RegExp(`<Fold label="${w}">`), `Longevity folds ${w}`)
assert.ok(umur.indexOf('Biological Age (est.)') < umur.indexOf('<Fold label="Evidence">'), 'the score hero comes before every fold')
// VitaPulse: ringkasan waktu-nyata adalah hero; tujuh bagian lain dan video dilipat satu kata.
const vita = readFileSync('src/pages/VitaPulse.tsx', 'utf8')
const pusat = readFileSync('src/pages/Feed.tsx', 'utf8')
assert.match(vita, /<Fold label="Video"/, 'VitaPulse folds Video')
for (const w of ['Assistant', 'Vitals', 'Sleep', 'Fitness', 'News', 'Learn', 'Goals']) assert.match(pusat, new RegExp(`<Fold label="${w}">`), `VitaPulse folds ${w}`)
assert.ok(pusat.indexOf('Real-Time Summary') < pusat.indexOf('<Fold label="Assistant">'), 'the summary hero comes before every fold')
assert.ok(pusat.slice(pusat.indexOf('Real-Time Summary'), pusat.indexOf('<Fold label="Assistant">')).includes('</Card>'), 'the folds are siblings of the summary hero, never nested inside its card')
// Body Exposure: proyektor tunggal tetap di atas; panel multiskala + ubiquitin (proyeksi molekul kedua) dilipat satu kata.
const eksposur = readFileSync('src/pages/BodyExposureOS.tsx', 'utf8')
const lipatMulti = eksposur.indexOf('<Fold label="Multiscale"')
assert.ok(lipatMulti >= 0, 'Body Exposure folds Multiscale')
assert.ok(lipatMulti > eksposur.indexOf('<UnifiedHumanSimulationProjector'), 'the single projector comes before the Multiscale fold')
const penutupMulti = eksposur.indexOf('</Fold>', lipatMulti)
for (const panel of ['<PanelKoplingMultiSkala />', '<PanelUbiquitin />']) {
  const at = eksposur.indexOf(panel)
  assert.ok(lipatMulti >= 0 && at > lipatMulti && at < penutupMulti, `${panel} lives inside the Multiscale fold`)
}
assert.equal((eksposur.match(/<UnifiedHumanSimulationProjector/g) ?? []).length, 1, 'Body Exposure keeps exactly one unified projector')
// Proyektor Body Exposure: panel kamera "My Body" dilipat satu kata agar 3D tetap fokus tunggal.
const proyektor = readFileSync('src/pages/bodyhub/UnifiedHumanSimulationProjector.tsx', 'utf8')
assert.match(proyektor, /<Fold label="Scan"><PersonalAvatarCameraCapture \/><\/Fold>/, 'the projector folds the camera capture panel as Scan')
// Atlas 3D: daftar target sumber dilipat, tetapi hitungan dan catatan target hilang tetap terlihat (batas kebenaran).
const atlas3d = readFileSync('src/components/bodyhub/BodyAllSystems3D.tsx', 'utf8')
const lipatSumber = atlas3d.indexOf('<Fold label="Sources">')
assert.ok(lipatSumber >= 0, 'the atlas folds its source target list as Sources')
assert.ok(atlas3d.indexOf('selected.targets.map', lipatSumber) > lipatSumber && atlas3d.indexOf('selected.targets.map', lipatSumber) < atlas3d.indexOf('</Fold>', lipatSumber), 'the target cards live inside the Sources fold')
assert.ok(atlas3d.indexOf('Missing or failed targets are deliberately not approximated') > atlas3d.indexOf('</Fold>', lipatSumber), 'the missing-target boundary note stays outside the fold, always visible')
// Alur QA harus membuka lipatan lewat tautan, bukan mengubah apa yang diuji.
for (const f of ['.github/workflows/stabilization-acceptance.yml', '.github/workflows/organ-3d-acceptance.yml']) {
  assert.doesNotMatch(readFileSync(f, 'utf8'), /#\/body-explorer(?!\?folds=open)\s*$/m, `${f} must open folds for body-explorer smokes`)
}
assert.match(readFileSync('src/main.tsx', 'utf8'), /\ncaptureFoldsPreference\(\)\n/, 'the app captures folds=open at boot, before any route can rewrite the hash')
console.log('Fold verified: closed by default, one word, content stays in DOM, link opens all, 3 folds, one 3D projection.')
