import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { lacunasDeAtribuicao } from '../../src/domains/body-exposure/engine/attributionCoverage.ts'

// ── Unidade: positivo / negativo / pareado
const pagina = 'Sources: Z-Anatomy and BodyParts3D (CC BY-SA 4.0), HuBMAP (CC BY 4.0), ICRP Publication 156 and Publication 145. CC0 1.0 atlas.'
assert.deepEqual(lacunasDeAtribuicao(['CC BY-SA 4.0', 'CC BY 4.0; extra'], ['Z-Anatomy (derived from BodyParts3D)'], pagina), [])
// Licença que existe nos dados mas não está na página → lacuna nomeada
assert.deepEqual(lacunasDeAtribuicao(['CC0 1.0; combined atlas layer CC BY-SA 4.0'], [], 'Z-Anatomy CC BY-SA 4.0'),
  [{ tipo: 'licenca', valor: 'CC0 1.0', motivo: 'ausente-na-pagina' }])
// Pareado: só a página muda → deixa de ser lacuna
assert.deepEqual(lacunasDeAtribuicao(['CC0 1.0'], [], 'CC0 1.0'), [])
// Fail-closed: licença/fonte desconhecida nunca passa
assert.deepEqual(lacunasDeAtribuicao(['MIT'], [], pagina), [{ tipo: 'licenca', valor: 'MIT', motivo: 'desconhecida' }])
assert.deepEqual(lacunasDeAtribuicao([], ['Some New Atlas'], pagina), [{ tipo: 'fonte', valor: 'Some New Atlas', motivo: 'desconhecida' }])
assert.deepEqual(lacunasDeAtribuicao([''], [''], pagina).map((l) => l.motivo), ['desconhecida', 'desconhecida'], 'valor vazio não é reconhecido')
// Página vazia / tipo errado → tudo ausente, sem lançar
assert.equal(lacunasDeAtribuicao(['CC BY 4.0'], [], '').length, 1)
assert.equal(lacunasDeAtribuicao(['CC BY 4.0'], [], undefined as unknown as string).length, 1)
// Caixa e espaços não importam; subcadeia não engana (CC BY 4.0 ≠ CC BY-SA 4.0)
assert.deepEqual(lacunasDeAtribuicao(['cc  by   4.0'], [], 'cc by 4.0'), [])
assert.equal(lacunasDeAtribuicao(['CC BY 4.0'], [], 'only CC BY-SA 4.0 here').length, 1, '"CC BY 4.0" não pode ser satisfeito por "CC BY-SA 4.0"')
assert.deepEqual(lacunasDeAtribuicao(['CC BY 4.0'], [], pagina), lacunasDeAtribuicao(['CC BY 4.0'], [], pagina), 'determinismo')

// ── Dados reais: lê só o chunk JSON de cada GLB publicado (extras dos nós)
const dir = new URL('../../public/bodyexposure/', import.meta.url)
const licencas = new Set<string>(), fontes = new Set<string>()
let glb = 0, comMeta = 0
for (const nome of readdirSync(dir).filter((f) => f.endsWith('.glb'))) {
  const buf = readFileSync(new URL(nome, dir))
  assert.equal(buf.readUInt32LE(0), 0x46546c67, `${nome}: cabeçalho glTF`)
  const len = buf.readUInt32LE(12)
  assert.equal(buf.readUInt32LE(16), 0x4e4f534a, `${nome}: primeiro chunk deve ser JSON`)
  const json = JSON.parse(buf.subarray(20, 20 + len).toString('utf8')) as { nodes?: { extras?: Record<string, unknown> }[] }
  glb++
  for (const n of json.nodes ?? []) {
    const e = n.extras
    if (e && typeof e.panacea_license === 'string' && e.panacea_license.trim()) { licencas.add(e.panacea_license); comMeta++ }
    if (e && typeof e.panacea_source === 'string' && e.panacea_source.trim()) fontes.add(e.panacea_source)
  }
}
assert.ok(glb > 100, `esperava >100 GLB publicados, li ${glb}`)
assert.ok(comMeta > 10000, `esperava >10000 nós com licença, li ${comMeta}`)
const paginaOficial = readFileSync(new URL('provenance.html', dir), 'utf8')
const lacunas = lacunasDeAtribuicao([...licencas], [...fontes], paginaOficial)
assert.deepEqual(lacunas, [], `lacunas de atribuição: ${JSON.stringify(lacunas)}`)

// A página do app aponta para a página oficial
const canonico = readFileSync(new URL('../../src/pages/CanonicalBody.tsx', import.meta.url), 'utf8')
assert.ok(canonico.includes('provenance.html') && canonico.includes('Sources and provenance'), 'CanonicalBody deve ligar a página de proveniência')
console.log(`body-attribution-coverage: ok (${glb} GLB, ${licencas.size} licenças, ${fontes.size} fontes)`)
