import { readFileSync, writeFileSync } from 'node:fs'

function replaceOnce(path, before, after, label) {
  const src = readFileSync(path, 'utf8')
  const first = src.indexOf(before)
  if (first < 0) throw new Error(`${label}: expected source block not found in ${path}`)
  if (src.indexOf(before, first + before.length) >= 0) throw new Error(`${label}: source block is not unique in ${path}`)
  writeFileSync(path, src.slice(0, first) + after + src.slice(first + before.length))
}

const models = 'src/lib/organModels.ts'
replaceOnce(
  models,
  "import { REFERENCE_ATLAS_MODELS } from './referenceOrganModels'",
  "import { REFERENCE_ATLAS_MODELS, REGIONAL_REFERENCE_ATLAS_MODELS } from './referenceOrganModels'",
  'regional atlas import',
)
replaceOnce(
  models,
  `export function modelForFocus(focusKey: string): OrganModel | undefined {\n  return ORGAN_ATLAS.find((m) => m.focusKey === focusKey)\n    ?? REFERENCE_ATLAS_MODELS.find((m) => m.focusKey === focusKey)\n    ?? ORGAN_MODELS.find((m) => m.focusKey === focusKey)\n}\n\n/** Model bangkitan AI saja — dipakai untuk mencari ilustrasi /organs/<id>/. */`,
  `export function modelForFocus(focusKey: string): OrganModel | undefined {\n  return ORGAN_ATLAS.find((m) => m.focusKey === focusKey)\n    ?? REFERENCE_ATLAS_MODELS.find((m) => m.focusKey === focusKey)\n    ?? ORGAN_MODELS.find((m) => m.focusKey === focusKey)\n}\n\n/** Optional regional anatomy that complements, rather than replaces, the primary close-up. */\nexport function regionalModelForFocus(focusKey: string): OrganModel | undefined {\n  return REGIONAL_REFERENCE_ATLAS_MODELS.find((m) => m.focusKey === focusKey)\n}\n\n/** Model bangkitan AI saja — dipakai untuk mencari ilustrasi /organs/<id>/. */`,
  'regional model resolver',
)

const dossier = 'src/pages/bodyhub/OrganDossier.tsx'
replaceOnce(
  dossier,
  "import { modelForFocus, modelIlustrasi, ILUSTRASI } from '../../lib/organModels'",
  "import { modelForFocus, regionalModelForFocus, modelIlustrasi, ILUSTRASI } from '../../lib/organModels'",
  'dossier model imports',
)
replaceOnce(
  dossier,
  `  // Model organ tunggal beresolusi tinggi, kalau organ ini punya. Terpisah\n  // dari figur tubuh utuh dan asalnya berbeda — lihat organModels.ts.\n  const model = modelForFocus(organKey)\n  // Ilustrasi selalu datang dari berkas /organs/<id>/, yang hanya dimiliki\n  // model bangkitan AI. Saat organ ini memakai potongan BodyParts3D untuk 3D-nya,\n  // ilustrasinya tetap dicari terpisah supaya tidak ikut hilang.\n  const ilustrasi = modelIlustrasi(organKey)\n  const [hotspot, setHotspot] = useState<string | null>(null)`,
  `  // Primary detail and optional regional context are separate on purpose:\n  // the richer regional atlas must not silently replace a more detailed organ cut.\n  const primaryModel = modelForFocus(organKey)\n  const regionalModel = regionalModelForFocus(organKey)\n  // Ilustrasi selalu datang dari berkas /organs/<id>/, yang hanya dimiliki\n  // model bangkitan AI. Reference geometry and legacy illustrations stay separate.\n  const ilustrasi = modelIlustrasi(organKey)\n  const [anatomyView, setAnatomyView] = useState<'primary' | 'regional'>('primary')\n  const [hotspot, setHotspot] = useState<string | null>(null)\n  useEffect(() => {\n    setAnatomyView('primary')\n    setHotspot(null)\n  }, [organKey])\n  const model = anatomyView === 'regional' && regionalModel ? regionalModel : primaryModel`,
  'dossier primary/regional state',
)
replaceOnce(
  dossier,
  `        {model && (\n          <>\n            <OrganModel3D organ={model} selected={hotspot} onSelect={setHotspot} />`,
  `        {model && (\n          <>\n            {regionalModel && (\n              <div aria-label="Anatomy view" className="grid grid-cols-2 gap-1 rounded-xl bg-neutral-100 p-1 dark:bg-white/5">\n                <button\n                  onClick={() => { setAnatomyView('primary'); setHotspot(null) }}\n                  className={\`min-h-[34px] rounded-lg px-2 text-[11px] font-bold transition \${anatomyView === 'primary' ? 'bg-white text-ink shadow-sm dark:bg-white/15 dark:text-white' : 'text-neutral-500'}\`}\n                >\n                  Organ detail\n                </button>\n                <button\n                  onClick={() => { setAnatomyView('regional'); setHotspot(null) }}\n                  className={\`min-h-[34px] rounded-lg px-2 text-[11px] font-bold transition \${anatomyView === 'regional' ? 'bg-white text-ink shadow-sm dark:bg-white/15 dark:text-white' : 'text-neutral-500'}\`}\n                >\n                  Regional relationships\n                </button>\n              </div>\n            )}\n            <OrganModel3D organ={model} selected={hotspot} onSelect={setHotspot} />`,
  'regional view selector',
)
replaceOnce(
  dossier,
  `            <p className="text-[10px] leading-relaxed text-neutral-400">\n              {model.sumber === 'bodyparts3d' ? (\n                <>\n                  Detailed organ view — {model.jumlahBagian === 1 ? 'one named structure' : \`\${model.jumlahBagian} individually named structures\`} cut from BodyParts3D 4.0\n                  (Database Center for Life Science, CC BY 4.0), the same reference anatomy as the full-body figure\n                  above. Real human reference geometry, not an artistic impression.\n                </>\n              ) : (\n                <>\n                  Detailed organ view — an AI-generated model (Tripo), used with the owner’s permission. It is a shape\n                  approximation for recognising form and position, not verified anatomy. The full-body figure above uses\n                  BodyParts3D, which is derived from real human data.\n                </>\n              )}\n            </p>`,
  `            <p className="text-[10px] leading-relaxed text-neutral-400">\n              {model.sumber === 'bodyparts3d' ? (\n                <>\n                  Reference anatomy — {model.jumlahBagian === 1 ? 'one named structure' : \`\${model.jumlahBagian} named structures\`} from BodyParts3D 4.0\n                  (Database Center for Life Science, CC BY 4.0). Named source geometry supports exact structure selection.\n                  This is educational reference anatomy, not patient-specific imaging.\n                </>\n              ) : model.sumber === 'z-anatomy' || model.sumber === 'hra' ? (\n                <>\n                  Reference anatomy — {model.jumlahBagian === 1 ? 'one named structure' : \`\${model.jumlahBagian} named structures\`} from {model.sourceLabel ?? model.sumber}\n                  {model.sourceLicense ? \` (\${model.sourceLicense})\` : ''}. Named source geometry supports exact structure selection.\n                  This is a reference atlas, not patient-specific imaging.\n                </>\n              ) : (\n                <>\n                  Shape approximation — an AI-generated model (Tripo), used with the owner’s permission. It is suitable\n                  for recognising broad form and position only; it is not verified sub-structure anatomy and is not patient-specific.\n                </>\n              )}\n            </p>`,
  'truthful provenance copy',
)

