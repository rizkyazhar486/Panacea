// Pakai: node scripts/qa/glb-gait-seam-reproduce.mjs public/bodyexposure/adult_male.rig_rom.glb (bukan gerbang CI)
// Reproduksi independen D6 (kontinuitas loop WALK/RUN): decode meshopt lewat three, bandingkan keyframe pertama vs terakhir.
import fs from 'node:fs';
import { GLTFLoader } from '../../node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from '../../node_modules/three/examples/jsm/libs/meshopt_decoder.module.js';
const buf = fs.readFileSync(process.argv[2]);
const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
const gltf = await new Promise((res, rej) => loader.parse(ab, '', res, rej));
for (const clip of gltf.animations) {
  if (!['WALK', 'RUN'].includes(clip.name)) continue;
  let worst = 0, who = null, trMax = 0, n = 0;
  for (const t of clip.tracks) {
    const sz = t.getValueSize(), v = t.values, a = v.slice(0, sz), z = v.slice(v.length - sz);
    if (t.name.endsWith('.quaternion')) {
      const na = Math.hypot(...a), nz = Math.hypot(...z); const d = Math.min(1, Math.abs(a.reduce((s, x, i) => s + x * z[i], 0) / (na * nz)));
      const deg = 2 * Math.acos(d) * 180 / Math.PI; n++;
      if (deg > worst) { worst = deg; who = t.name; }
    } else if (t.name.endsWith('.position')) trMax = Math.max(trMax, Math.hypot(...a.map((x, i) => x - z[i])));
  }
  console.log(clip.name, 'duration', clip.duration.toFixed(4), 'tracks', clip.tracks.length, 'quat tracks', n, 'max first-vs-last deg', worst.toFixed(4), who, 'max position gap m', trMax.toFixed(5));
}
