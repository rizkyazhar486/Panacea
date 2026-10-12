import assert from 'node:assert/strict'
import fs from 'node:fs'
import { GLTFLoader } from '../../node_modules/three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from '../../node_modules/three/examples/jsm/libs/meshopt_decoder.module.js'
import { boneLoopSmoothness, type Quat } from '../../src/domains/body-exposure/engine/gaitLoopSmoothness.ts'

// ── Unidade
const rotZ = (deg: number): Quat => { const h = deg * Math.PI / 360; return [0, 0, Math.sin(h), Math.cos(h)] }
const t5 = [0, 1, 2, 3, 4]
// Velocidade angular constante (10°/s) e fechamento exato: sem salto na emenda, sem salto interior
const constante = boneLoopSmoothness(t5, [0, 10, 20, 30, 40].map(rotZ))
assert.ok(constante.omegaJumpDegS < 1e-9 && constante.interiorMaxDegS < 1e-9, 'velocidade constante não pode ter salto')
assert.ok(Math.abs(constante.seamDeg - 40) < 1e-9, 'emenda = ângulo entre primeira e última chave')
// Fechamento perfeito (última = primeira) → emenda 0
assert.ok(boneLoopSmoothness(t5, [0, 10, 20, 10, 0].map(rotZ)).seamDeg < 1e-9)
// Salto conhecido: 10°/s no início e 30°/s no fim → |Δω| = 20°/s exatamente
const salto = boneLoopSmoothness(t5, [0, 10, 20, 30, 60].map(rotZ))
assert.ok(Math.abs(salto.omegaJumpDegS - 20) < 1e-9, `salto esperado 20, obtido ${salto.omegaJumpDegS}`)
assert.ok(Math.abs(salto.interiorMaxDegS - 20) < 1e-9, 'interior: 10→10→30 = salto 20')
// Pareado: só o último intervalo muda (60→35) → salto cai para 5
assert.ok(Math.abs(boneLoopSmoothness(t5, [0, 10, 20, 30, 35].map(rotZ)).omegaJumpDegS - 5) < 1e-9)
// q e −q são a mesma rotação
const neg = (q: Quat): Quat => [-q[0], -q[1], -q[2], -q[3]]
const sinais = [0, 10, 20, 30, 60].map(rotZ).map((q, i) => (i % 2 ? neg(q) : q))
assert.ok(Math.abs(boneLoopSmoothness(t5, sinais).omegaJumpDegS - 20) < 1e-9, 'sinal do quaternião não pode alterar o resultado')
// q e −q fecham o loop: primeira = q, última = −q (mesma rotação) → emenda 0
const fechaComSinalTrocado = boneLoopSmoothness(t5, [0, 10, 20, 10, 0].map(rotZ).map((q, i, a) => (i === a.length - 1 ? neg(q) : q)))
assert.ok(fechaComSinalTrocado.seamDeg < 1e-9, `emenda com sinal trocado deve ser 0, obtido ${fechaComSinalTrocado.seamDeg}`)
// Determinismo
assert.deepEqual(boneLoopSmoothness(t5, [0, 10, 20, 30, 60].map(rotZ)), salto)
// Negativos: erro explícito, nunca valor tentado
const q5 = [0, 10, 20, 30, 40].map(rotZ)
assert.throws(() => boneLoopSmoothness([0, 1], [rotZ(0), rotZ(1)]), /need >=3 keys/)
assert.throws(() => boneLoopSmoothness(t5, q5.slice(0, 4)), /one quaternion per key/)
assert.throws(() => boneLoopSmoothness([0, 1, 1, 3, 4], q5), /strictly increasing/)
assert.throws(() => boneLoopSmoothness([0, 1, 0.5, 3, 4], q5), /strictly increasing/)
assert.throws(() => boneLoopSmoothness([0, 1, NaN, 3, 4], q5), /invalid key 2/)
assert.throws(() => boneLoopSmoothness(t5, [q5[0], q5[1], [0, 0, 0, 0], q5[3], q5[4]]), /invalid key 2/)
assert.throws(() => boneLoopSmoothness(t5, [q5[0], q5[1], [0, 0, Infinity, 1], q5[3], q5[4]]), /invalid key 2/)

