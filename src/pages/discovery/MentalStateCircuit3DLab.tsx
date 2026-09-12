import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  DISCOVERY_MENTAL_STATE_BOUNDARY,
  DISCOVERY_MENTAL_STATE_CIRCUITS,
  type CircuitNode,
} from '../../lib/discoveryMentalStateCircuits';

function nodeColor(kind: CircuitNode['kind']) {
  switch (kind) {
    case 'molecule': return 0x8ecae6;
    case 'cell': return 0x90be6d;
    case 'region': return 0xf9c74f;
    case 'network': return 0xf9844a;
    case 'behavior': return 0x43aa8b;
    case 'mental-state': return 0xb5179e;
  }
}

export default function MentalStateCircuit3DLab() {
  const [selectedId, setSelectedId] = useState(DISCOVERY_MENTAL_STATE_CIRCUITS[0].id);
  const mountRef = useRef<HTMLDivElement | null>(null);
  const selected = useMemo(
    () => DISCOVERY_MENTAL_STATE_CIRCUITS.find((model) => model.id === selectedId) ?? DISCOVERY_MENTAL_STATE_CIRCUITS[0],
    [selectedId],
  );

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
    camera.position.set(0, 1.8, 9);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.minDistance = 4;
    controls.maxDistance = 15;

    scene.add(new THREE.AmbientLight(0xffffff, 1.6));
    const key = new THREE.DirectionalLight(0xffffff, 2.4);
    key.position.set(4, 6, 8);
    scene.add(key);

    const positions = selected.nodes.map((_, index) => {
      const angle = (index / Math.max(1, selected.nodes.length)) * Math.PI * 2;
      const radius = index === 0 ? 0 : 2.4 + (index % 2) * 0.7;
      return new THREE.Vector3(
        Math.cos(angle) * radius,
        Math.sin(angle * 1.7) * 1.2,
        Math.sin(angle) * radius * 0.5,
      );
    });

    const group = new THREE.Group();
    scene.add(group);

    selected.edges.forEach((edge) => {
      const fromIndex = selected.nodes.findIndex((node) => node.id === edge.from);
      const toIndex = selected.nodes.findIndex((node) => node.id === edge.to);
      if (fromIndex < 0 || toIndex < 0) return;
      const points = [positions[fromIndex], positions[toIndex]];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({ color: 0x6b7280, transparent: true, opacity: 0.55 });
      group.add(new THREE.Line(geometry, material));
    });

    selected.nodes.forEach((node, index) => {
      const geometry = new THREE.SphereGeometry(node.kind === 'mental-state' ? 0.42 : 0.32, 24, 18);
      const material = new THREE.MeshStandardMaterial({
        color: nodeColor(node.kind),
        roughness: 0.45,
        metalness: 0.05,
        transparent: true,
        opacity: node.kind === 'mental-state' ? 0.92 : 0.82,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(positions[index]);
      group.add(mesh);
    });

    let raf = 0;
    const animate = () => {
      controls.update();
      group.rotation.y += 0.0018;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };

    const resize = () => {
      const width = Math.max(1, mount.clientWidth);
      const height = Math.max(300, Math.min(560, width * 0.72));
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
      group.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
          object.geometry.dispose();
          const material = object.material;
          if (Array.isArray(material)) material.forEach((item) => item.dispose());
          else material.dispose();
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [selected]);

  return (
    <section className="space-y-4" aria-labelledby="mental-state-circuit-title">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.18em] text-emerald-300">Discovery · Neuropsychiatry 3D</p>
        <h2 id="mental-state-circuit-title" className="text-xl font-semibold text-white">Disease, thought, perception & mental-state circuits</h2>
        <p className="max-w-4xl text-sm text-slate-300">
          Interactive schematic network showing how molecular, cellular, regional and distributed circuit factors can converge on cognition, behavior and mental-state observations. The scene is not connectomics, microscopy, receptor-density imaging or patient physiology.
        </p>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Circuit model">
        {DISCOVERY_MENTAL_STATE_CIRCUITS.map((model) => (
          <button
            key={model.id}
            type="button"
            role="tab"
            aria-selected={selected.id === model.id}
            onClick={() => setSelectedId(model.id)}
            className="min-h-11 shrink-0 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-100 aria-selected:border-emerald-400 aria-selected:bg-emerald-500/10"
          >
            {model.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,1fr)]">
        <div className="min-w-0 overflow-hidden rounded-xl border border-slate-800 bg-slate-950/60">
          <div ref={mountRef} className="w-full" aria-label={`${selected.label} 3D circuit visualization`} />
        </div>

        <aside className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Selected model</p>
            <h3 className="mt-1 font-medium text-white">{selected.label}</h3>
          </div>

          <div className="space-y-2">
            {selected.edges.map((edge) => (
              <div key={`${edge.from}-${edge.to}`} className="rounded-lg border border-slate-800 p-3">
                <p className="text-sm text-slate-100">{edge.relation}</p>
                <p className="mt-1 text-xs text-emerald-300">Evidence: {edge.evidence}</p>
                <p className="mt-1 text-xs text-slate-400">Uncertainty: {edge.uncertainty}</p>
              </div>
            ))}
          </div>

          {selected.evidenceAnchors.length > 0 && (
            <div className="rounded-lg border border-slate-800 p-3">
              <p className="text-sm font-medium text-white">Evidence anchors</p>
              <ul className="mt-2 space-y-1 text-xs text-slate-300">
                {selected.evidenceAnchors.map((anchor) => (
                  <li key={anchor.pmid}>
                    <a
                      href={`https://pubmed.ncbi.nlm.nih.gov/${anchor.pmid}/`}
                      target="_blank"
                      rel="noreferrer"
                      className="underline decoration-slate-600 underline-offset-2"
                    >
                      PMID {anchor.pmid} · {anchor.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>

      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-100">
        {DISCOVERY_MENTAL_STATE_BOUNDARY}
      </div>
    </section>
  );
}
