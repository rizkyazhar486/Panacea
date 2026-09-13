import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  FOLDING_ROUTE,
  PROTEIN_FOLDING_BOUNDARY,
  PROTEIN_FOLDING_SOURCES,
  PROTEIN_TARGETS,
  type ProteinDiseaseDomain,
} from '../../lib/proteinFoldingDiseaseAtlas';

const DOMAIN_LABELS: Record<ProteinDiseaseDomain, string> = {
  cancer: 'Cancer',
  alzheimer: 'Alzheimer',
  parkinson: 'Parkinson',
  schizophrenia: 'Schizophrenia',
};

function residueColor(index: number) {
  const palette = [0x38bdf8, 0x22c55e, 0xf59e0b, 0xa78bfa, 0xf472b6, 0x60a5fa];
  return palette[index % palette.length];
}

export default function ProteinFoldingDiseaseAtlas3D() {
  const [domain, setDomain] = useState<ProteinDiseaseDomain>('cancer');
  const [targetId, setTargetId] = useState('tp53');
  const [stage, setStage] = useState(FOLDING_ROUTE[0].id);
  const mountRef = useRef<HTMLDivElement | null>(null);

  const targets = useMemo(() => PROTEIN_TARGETS.filter((target) => target.domains.includes(domain)), [domain]);
  const target = PROTEIN_TARGETS.find((item) => item.id === targetId && item.domains.includes(domain)) ?? targets[0];
  const stageInfo = FOLDING_ROUTE.find((item) => item.id === stage) ?? FOLDING_ROUTE[0];

  useEffect(() => {
    if (!targets.some((item) => item.id === targetId)) setTargetId(targets[0]?.id ?? 'tp53');
  }, [targets, targetId]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || !target) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617);
    scene.fog = new THREE.FogExp2(0x020617, 0.045);
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 80);
    camera.position.set(0, 2.8, 10.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.minDistance = 5;
    controls.maxDistance = 18;

    scene.add(new THREE.HemisphereLight(0xbfe9ff, 0x111827, 1.6));
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(5, 7, 8);
    scene.add(key);
    const rim = new THREE.PointLight(0x7c3aed, 18, 20, 2);
    rim.position.set(-5, 2, 3);
    scene.add(rim);

    const root = new THREE.Group();
    scene.add(root);

    // This is deliberately a schematic folding landscape, not an atomistic structure.
    const controlPoints: THREE.Vector3[] = [];
    for (let i = 0; i < 36; i++) {
      const t = i / 35;
      const x = -4.4 + t * 8.8;
      const y = Math.sin(t * Math.PI * 5) * (stage === 'sequence' ? 0.28 : 0.85) + Math.cos(t * Math.PI * 2) * 0.35;
      const z = Math.cos(t * Math.PI * 4) * (stage === 'sequence' ? 0.15 : 0.95);
      controlPoints.push(new THREE.Vector3(x, y, z));
    }
    const curve = new THREE.CatmullRomCurve3(controlPoints);
    const backbone = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 160, 0.075, 10, false),
      new THREE.MeshPhysicalMaterial({ color: 0x94a3b8, roughness: 0.32, metalness: 0.05, clearcoat: 0.35 }),
    );
    root.add(backbone);

    const residues: THREE.Mesh[] = [];
    controlPoints.forEach((point, index) => {
      const mesh = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.16 + (index % 3) * 0.015, 1),
        new THREE.MeshPhysicalMaterial({ color: residueColor(index), roughness: 0.25, clearcoat: 0.45 }),
      );
      mesh.position.copy(point);
      root.add(mesh);
      residues.push(mesh);
    });

    const pocket = new THREE.Mesh(
      new THREE.TorusKnotGeometry(0.42, 0.11, 80, 12, 2, 3),
      new THREE.MeshPhysicalMaterial({ color: 0x34d399, emissive: 0x064e3b, emissiveIntensity: 0.6, transparent: true, opacity: 0.82 }),
    );
    pocket.position.set(1.1, -0.1, 0.7);
    pocket.visible = stage === 'binding-pocket' || stage === 'ligand-screen';
    root.add(pocket);

    const ligand = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.28, 1),
      new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0x92400e, emissiveIntensity: 0.8 }),
    );
    ligand.position.set(-3.6, 1.2, 1.2);
    ligand.visible = stage === 'ligand-screen';
    root.add(ligand);

    let raf = 0;
    const animate = (time: number) => {
      const t = time * 0.001;
      controls.update();
      residues.forEach((mesh, index) => {
        const ensemble = stage === 'ensemble';
        mesh.position.y = controlPoints[index].y + (ensemble ? Math.sin(t * 1.8 + index * 0.55) * 0.08 : 0);
        mesh.position.z = controlPoints[index].z + (ensemble ? Math.cos(t * 1.4 + index * 0.4) * 0.06 : 0);
      });
      if (ligand.visible) {
        const p = (Math.sin(t * 0.8) + 1) / 2;
        ligand.position.lerpVectors(new THREE.Vector3(-3.6, 1.2, 1.2), new THREE.Vector3(1.1, 0.15, 0.75), p);
        ligand.rotation.x = t;
        ligand.rotation.y = t * 0.7;
      }
      root.rotation.y = Math.sin(t * 0.18) * 0.06;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };

    const resize = () => {
      const width = Math.max(1, mount.clientWidth);
      const height = Math.max(360, Math.min(680, width * 0.68));
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
          if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
          else object.material.dispose();
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [stage, target]);

  if (!target) return null;

  return (
    <section className="space-y-4" aria-labelledby="protein-folding-atlas-title">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.18em] text-violet-300">Body Exposure · Protein folding research</p>
        <h2 id="protein-folding-atlas-title" className="text-2xl font-semibold text-white">Protein Folding & Disease Mechanism Atlas</h2>
        <p className="max-w-5xl text-sm text-slate-300">Sequence → fold → conformational ensemble → binding pocket → ligand hypothesis → validation. The animated chain below is a clearly labelled explanatory folding landscape, not fabricated atomistic coordinates or molecular dynamics.</p>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Disease research domain">
        {(Object.keys(DOMAIN_LABELS) as ProteinDiseaseDomain[]).map((item) => (
          <button key={item} type="button" aria-pressed={item === domain} onClick={() => setDomain(item)} className="min-h-11 shrink-0 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-100 aria-pressed:border-violet-400 aria-pressed:bg-violet-500/10">
            {DOMAIN_LABELS[item]}
          </button>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.85fr)]">
        <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
          <div ref={mountRef} className="w-full" aria-label={`${target.protein} folding landscape 3D research visualization`} />
          <div className="flex gap-2 overflow-x-auto border-t border-slate-800 p-3">
            {FOLDING_ROUTE.map((item) => (
              <button key={item.id} type="button" aria-pressed={item.id === stage} onClick={() => setStage(item.id)} className="min-h-11 shrink-0 rounded-lg border border-slate-700 px-3 text-xs text-slate-100 aria-pressed:border-emerald-400 aria-pressed:bg-emerald-500/10">{item.label}</button>
            ))}
          </div>
        </div>

        <aside className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <label className="block text-xs uppercase tracking-wide text-slate-400">Protein target</label>
          <select value={target.id} onChange={(event) => setTargetId(event.target.value)} className="min-h-11 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-white">
            {targets.map((item) => <option key={item.id} value={item.id}>{item.gene} · {item.protein}</option>)}
          </select>

          <div className="rounded-xl border border-slate-800 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-400">Current stage</p>
            <h3 className="mt-1 font-medium text-white">{stageInfo.label}</h3>
            <p className="mt-2 text-sm text-slate-300">{stageInfo.description}</p>
            <p className="mt-2 text-xs text-emerald-200">Gate: {stageInfo.requirement}</p>
          </div>

          <div className="rounded-xl border border-slate-800 p-3 text-sm text-slate-300">
            <p className="font-medium text-white">{target.gene}</p>
            <p className="mt-1">{target.role}</p>
            <p className="mt-3 text-xs text-amber-200">{target.caveat}</p>
            <p className="mt-3 text-xs text-slate-400">Sequence provenance: {target.sequenceSource}{target.sequenceId ? ` · ${target.sequenceId}` : ''}</p>
            <p className="mt-1 text-xs text-slate-400">Atomic structure: {target.structureSource}{target.structureId ? ` · ${target.structureId}` : ' · not loaded; atomistic rendering remains blocked'}</p>
          </div>

          <div className="max-h-44 space-y-2 overflow-y-auto">
            {PROTEIN_FOLDING_SOURCES.map((source) => (
              <div key={source.id} className="rounded-lg border border-slate-800 p-2 text-xs text-slate-300"><span className="font-medium text-white">{source.label}</span> — {source.role}</div>
            ))}
          </div>
        </aside>
      </div>

      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-100">{PROTEIN_FOLDING_BOUNDARY}</div>
    </section>
  );
}
