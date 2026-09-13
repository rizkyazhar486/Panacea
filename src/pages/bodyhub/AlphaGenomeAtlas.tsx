import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  ALPHA_GENOME_ATLAS_BOUNDARY,
  ALPHA_GENOME_SEED_RECORDS,
  ALPHA_GENOME_SOURCES,
  type GenomeAtlasRecord,
} from '../../lib/alphaGenomeAtlas';

function genomeColor(symbol: string) {
  let hash = 0;
  for (const char of symbol) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return new THREE.Color().setHSL((hash % 360) / 360, 0.72, 0.58);
}

function GenomeScene({ record }: { record: GenomeAtlasRecord }) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617);
    scene.fog = new THREE.FogExp2(0x020617, 0.045);

    const camera = new THREE.PerspectiveCamera(44, 1, 0.1, 80);
    camera.position.set(0, 1.1, 12);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.055;
    controls.minDistance = 5.5;
    controls.maxDistance = 20;

    scene.add(new THREE.HemisphereLight(0xbfe8ff, 0x07111f, 1.7));
    const key = new THREE.PointLight(0xffffff, 42, 24, 2);
    key.position.set(5, 7, 6);
    scene.add(key);
    const rim = new THREE.PointLight(0x8b5cf6, 28, 18, 2);
    rim.position.set(-5, 0, -2);
    scene.add(rim);

    const root = new THREE.Group();
    scene.add(root);

    const accent = genomeColor(record.symbol);
    const chromosomeMaterial = new THREE.MeshPhysicalMaterial({
      color: accent,
      roughness: 0.28,
      metalness: 0.04,
      clearcoat: 0.55,
      transparent: true,
      opacity: 0.92,
    });

    const makeArm = (x: number, y: number, rotation: number) => {
      const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.55, 3.4, 16, 24), chromosomeMaterial);
      arm.position.set(x, y, 0);
      arm.rotation.z = rotation;
      return arm;
    };
    const chromosome = new THREE.Group();
    chromosome.position.x = -3.8;
    chromosome.scale.setScalar(0.92);
    chromosome.add(makeArm(-0.62, 0.7, -0.22), makeArm(0.62, 0.7, 0.22));
    root.add(chromosome);

    const helix = new THREE.Group();
    helix.position.set(1.0, 0, 0);
    const backboneMaterial = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0c4a6e, emissiveIntensity: 0.45 });
    const pairMaterial = new THREE.MeshStandardMaterial({ color: 0xf472b6, emissive: 0x831843, emissiveIntensity: 0.36 });
    const pointsA: THREE.Vector3[] = [];
    const pointsB: THREE.Vector3[] = [];
    const turns = 5.2;
    const steps = 88;
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      const angle = t * Math.PI * 2 * turns;
      const y = -3.2 + t * 6.4;
      pointsA.push(new THREE.Vector3(Math.cos(angle) * 0.82, y, Math.sin(angle) * 0.82));
      pointsB.push(new THREE.Vector3(Math.cos(angle + Math.PI) * 0.82, y, Math.sin(angle + Math.PI) * 0.82));
      if (i % 4 === 0) {
        const geometry = new THREE.BufferGeometry().setFromPoints([pointsA[i], pointsB[i]]);
        helix.add(new THREE.Line(geometry, pairMaterial));
      }
    }
    for (const points of [pointsA, pointsB]) {
      const curve = new THREE.CatmullRomCurve3(points);
      helix.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 180, 0.055, 8, false), backboneMaterial));
    }
    root.add(helix);

    const locus = new THREE.Mesh(
      new THREE.TorusGeometry(1.25, 0.06, 12, 80),
      new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.82 }),
    );
    locus.position.set(1.0, 0.35, 0);
    locus.rotation.x = Math.PI / 2;
    root.add(locus);

    const protein = new THREE.Mesh(
      new THREE.TorusKnotGeometry(0.7, 0.19, 120, 18, 2, 3),
      new THREE.MeshPhysicalMaterial({ color: 0xf59e0b, roughness: 0.32, clearcoat: 0.48 }),
    );
    protein.position.set(4.25, -0.7, 0.2);
    root.add(protein);

    const bridgeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(1.8, 0, 0),
      new THREE.Vector3(2.8, 1.0, 0.5),
      new THREE.Vector3(4.0, -0.1, 0.2),
    ]);
    const bridge = new THREE.Mesh(
      new THREE.TubeGeometry(bridgeCurve, 50, 0.045, 8, false),
      new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x14532d, emissiveIntensity: 0.6 }),
    );
    root.add(bridge);

    const signal = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 10), new THREE.MeshBasicMaterial({ color: 0xbbf7d0 }));
    root.add(signal);

    const clock = new THREE.Clock();
    let raf = 0;
    const animate = () => {
      const elapsed = clock.getElapsedTime();
      controls.update();
      chromosome.rotation.y = Math.sin(elapsed * 0.28) * 0.18;
      helix.rotation.y = elapsed * 0.13;
      protein.rotation.x = elapsed * 0.17;
      protein.rotation.y = elapsed * 0.23;
      signal.position.copy(bridgeCurve.getPointAt((elapsed * 0.12) % 1));
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };

    const resize = () => {
      const width = Math.max(1, mount.clientWidth);
      const height = Math.max(380, Math.min(680, width * 0.66));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();
    animate();

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      controls.dispose();
      root.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
          object.geometry.dispose();
          const material = object.material;
          if (Array.isArray(material)) material.forEach((item) => item.dispose()); else material.dispose();
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [record]);

  return <div ref={mountRef} className="w-full" aria-label={`${record.symbol} chromosome DNA protein 3D atlas`} />;
}

