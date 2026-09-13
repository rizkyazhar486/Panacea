import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const panel = await readFile(new URL('../../src/pages/bodyhub/VertikalMolekulerPanel.tsx', import.meta.url), 'utf8')
const cinematic = await readFile(new URL('../../src/components/digital-twin/BodyToCellCinematic.tsx', import.meta.url), 'utf8')

assert.match(panel, /lazy\(\(\) => import\('\.\.\/\.\.\/components\/digital-twin\/BodyToCellCinematic'\)\)/, 'Cell→DNA cinematic must stay lazy-loaded from the reachable Tissue→Gene panel')
assert.match(panel, /aria-controls="body-cell-dna-cinematic"/, 'open control must be associated with the cinematic region')
assert.match(panel, /aria-expanded=\{cinematicOpen\}/, 'open control must expose expanded state')
assert.match(panel, /role="region" aria-label="Cell to DNA cinematic 3D"/, 'cinematic render must expose a named region')
assert.match(panel, /educational reference scene/i, 'scale transition must disclose its educational representation boundary')
assert.match(panel, /not literal continuity/i, 'Tissue→Gene must not pretend the procedural cell scene is literal gross-anatomy continuity')
assert.match(cinematic, /CinematicCellGenomeExplorer/, 'reachable surface must still mount the actual Three.js cellular explorer')
assert.match(cinematic, /DigitalTwinEngine/, 'existing evidence/control engine must remain preserved')

console.log('OK body-cell-dna-cinematic-entry: reachable lazy structural visualization with explicit scale/evidence boundary')