const smoke = 'scripts/qa/organ-detail-mobile-smoke.mjs'
replaceOnce(
  smoke,
  `  metrics.brainStillShowsTripo = await page.getByText(/AI-generated model \\(Tripo\\)/i).isVisible().catch(() => false)\n  if (metrics.brainStillShowsTripo) throw new Error('Brain still reports the obsolete Tripo source after reference promotion')\n\n  if (pageErrors.length) throw new Error(\`Browser page errors: \${pageErrors.join(' | ')}\`)`,
  `  metrics.brainStillShowsTripo = await page.getByText(/AI-generated model \\(Tripo\\)/i).isVisible().catch(() => false)\n  if (metrics.brainStillShowsTripo) throw new Error('Brain still reports the obsolete Tripo source after reference promotion')\n\n  // Z-Anatomy promotion: lungs must load named reference geometry and must not\n  // inherit the legacy Tripo provenance text.\n  await page.getByRole('button', { name: 'Organs', exact: true }).first().click()\n  await page.getByRole('button', { name: 'Lungs', exact: true }).first().click()\n  await page.locator('canvas[data-organ-model3d="lungs-reference"]').first().waitFor({ state: 'visible', timeout: 45_000 })\n  await page.getByText(/13 named structures from 13 source meshes/i).first().waitFor({ state: 'visible', timeout: 10_000 })\n  await page.getByText(/Z-Anatomy · derived from BodyParts3D/i).first().waitFor({ state: 'visible', timeout: 10_000 })\n  metrics.lungsReferenceProvenanceVisible = true\n\n  // HRA promotion: breast must expose the reference-object sex and licensing\n  // rather than being presented as a generic or patient-specific body.\n  await page.getByRole('button', { name: 'Organs', exact: true }).first().click()\n  await page.getByRole('button', { name: 'Breast', exact: true }).first().click()\n  await page.locator('canvas[data-organ-model3d="breast-reference"]').first().waitFor({ state: 'visible', timeout: 45_000 })\n  await page.getByText(/16 named structures from 16 source meshes/i).first().waitFor({ state: 'visible', timeout: 10_000 })\n  await page.getByText(/HuBMAP Human Reference Atlas · female reference object/i).first().waitFor({ state: 'visible', timeout: 10_000 })\n  metrics.breastReferenceProvenanceVisible = true\n\n  // Functional regional context: Heart keeps its primary BodyParts3D close-up\n  // but can deliberately switch to the HRA chambers/valves relationship view.\n  await page.getByRole('button', { name: 'Organs', exact: true }).first().click()\n  await page.getByRole('button', { name: 'Heart', exact: true }).first().click()\n  const regionalButton = page.getByRole('button', { name: 'Regional relationships', exact: true })\n  await regionalButton.waitFor({ state: 'visible', timeout: 10_000 })\n  await regionalButton.click()\n  await page.locator('canvas[data-organ-model3d="heart-regional-reference"]').first().waitFor({ state: 'visible', timeout: 45_000 })\n  await page.getByText(/14 named structures from 14 source meshes/i).first().waitFor({ state: 'visible', timeout: 10_000 })\n  await page.getByText(/HuBMAP Human Reference Atlas · female reference object/i).first().waitFor({ state: 'visible', timeout: 10_000 })\n  metrics.heartRegionalRelationshipsUsable = true\n\n  if (pageErrors.length) throw new Error(\`Browser page errors: \${pageErrors.join(' | ')}\`)`,
  'mobile reference provenance and regional smoke',
)

console.log('Applied guarded Body Exposure anatomy completion patch.')
