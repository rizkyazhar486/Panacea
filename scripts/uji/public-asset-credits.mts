// D8: Public page is an accessible inventory, not a fabricated licence approval.
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
const page = readFileSync('public/asset-credits.html', 'utf8')
const body = readFileSync('public/bodyexposure/provenance.html', 'utf8')
const fetalBase = 'https://gin.g-node.org/kcl_cdb/fetal_body_mri_atlas/src/74f11a186c709078d712bb2fd827bfa2b36e3407/'
const fetalEvidence = [fetalBase + 'README.md', fetalBase + 'LICENSE']
function inspect(p: string) {
  const required = [
    '<html lang="en">', '<main>', '<h1>Asset sources and licensing</h1>',
    'bodyexposure/provenance.html', 'bodyexposure/software-notices.html', 'organs/CREDITS.txt',
    'media/ASSET_SOURCES.md', 'images/ASSET_SOURCES.md',
    'logo-mark.png', 'tutorial-video.mp4',
    'https://www.icrp.org/page.asp?id=5',
    'https://github.com/tokotype/PlusJakartaSans/blob/master/OFL.txt',
    'not proof of redistribution rights',
    'not a blanket licence', ...fetalEvidence,
  ]
  return required.filter(v => !p.includes(v))
}
assert.deepEqual(inspect(page), [], 'The public credit page must attribute sources and disclose unverified rights')
for (const path of [
  'public/bodyexposure/provenance.html',
  'public/bodyexposure/software-notices.html',
  'public/organs/CREDITS.txt',
  'public/media/ASSET_SOURCES.md',
  'public/images/ASSET_SOURCES.md',
]) assert.ok(existsSync(path), `The credited file must actually exist: ${path}`)
assert.ok(body.includes('href="../asset-credits.html"'), 'Body Exposure must link the global credits')
// The directly linked anatomy page and its source credits must disclose the
// same unresolved rights as the global inventory, beside each affected group.
const credits = readFileSync('public/bodyexposure/CREDITS.txt', 'utf8')
function inspectRights(text: string) {
  const failures: string[] = []
  for (const group of ['pediatric_*', 'icrp_adult_*', 'fetus.*']) {
    const section = text.split(group + ' ')[1]?.split('\n\n')[0] ?? ''
    if (group === 'fetus.*') {
      if (!section.includes('CC0 1.0') || fetalEvidence.some(url => !section.includes(url)) || /upstream dataset licence unverified/.test(section)) failures.push(group)
    } else if (!section.includes('rightsholder permission for derivatives and redistribution remains unverified') || /redistribution[\s\S]*?cleared/i.test(section)) failures.push(group)
  }
  return failures
}
for (const [name, text] of [['source credits', credits], ['public anatomy page', body]]) {
  assert.deepEqual(inspectRights(text), [], `${name}: unresolved rights must not be presented as cleared`)
  for (const group of ['pediatric_*', 'icrp_adult_*', 'fetus.*']) {
    assert.ok(inspectRights(text.replace(group + ' ', 'missing-group ')).includes(group), `Missing ${group} disclosure must fail`)
  }
  for (const url of fetalEvidence) {
    assert.ok(inspectRights(text.replace(url, '')).includes('fetus.*'), 'Missing pinned fetal licence evidence must fail')
    assert.ok(inspectRights(text.replace(url, url.replace('fetal_body_mri_atlas', 'different_dataset'))).includes('fetus.*'), 'A different dataset cannot clear this fetal atlas')
  }
  assert.ok(inspectRights(text.replace('rightsholder permission for derivatives and redistribution remains unverified', 'Redistribution in Panacea cleared by the project owner')).includes('pediatric_*'), 'Internal owner approval must not become a rightsholder grant')
}
for (const text of [body, readFileSync('bodyexposure/PROVENANCE.md', 'utf8')]) {
  assert.doesNotMatch(text, /redistribution cleared by owner|owner cleared redistribution|clearance of ICRP-derived meshes/i, 'Detailed provenance must not contradict the unresolved rightsholder permission')
  for (const url of fetalEvidence) assert.ok(text.includes(url), 'Verified fetal provenance must link the pinned upstream README and LICENSE')
}
for (const path of [
  'public/bodyexposure/dataset-inspection/fetal-parcels/PROVENANCE.md',
  'public/bodyexposure/dataset-inspection/fetal-parcels/mri/PROVENANCE.md',
]) {
  const provenance = readFileSync(path, 'utf8')
  for (const url of fetalEvidence) assert.ok(provenance.includes(url), path + ': pinned dataset licence evidence required')
  assert.doesNotMatch(provenance, /not re-verified|not reverified|not verified/i, path + ': stale licence uncertainty must be removed')
}
for (const removed of [...fetalEvidence, 'logo-mark.png', 'bodyexposure/software-notices.html', 'https://www.icrp.org/page.asp?id=5', 'not a blanket licence']) {
  assert.ok(inspect(page.replace(removed, '')).includes(removed), `Negative control detects omitted ${removed}`)
}
console.log('D8 public asset credits: source links, accessible markup, legal boundaries and negative controls pass')

