import { readFileSync, writeFileSync } from 'node:fs'

const replaceOne = (source, from, to, label) => {
  const first = source.indexOf(from)
  if (first < 0) throw new Error(`Missing patch target: ${label}`)
  if (source.indexOf(from, first + from.length) >= 0) throw new Error(`Non-unique patch target: ${label}`)
  return source.slice(0, first) + to + source.slice(first + from.length)
}

const replaceAllCounted = (source, from, to, expected, label) => {
  const count = source.split(from).length - 1
  if (count !== expected) throw new Error(`Expected ${expected} occurrences for ${label}, found ${count}`)
  return source.split(from).join(to)
}

const viewerPath = 'src/components/OrganModel3D.tsx'
let viewer = readFileSync(viewerPath, 'utf8')
viewer = replaceOne(
  viewer,
  "    let highlighted: THREE.Mesh | null = null\n",
  "    const highlighted = new Set<THREE.Mesh>()\n",
  'highlight storage',
)
viewer = replaceOne(
  viewer,
  `    const restoreHighlight = () => {\n      if (!highlighted) return\n      const material = highlighted.material as THREE.MeshStandardMaterial\n      const original = originalEmissive.get(highlighted)\n      if (original) material.emissive.copy(original)\n      highlighted = null\n    }\n\n    const applyHighlight = (value?: string | null) => {\n      restoreHighlight()\n      const wanted = selectionName(value).toLowerCase()\n      if (!wanted) return\n      const hit = namedMeshes.find(\n        (mesh) => String(mesh.userData.panaceaDisplayName ?? displayMeshName(mesh.name)).toLowerCase() === wanted,\n      )\n      if (!hit) return\n      const material = hit.material as THREE.MeshStandardMaterial\n      material.emissive.set(organ.accent).multiplyScalar(0.35)\n      highlighted = hit\n    }\n`,
  `    const restoreHighlight = () => {\n      for (const mesh of highlighted) {\n        const material = mesh.material as THREE.MeshStandardMaterial\n        const original = originalEmissive.get(mesh)\n        if (original) material.emissive.copy(original)\n      }\n      highlighted.clear()\n    }\n\n    const applyHighlight = (value?: string | null) => {\n      restoreHighlight()\n      const wanted = selectionName(value).toLowerCase()\n      if (!wanted) return\n      const hits = namedMeshes.filter(\n        (mesh) => String(mesh.userData.panaceaDisplayName ?? displayMeshName(mesh.name)).toLowerCase() === wanted,\n      )\n      for (const hit of hits) {\n        const material = hit.material as THREE.MeshStandardMaterial\n        material.emissive.set(organ.accent).multiplyScalar(0.35)\n        highlighted.add(hit)\n      }\n    }\n`,
  'multi-fragment highlight',
)
viewer = replaceOne(
  viewer,
  "        // Reference organ GLBs contain individually named BodyParts3D meshes.\n        // Expose all of those names rather than only the eight largest hotspot\n        // shortcuts. AI close-ups remain marker-only because one generated mesh\n        // does not provide evidence for internal anatomical boundaries.\n        if (organ.sumber === 'bodyparts3d') {\n",
  "        // Reference organ GLBs contain individually named anatomy meshes.\n        // Expose semantic names from BodyParts3D, Z-Anatomy, or HRA. AI close-ups\n        // remain marker-only because a generated surface is not boundary evidence.\n        if (organ.sumber && organ.sumber !== 'ai') {\n",
  'reference inventory gate',
)
viewer = replaceOne(
  viewer,
  "      if (organ.sumber !== 'bodyparts3d' || !namedMeshes.length) return\n",
  "      if (!organ.sumber || organ.sumber === 'ai' || !namedMeshes.length) return\n",
  'reference raycast gate',
)
viewer = replaceAllCounted(
  viewer,
  "organ.sumber === 'bodyparts3d'",
  "organ.sumber && organ.sumber !== 'ai'",
  3,
  'reference JSX gates',
)
viewer = replaceOne(
  viewer,
  "                {partNames.length} source meshes in this close-up · BodyParts3D 4.0\n",
  "                {partNames.length} named structures from {organ.jumlahMesh ?? partNames.length} source meshes ·{' '}\n                {organ.sourceLabel ?? (organ.sumber === 'bodyparts3d' ? 'BodyParts3D 4.0' : organ.sumber)}\n",
  'semantic inventory copy',
)
writeFileSync(viewerPath, viewer)

