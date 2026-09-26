import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  NEUROPSYCHIATRY_VISUAL_PRESETS,
  type NeuroVisualKind,
  type NeuroVisualPreset,
} from '../../lib/neuropsychiatryVisualModels';

function materialFor(kind: NeuroVisualKind) {
  const palette: Record<NeuroVisualKind, number> = {
    molecule: 0x7dd3fc,
    cell: 0x6ee7b7,
    nucleus: 0xfbbf24,
    tract: 0xa78bfa,
    circuit: 0x38bdf8,
    behavior: 0xf472b6,
  };
  return new THREE.MeshPhysicalMaterial({
    color: palette[kind],
    roughness: 0.28,
    metalness: 0.04,
    transparent: true,
    opacity: kind === 'behavior' ? 0.95 : 0.86,
    transmission: kind === 'cell' ? 0.16 : 0,
    clearcoat: 0.45,
    clearcoatRoughness: 0.25,
  });
}

function geometryFor(kind: NeuroVisualKind, scale = 1) {
  if (kind === 'cell') return new THREE.IcosahedronGeometry(0.48 * scale, 2);
  if (kind === 'nucleus') return new THREE.SphereGeometry(0.42 * scale, 32, 24);
  if (kind === 'molecule') return new THREE.OctahedronGeometry(0.34 * scale, 1);
  if (kind === 'tract') return new THREE.TorusKnotGeometry(0.24 * scale, 0.08 * scale, 64, 10, 2, 3);
  if (kind === 'behavior') return new THREE.CapsuleGeometry(0.32 * scale, 0.52 * scale, 8, 16);
  return new THREE.SphereGeometry(0.46 * scale, 32, 24);
}

function edgeCurve(from: THREE.Vector3, to: THREE.Vector3) {
  const midpoint = from.clone().lerp(to, 0.5);
  const bend = new THREE.Vector3(0, Math.max(0.3, from.distanceTo(to) * 0.12), 0.45);
  return new THREE.CatmullRomCurve3([from, midpoint.add(bend), to]);
}

