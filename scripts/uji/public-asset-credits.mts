// D8: Public page is an accessible inventory, not a fabricated licence approval.
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
const page = readFileSync('public/asset-credits.html', 'utf8')
const body = readFileSync('public/bodyexposure/provenance.html', 'utf8')
function inspect(p: string) {
  const required = [
    '<html lang="en">', '<main>', '<h1>Asset sources and licensing</h1>',
    'bodyexposure/provenance.html', 'bodyexposure/software-notices.html', 'organs/CREDITS.txt',
    'media/ASSET_SOURCES.md', 'images/ASSET_SOURCES.md',
    'logo-mark.png', 'tutorial-video.mp4',
    'https://www.icrp.org/page.asp?id=5',
    'https://github.com/tokotype/PlusJakartaSans/blob/master/OFL.txt',
    'not proof of redistribution rights',
    'not a blanket licence',
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
for (const removed of ['logo-mark.png', 'bodyexposure/software-notices.html', 'https://www.icrp.org/page.asp?id=5', 'not a blanket licence']) {
  assert.ok(inspect(page.replace(removed, '')).includes(removed), `Negative control detects omitted ${removed}`)
}
console.log('D8 public asset credits: source links, accessible markup, legal boundaries and negative controls pass')