const qaPath = 'scripts/qa/organ-detail-mobile-smoke.mjs'
let qa = readFileSync(qaPath, 'utf8')
qa = replaceOne(
  qa,
  "  await page.getByText(/26 source meshes in this close-up/i).waitFor({ state: 'visible', timeout: 10_000 })\n",
  "  await page.getByText(/22 named structures from 26 source meshes/i).waitFor({ state: 'visible', timeout: 10_000 })\n",
  'eye semantic inventory assertion',
)
qa = replaceOne(qa, "  const showAll = namedCard.getByRole('button', { name: 'Show all 26', exact: true })\n", "  const showAll = namedCard.getByRole('button', { name: 'Show all 22', exact: true })\n", 'eye show all')
qa = replaceOne(qa, "  if (namedButtonCount !== 26) throw new Error(`Expected 26 eye source-mesh buttons after Show all, found ${namedButtonCount}`)\n", "  if (namedButtonCount !== 22) throw new Error(`Expected 22 unique eye anatomy controls after Show all, found ${namedButtonCount}`)\n", 'eye unique control count')
qa = replaceOne(
  qa,
  `  // A generated Tripo model is intentionally not treated as a set of verified\n  // internal anatomical meshes. Switching to Brain must remove the reference\n  // inventory rather than fabricate labels from its single generated surface.\n  await page.getByRole('button', { name: 'Organs', exact: true }).first().click()\n  await page.getByRole('button', { name: 'Brain', exact: true }).first().click()\n  await page.locator('canvas[data-organ-model3d="brain"]').first().waitFor({ state: 'visible', timeout: 45_000 })\n  await page.getByText(/AI-generated model \\(Tripo\\)/i).waitFor({ state: 'visible', timeout: 10_000 })\n  metrics.aiModelShowsReferenceMeshInventory = await page.getByText('Named reference anatomy', { exact: true }).isVisible().catch(() => false)\n  if (metrics.aiModelShowsReferenceMeshInventory) {\n    throw new Error('AI-generated brain close-up incorrectly exposes a verified reference-mesh inventory')\n  }\n`,
  `  // Brain has now been promoted from a Tripo approximation to BodyParts3D\n  // reference anatomy. Assert that the promotion is real and exposes its\n  // semantic inventory rather than silently falling back to the old AI model.\n  await page.getByRole('button', { name: 'Organs', exact: true }).first().click()\n  await page.getByRole('button', { name: 'Brain', exact: true }).first().click()\n  await page.locator('canvas[data-organ-model3d="brain"]').first().waitFor({ state: 'visible', timeout: 45_000 })\n  await page.getByText('Named reference anatomy', { exact: true }).waitFor({ state: 'visible', timeout: 45_000 })\n  await page.getByText(/45 named structures from 51 source meshes/i).waitFor({ state: 'visible', timeout: 10_000 })\n  metrics.brainReferenceInventoryVisible = true\n  metrics.brainStillShowsTripo = await page.getByText(/AI-generated model \\(Tripo\\)/i).isVisible().catch(() => false)\n  if (metrics.brainStillShowsTripo) throw new Error('Brain still reports the obsolete Tripo source after reference promotion')\n`,
  'brain reference promotion assertion',
)
writeFileSync(qaPath, qa)

console.log('Applied guarded organ reference viewer + QA patch.')