export default function NeuropsychiatryCircuitStudio3D() {
  const [presetId, setPresetId] = useState<NeuroVisualPreset['id']>('healthy');
  const [signalsEnabled, setSignalsEnabled] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const mountRef = useRef<HTMLDivElement | null>(null);

  const preset = useMemo(
    () => NEUROPSYCHIATRY_VISUAL_PRESETS.find((item) => item.id === presetId) ?? NEUROPSYCHIATRY_VISUAL_PRESETS[0],
    [presetId],
  );

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030712);
    scene.fog = new THREE.FogExp2(0x030712, 0.055);

    const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 80);
    camera.position.set(0, 2.4, 11.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.055;
    controls.minDistance = 5.5;
    controls.maxDistance = 19;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 0.7;

    scene.add(new THREE.HemisphereLight(0xbfe9ff, 0x10121a, 1.2));
    const key = new THREE.DirectionalLight(0xffffff, 2.4);
    key.position.set(5, 7, 8);
    scene.add(key);
    const rim = new THREE.PointLight(0x60a5fa, 18, 18, 2);
    rim.position.set(-5, 1, 3);
    scene.add(rim);
    const accent = new THREE.PointLight(0xf472b6, 13, 14, 2);
    accent.position.set(4, -2, 3);
    scene.add(accent);

    const root = new THREE.Group();
    scene.add(root);

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(7.5, 96),
      new THREE.MeshBasicMaterial({ color: 0x08111f, transparent: true, opacity: 0.82 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2.85;
    root.add(floor);

    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(5.6, 0.018, 8, 180),
      new THREE.MeshBasicMaterial({ color: 0x1d4ed8, transparent: true, opacity: 0.34 }),
    );
    halo.rotation.x = Math.PI / 2;
    halo.position.y = -2.73;
    root.add(halo);

    const nodeMeshes = new Map<string, THREE.Mesh>();
    const nodePosition = new Map<string, THREE.Vector3>();

    preset.nodes.forEach((node) => {
      const position = new THREE.Vector3(...node.position);
      nodePosition.set(node.id, position);
      const mesh = new THREE.Mesh(geometryFor(node.kind, node.scale), materialFor(node.kind));
      mesh.position.copy(position);
      mesh.userData = { nodeId: node.id };
      root.add(mesh);
      nodeMeshes.set(node.id, mesh);

      const glow = new THREE.Mesh(
        new THREE.SphereGeometry(0.58 * (node.scale ?? 1), 18, 14),
        new THREE.MeshBasicMaterial({ color: 0x93c5fd, transparent: true, opacity: 0.05 }),
      );
      glow.position.copy(position);
      root.add(glow);
    });

    const movingSignals: Array<{ mesh: THREE.Mesh; curve: THREE.CatmullRomCurve3; speed: number; offset: number }> = [];

    preset.edges.forEach((edge, index) => {
      const from = nodePosition.get(edge.from);
      const to = nodePosition.get(edge.to);
      if (!from || !to) return;
      const curve = edgeCurve(from, to);
      const tube = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 48, 0.028 + edge.weight * 0.022, 8, false),
        new THREE.MeshStandardMaterial({
          color: edge.evidence === 'hypothesis' ? 0xa78bfa : 0x4f9cf9,
          emissive: edge.evidence === 'hypothesis' ? 0x32184f : 0x102d52,
          emissiveIntensity: 0.7,
          transparent: true,
          opacity: 0.44 + edge.weight * 0.28,
          roughness: 0.55,
        }),
      );
      root.add(tube);

      const signal = new THREE.Mesh(
        new THREE.SphereGeometry(0.075 + edge.weight * 0.03, 14, 10),
        new THREE.MeshBasicMaterial({ color: edge.evidence === 'hypothesis' ? 0xe9d5ff : 0xbae6fd }),
      );
      signal.visible = signalsEnabled;
      root.add(signal);
      movingSignals.push({ mesh: signal, curve, speed: edge.speed, offset: index / Math.max(1, preset.edges.length) });
    });

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const onPointerDown = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects([...nodeMeshes.values()], false);
      if (hits[0]) setSelectedNode(String(hits[0].object.userData.nodeId ?? ''));
    };
    renderer.domElement.addEventListener('pointerdown', onPointerDown);

    const clock = new THREE.Clock();
    let raf = 0;
    const animate = () => {
      const elapsed = clock.getElapsedTime();
      controls.autoRotate = autoRotate;
      controls.update();
      movingSignals.forEach((signal) => {
        signal.mesh.visible = signalsEnabled;
        if (!signalsEnabled) return;
        const t = (elapsed * signal.speed + signal.offset) % 1;
        signal.mesh.position.copy(signal.curve.getPointAt(t));
      });
      nodeMeshes.forEach((mesh, id) => {
        const selected = id === selectedNode;
        const pulse = 1 + Math.sin(elapsed * 2.4 + mesh.position.x) * 0.018;
        const target = selected ? 1.18 : pulse;
        mesh.scale.lerp(new THREE.Vector3(target, target, target), 0.08);
        const material = mesh.material as THREE.MeshPhysicalMaterial;
        material.emissive.setHex(selected ? 0x0ea5e9 : 0x000000);
        material.emissiveIntensity = selected ? 0.72 : 0;
      });
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
    animate();

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
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
  }, [preset, signalsEnabled, autoRotate, selectedNode]);

  const selected = preset.nodes.find((node) => node.id === selectedNode) ?? null;

  return (
    <section className="space-y-4" aria-labelledby="neuropsychiatry-studio-title">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.18em] text-sky-300">Discovery · Neuropsychiatry 3D</p>
        <h2 id="neuropsychiatry-studio-title" className="text-2xl font-semibold text-white">Neuropsychiatry Circuit Studio</h2>
        <p className="max-w-4xl text-sm text-slate-300">WebGL-first spatial explanation of neural mechanisms. This scene uses depth, pathway geometry, animated propagation and selectable nodes; it is not a screenshot or generated mockup.</p>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Neuropsychiatry model">
        {NEUROPSYCHIATRY_VISUAL_PRESETS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={item.id === preset.id}
            onClick={() => { setPresetId(item.id); setSelectedNode(null); }}
            className="min-h-11 shrink-0 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-100 aria-selected:border-sky-400 aria-selected:bg-sky-500/10"
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,0.8fr)]">
        <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
          <div ref={mountRef} className="w-full" aria-label={`${preset.label} interactive 3D simulation`} />
          <div className="flex flex-wrap gap-2 border-t border-slate-800 p-3">
            <button type="button" onClick={() => setSignalsEnabled((value) => !value)} className="min-h-11 rounded-lg border border-slate-700 px-3 text-sm text-slate-100">
              {signalsEnabled ? 'Pause signal flow' : 'Resume signal flow'}
            </button>
            <button type="button" onClick={() => setAutoRotate((value) => !value)} className="min-h-11 rounded-lg border border-slate-700 px-3 text-sm text-slate-100">
              {autoRotate ? 'Stop auto-rotate' : 'Auto-rotate'}
            </button>
          </div>
        </div>

        <aside className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Model</p>
            <h3 className="mt-1 text-lg font-medium text-white">{preset.label}</h3>
            <p className="mt-2 text-sm text-slate-300">{preset.description}</p>
          </div>

          <div className="rounded-xl border border-slate-800 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-400">Selected structure</p>
            <p className="mt-1 text-sm text-white">{selected?.label ?? 'Tap a 3D node'}</p>
            <p className="mt-1 text-xs text-slate-400">Selection highlights one element without implying it uniquely causes a symptom or diagnosis.</p>
          </div>

          <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {preset.edges.map((edge) => (
              <div key={`${edge.from}-${edge.to}`} className="rounded-lg border border-slate-800 p-3">
                <p className="text-sm text-slate-100">{edge.label}</p>
                <p className="mt-1 text-xs text-sky-300">Evidence: {edge.evidence}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-100">
            {preset.boundary}
          </div>
        </aside>
      </div>
    </section>
  );
}