// ── Reprodução independente a partir dos GLB publicados (decodificação meshopt via three)
const mediana = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2 }
const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder)
async function medir(arquivo: string) {
  const buf = fs.readFileSync(new URL(`../../public/bodyexposure/${arquivo}`, import.meta.url))
  const gltf = await new Promise<{ animations: { name: string; tracks: { name: string; times: ArrayLike<number>; values: ArrayLike<number> }[] }[] }>((res, rej) =>
    loader.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer, '', res as never, rej))
  const clipes: Record<string, { osso: string; r: ReturnType<typeof boneLoopSmoothness> }[]> = {}
  for (const clip of gltf.animations.filter((a) => a.name === 'WALK' || a.name === 'RUN')) {
    clipes[clip.name] = clip.tracks.filter((t) => t.name.endsWith('.quaternion') && t.times.length >= 3).map((t) => {
      const qs: Quat[] = []
      for (let i = 0; i < t.times.length; i++) qs.push([t.values[4 * i], t.values[4 * i + 1], t.values[4 * i + 2], t.values[4 * i + 3]])
      return { osso: t.name.replace('.quaternion', ''), r: boneLoopSmoothness(Array.from(t.times), qs) }
    })
  }
  return clipes
}
const sanea = (n: string) => n.replace(/\./g, '') // three remove "." dos nomes de nó
for (const [glb, relatorio] of [['adult_male.rig_rom.glb', 'gait_loop_continuity.json'], ['vhf_denver_ct_adult_female.rig_rom.glb', 'gait_loop_continuity_vhf_female.json']] as const) {
  const local = JSON.parse(fs.readFileSync(new URL(`../../bodyexposure/qa_reports/${relatorio}`, import.meta.url), 'utf8')) as { clips: Record<string, { animated_rotation_channels: number; max_seam_deg: number; max_omega_jump_deg_s: number; worst_omega_jump_bone: string; median_omega_jump_deg_s: number; bones_seam_jump_above_interior_max: string[] }> }
  const meu = await medir(glb)
  for (const nome of ['WALK', 'RUN']) {
    const l = local.clips[nome], bones = meu[nome]
    assert.ok(bones, `${glb}: clipe ${nome} ausente`)
    assert.equal(bones.length, l.animated_rotation_channels, `${glb} ${nome}: nº de ossos animados`)
    const pior = bones.reduce((a, b) => (b.r.omegaJumpDegS > a.r.omegaJumpDegS ? b : a))
    assert.ok(Math.abs(pior.r.omegaJumpDegS - l.max_omega_jump_deg_s) <= 0.1, `${glb} ${nome}: salto máx ${pior.r.omegaJumpDegS.toFixed(2)} vs relatório ${l.max_omega_jump_deg_s}`)
    assert.equal(pior.osso, sanea(l.worst_omega_jump_bone), `${glb} ${nome}: osso do pior salto`)
    assert.ok(Math.abs(mediana(bones.map((b) => b.r.omegaJumpDegS)) - l.median_omega_jump_deg_s) <= 0.1, `${glb} ${nome}: mediana`)
    assert.ok(Math.max(...bones.map((b) => b.r.seamDeg)) <= 1e-3 && l.max_seam_deg <= 1e-3, `${glb} ${nome}: emenda de posição`)
    // Limite técnico documentado: nenhum osso pode ter salto na emenda maior que o máximo entre intervalos do próprio clipe
    const acima = bones.filter((b) => b.r.omegaJumpDegS > b.r.interiorMaxDegS).map((b) => b.osso)
    assert.deepEqual(acima, [], `${glb} ${nome}: ossos com emenda mais abrupta que o interior`)
    assert.deepEqual(l.bones_seam_jump_above_interior_max, [])
  }
}
console.log('body-gait-loop-reproduction: ok')
