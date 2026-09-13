import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SYNAPSE_MICRO_BOUNDARY, SYNAPSE_PHASES, SYNAPSE_TRANSMITTERS, type SynapsePhase } from '../../lib/discoverySynapseMicro3D';

function makeMembrane(width: number, depth: number, y: number, color: number) {
  const group = new THREE.Group();
  const headMaterial = new THREE.MeshPhysicalMaterial({ color, roughness: 0.48, metalness: 0.02, clearcoat: 0.25 });
  const tailMaterial = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.75 });
  for (let x = -width / 2; x <= width / 2; x += 0.42) {
    for (let z = -depth / 2; z <= depth / 2; z += 0.42) {
      const top = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 9), headMaterial);
      top.position.set(x, y + 0.14, z);
      const bottom = top.clone();
      bottom.position.y = y - 0.14;
      group.add(top, bottom);
      const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.24, 6), tailMaterial);
      tail.position.set(x, y, z);
      group.add(tail);
    }
  }
  return group;
}

export default function SynapseMicro3DLab() {
  const [phase, setPhase] = useState<SynapsePhase>('resting');
  const [transmitterId, setTransmitterId] = useState('glutamate');
  const mountRef = useRef<HTMLDivElement | null>(null);
  const phaseIndex = Math.max(0, SYNAPSE_PHASES.findIndex((item) => item.id === phase));
  const transmitter = useMemo(() => SYNAPSE_TRANSMITTERS.find((item) => item.id === transmitterId) ?? SYNAPSE_TRANSMITTERS[0], [transmitterId]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020617, 0.028);
    const camera = new THREE.PerspectiveCamera(44, 1, 0.1, 80);
    camera.position.set(7.6, 5.2, 10.8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 0, 0);
    controls.minDistance = 5;
    controls.maxDistance = 20;

    scene.add(new THREE.HemisphereLight(0xcbd5e1, 0x07111f, 1.8));
    const key = new THREE.PointLight(0x60a5fa, 55, 25, 2);
    key.position.set(4, 5, 6);
    scene.add(key);
    const rim = new THREE.PointLight(0xf472b6, 35, 20, 2);
    rim.position.set(-5, -1, -3);
    scene.add(rim);

    const root = new THREE.Group();
    scene.add(root);
    root.add(makeMembrane(6.6, 5.2, 1.2, 0x1d4ed8));
    root.add(makeMembrane(6.6, 5.2, -1.2, 0x7c3aed));

    const vesicleMaterial = new THREE.MeshPhysicalMaterial({ color: 0xfb923c, emissive: 0x7c2d12, emissiveIntensity: 0.45, transmission: 0.08, roughness: 0.3, clearcoat: 0.6 });
    const vesicles: THREE.Mesh[] = [];
    for (let i = 0; i < 10; i++) {
      const vesicle = new THREE.Mesh(new THREE.SphereGeometry(0.34, 24, 18), vesicleMaterial);
      const row = Math.floor(i / 5);
      vesicle.position.set(-2.1 + (i % 5) * 1.02, 2.35 + row * 0.65, -0.9 + row * 1.2);
      root.add(vesicle);
      vesicles.push(vesicle);
    }

    const calciumMaterial = new THREE.MeshStandardMaterial({ color: 0x22d3ee, emissive: 0x0891b2, emissiveIntensity: 1.1 });
    const calciumParticles: THREE.Mesh[] = [];
    for (let i = 0; i < 14; i++) {
      const ion = new THREE.Mesh(new THREE.IcosahedronGeometry(0.095, 1), calciumMaterial);
      ion.position.set(-2.6 + (i % 7) * 0.8, 3.8 + Math.floor(i / 7) * 0.55, -1.6 + (i % 3) * 1.6);
      root.add(ion);
      calciumParticles.push(ion);
    }

    const transmitterMaterial = new THREE.MeshStandardMaterial({ color: transmitterId === 'gaba' ? 0x8b5cf6 : transmitterId === 'dopamine' ? 0xf59e0b : transmitterId === 'serotonin' ? 0xec4899 : transmitterId === 'acetylcholine' ? 0x22c55e : transmitterId === 'norepinephrine' ? 0xfacc15 : 0xef4444, emissive: 0xffffff, emissiveIntensity: 0.15 });
    const transmitterParticles: THREE.Mesh[] = [];
    for (let i = 0; i < 42; i++) {
      const particle = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), transmitterMaterial);
      particle.position.set(-2.8 + (i % 7) * 0.9, 0.88, -2 + Math.floor(i / 7) * 0.72);
      root.add(particle);
      transmitterParticles.push(particle);
    }

    const receptorMaterial = new THREE.MeshPhysicalMaterial({ color: 0x34d399, roughness: 0.32, metalness: 0.08, clearcoat: 0.5 });
    const receptors: THREE.Group[] = [];
    for (let i = 0; i < 11; i++) {
      const receptor = new THREE.Group();
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 0.7, 10), receptorMaterial);
      const crown = new THREE.Mesh(new THREE.TorusGeometry(0.21, 0.055, 10, 20), receptorMaterial);
      crown.rotation.x = Math.PI / 2;
      crown.position.y = 0.34;
      receptor.add(stem, crown);
      receptor.position.set(-2.5 + (i % 6) * 1.0, -1.56, -1.7 + Math.floor(i / 6) * 2.9);
      root.add(receptor);
      receptors.push(receptor);
    }

    const transporterMaterial = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.1, roughness: 0.4 });
    for (let i = 0; i < 5; i++) {
      const transporter = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.72, 0.28), transporterMaterial);
      transporter.position.set(-2 + i * 1.0, 1.48, 2.15);
      root.add(transporter);
    }

    const activeZone = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 0.08, 64), new THREE.MeshPhysicalMaterial({ color: 0xf97316, transparent: true, opacity: 0.18, emissive: 0xea580c, emissiveIntensity: 0.8 }));
    activeZone.position.y = 1.02;
    root.add(activeZone);

    let raf = 0;
    const animate = (time: number) => {
      const t = time * 0.001;
      controls.update();
      calciumParticles.forEach((particle, i) => {
        const active = phaseIndex >= 2;
        particle.visible = active;
        if (active) particle.position.y = 3.6 - ((t * 0.75 + i * 0.12) % 2.25);
      });
      vesicles.forEach((vesicle, i) => {
        const docking = phaseIndex >= 3;
        const target = docking && i < 4 ? 1.72 : 2.35 + Math.floor(i / 5) * 0.65;
        vesicle.position.y += (target - vesicle.position.y) * 0.035;
        vesicle.scale.setScalar(1 + Math.sin(t * 2 + i) * 0.025);
      });
      transmitterParticles.forEach((particle, i) => {
        const releasing = phaseIndex >= 4;
        particle.visible = releasing;
        if (releasing) {
          const p = (t * 0.34 + i * 0.029) % 1;
          particle.position.y = 0.94 - p * 1.72;
          particle.position.x += Math.sin(t * 1.8 + i) * 0.0008;
        }
      });
      receptors.forEach((receptor, i) => {
        const active = phaseIndex >= 5;
        receptor.rotation.y = active ? Math.sin(t * 2.2 + i) * 0.18 : 0;
        receptor.scale.setScalar(active ? 1.05 + Math.sin(t * 3 + i) * 0.05 : 1);
      });
      root.rotation.y = Math.sin(t * 0.18) * 0.08;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };

    const resize = () => {
      const width = Math.max(1, mount.clientWidth);
      const height = Math.max(360, Math.min(680, width * 0.73));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();
    raf = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      controls.dispose();
      root.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const material = object.material;
          if (Array.isArray(material)) material.forEach((item) => item.dispose()); else material.dispose();
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [phaseIndex, transmitterId]);

  const phaseInfo = SYNAPSE_PHASES[phaseIndex];

  return (
    <section className="space-y-4" aria-labelledby="synapse-micro-title">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">Discovery · Neuropsychiatry 3D · Micro scale</p>
        <h2 id="synapse-micro-title" className="text-xl font-semibold text-white">Synapse microenvironment — animated mechanism studio</h2>
        <p className="max-w-4xl text-sm text-slate-300">Rotate through a schematic synaptic microenvironment and step through depolarization, Ca²⁺ entry, vesicle docking, release, receptor interaction and clearance. Geometry and timing are explanatory encodings, not microscopy or measured patient physiology.</p>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Neurotransmitter selector">
        {SYNAPSE_TRANSMITTERS.map((item) => (
          <button key={item.id} type="button" aria-pressed={item.id === transmitter.id} onClick={() => setTransmitterId(item.id)} className="min-h-11 shrink-0 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-100 aria-pressed:border-cyan-400 aria-pressed:bg-cyan-500/10">{item.label}</button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(300px,1fr)]">
        <div className="min-w-0 overflow-hidden rounded-xl border border-slate-800 bg-slate-950/65">
          <div ref={mountRef} className="w-full" aria-label={`${transmitter.label} synapse 3D mechanism visualization`} />
        </div>

        <aside className="space-y-4 rounded-xl border border-slate-800 bg-slate-950/45 p-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Mechanism phase</p>
            <h3 className="mt-1 font-medium text-white">{phaseInfo.label}</h3>
            <p className="mt-2 text-sm text-slate-300">{phaseInfo.explanation}</p>
          </div>

          <div className="space-y-2">
            {SYNAPSE_PHASES.map((item) => (
              <button key={item.id} type="button" onClick={() => setPhase(item.id)} aria-pressed={phase === item.id} className="min-h-11 w-full rounded-lg border border-slate-700 px-3 py-2 text-left text-sm text-slate-200 aria-pressed:border-emerald-400 aria-pressed:bg-emerald-500/10">{item.label}</button>
            ))}
          </div>

          <div className="rounded-lg border border-slate-800 p-3 text-xs text-slate-300">
            <p className="font-medium text-white">Receptor-family examples</p>
            <p className="mt-1">{transmitter.receptorExamples.join(' · ')}</p>
            <p className="mt-3 font-medium text-white">Clearance examples</p>
            <p className="mt-1">{transmitter.clearanceExamples.join(' · ')}</p>
          </div>

          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-100">{transmitter.boundary}</div>
        </aside>
      </div>

      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-100">{SYNAPSE_MICRO_BOUNDARY}</div>
    </section>
  );
}