export default function AlphaGenomeAtlas() {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(ALPHA_GENOME_SEED_RECORDS[0].id);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return ALPHA_GENOME_SEED_RECORDS;
    return ALPHA_GENOME_SEED_RECORDS.filter((record) =>
      [record.symbol, record.label, record.chromosome, record.locus, ...record.bodySystems, record.role]
        .join(' ')
        .toLowerCase()
        .includes(needle),
    );
  }, [query]);
  const selected = ALPHA_GENOME_SEED_RECORDS.find((record) => record.id === selectedId) ?? ALPHA_GENOME_SEED_RECORDS[0];

  return (
    <section className="space-y-4" aria-labelledby="alpha-genome-title">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.18em] text-violet-300">Body Exposure · mandatory genomics layer</p>
        <h2 id="alpha-genome-title" className="text-2xl font-semibold text-white">Alpha Genome Atlas</h2>
        <p className="max-w-5xl text-sm text-slate-300">Chromosome → locus → gene → transcript → variant → protein → pathway. The atlas is source-bound and fail-closed: missing coordinates or evidence stay missing rather than being synthesized.</p>
      </header>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.8fr)]">
        <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
          <GenomeScene record={selected} />
          <div className="grid gap-2 border-t border-slate-800 p-3 sm:grid-cols-2 lg:grid-cols-4">
            <div><p className="text-xs text-slate-400">Gene</p><p className="font-medium text-white">{selected.symbol}</p></div>
            <div><p className="text-xs text-slate-400">Chromosome</p><p className="font-medium text-white">{selected.chromosome}</p></div>
            <div><p className="text-xs text-slate-400">Cytogenetic locus</p><p className="font-medium text-white">{selected.locus}</p></div>
            <div><p className="text-xs text-slate-400">Scales</p><p className="font-medium text-white">{selected.scales.length}</p></div>
          </div>
        </div>

        <aside className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <label className="block text-xs uppercase tracking-wide text-slate-400" htmlFor="alpha-genome-search">Search atlas</label>
          <input id="alpha-genome-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="TP53, brain, chromosome 17…" className="min-h-11 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-white outline-none focus:border-violet-400" />
          <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
            {filtered.map((record) => (
              <button key={record.id} type="button" aria-pressed={record.id === selected.id} onClick={() => setSelectedId(record.id)} className="min-h-11 w-full rounded-lg border border-slate-800 px-3 py-2 text-left aria-pressed:border-violet-400 aria-pressed:bg-violet-500/10">
                <span className="block text-sm font-medium text-white">{record.symbol} · {record.label}</span>
                <span className="mt-1 block text-xs text-slate-400">chr{record.chromosome} · {record.locus} · {record.bodySystems.join(' · ')}</span>
              </button>
            ))}
          </div>
          <div className="rounded-xl border border-slate-800 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-400">Biological role</p>
            <p className="mt-1 text-sm text-slate-200">{selected.role}</p>
          </div>
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-100">{selected.clinicalBoundary}</div>
        </aside>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {ALPHA_GENOME_SOURCES.map((source) => (
          <article key={source.id} className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
            <p className="text-sm font-medium text-white">{source.label}</p>
            <p className="mt-1 text-xs text-violet-300">{source.authority}</p>
            <p className="mt-2 text-xs text-slate-400">{source.scope}</p>
            <p className="mt-2 text-xs text-slate-300">{source.provenanceRule}</p>
          </article>
        ))}
      </div>

      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-100">{ALPHA_GENOME_ATLAS_BOUNDARY}</div>
    </section>
  );
}
