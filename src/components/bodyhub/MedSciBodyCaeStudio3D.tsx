import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { tissueShading } from '../../domains/body-exposure/engine/tissueShading.ts';
import { disposeOwnedObject3DResources } from '../../lib/bodyExposure/threeOwnedResourceDisposal';
import {
  BIOMED_FRONTIER_EXHIBIT_MAP, CAE_ENGINE_BOUNDARY, SYSTEM_MULTISCALE_ATLAS, TWELVE_BIOLOGICAL_SCALES,
  computeAxisExplodeAndProjectile, computeCochlearGreenwoodFrequency, evaluateErgonomicHumanLoad,
  evaluateFirstPrinciplesCase, evaluateFrontierDiscoveryEducation, evaluateLaserAndCaeInspection,
  evaluateMicrofluidicChipFlow, evaluateMultiscalePharmacologyForSystem, evaluateSurgicalSutureQuality,
  planEmergencyNetworkDijkstra, selectAdaptive3TChannel,
  type AnatomicalSystemKey, type AtlasLayerId, type ChannelEnvironmentKind, type EmergencyRoadEdge,
  type FirstPrinciplesCaseId, type TransportBearerKind,
} from '../../domains/body-exposure/cae-studio/firstPrinciplesHumanCaeEngine.ts';
import type { CanonicalDrugId } from '../../domains/body-exposure/engine/drugActionEngine.ts';
import type { CabgProcedurePhase, SurgicalInstrumentClass } from '../../domains/body-exposure/engine/universalSurgicalCabgAndProceduralEngine.ts';
import { Fold } from '../../shared/ui/Fold';

type StudioTab = 'cad' | 'scales' | 'surgery' | 'pharma_emr' | 'network_3t';
type VisualShaderMode = 'studio-pbr' | 'cad-wireframe' | 'laser-contour' | 'cae-stress' | 'xray';
type SliceAxis = 'none' | 'axial' | 'coronal' | 'sagittal';

const STUDIO_LAYERS: readonly { id: AtlasLayerId; label: string; file: string; defaultOn: boolean }[] = [
  { id: 'surface', label: 'Skin Hull', file: 'surface.glb', defaultOn: false },
  { id: 'skeletal', label: 'Skeleton', file: 'skeletal.glb', defaultOn: true },
  { id: 'muscular', label: 'Muscles', file: 'muscular.glb', defaultOn: false },
  { id: 'cardiovascular', label: 'Vessels & Heart', file: 'cardiovascular.glb', defaultOn: true },
  { id: 'nervous', label: 'Nerves', file: 'nervous.glb', defaultOn: false },
  { id: 'visceral', label: 'Organs', file: 'visceral.glb', defaultOn: false },
  { id: 'lymphoid', label: 'Lymphatics', file: 'lymphoid.glb', defaultOn: false },
];

const DEFAULT_ROAD_EDGES: readonly EmergencyRoadEdge[] = [
  { from: 'Village_Clinic_A', to: 'Coastal_Hub', baseDistanceKm: 12, trafficMultiplier: 1.15 },
  { from: 'Coastal_Hub', to: 'Regional_Hospital', baseDistanceKm: 18, trafficMultiplier: 1.4 },
  { from: 'Village_Clinic_A', to: 'Mountain_Pass', baseDistanceKm: 9, trafficMultiplier: 1.1 },
  { from: 'Mountain_Pass', to: 'Regional_Hospital', baseDistanceKm: 16, trafficMultiplier: 1.2 },
  { from: 'Coastal_Hub', to: 'Trauma_Center_North', baseDistanceKm: 24, trafficMultiplier: 1.05 },
  { from: 'Regional_Hospital', to: 'Trauma_Center_North', baseDistanceKm: 14, trafficMultiplier: 1.3 },
];

const atlasLoader = new GLTFLoader();
atlasLoader.setMeshoptDecoder(MeshoptDecoder);
const studioGlbCache = new Map<string, Promise<THREE.Group>>();

function restoreOriginalNodeNames(gltf: GLTF): void {
  const nodes = gltf.parser.json.nodes as Array<{ name?: string }> | undefined;
  if (!nodes) return;
  gltf.scene.traverse((obj) => {
    const idx = (gltf.parser.associations.get(obj) as { nodes?: number } | undefined)?.nodes;
    if (idx !== undefined && nodes[idx]?.name) obj.userData.originalName = nodes[idx].name;
  });
}

function loadStudioLayer(file: string): Promise<THREE.Group> {
  let cached = studioGlbCache.get(file);
  if (!cached) {
    cached = new Promise<THREE.Group>((resolve, reject) => {
      atlasLoader.load(`${import.meta.env.BASE_URL || './'}anatomy/${file}`, (gltf) => { restoreOriginalNodeNames(gltf); resolve(gltf.scene); }, undefined, (e) => reject(e instanceof Error ? e : new Error(String(e))));
    });
    studioGlbCache.set(file, cached);
  }
  return cached;
}

const humanizeNode = (raw: string) => {
  const t = raw.trim().replace(/\.l$/, ' (left)').replace(/\.r$/, ' (right)');
  return t ? t[0]!.toUpperCase() + t.slice(1) : 'Anatomical structure';
};

function inferSystem(layer: AtlasLayerId, raw: string): AnatomicalSystemKey {
  const n = raw.toLowerCase();
  if (n.includes('lung') || n.includes('bronch') || n.includes('trachea')) return 'respiratory';
  if (n.includes('kidney') || n.includes('renal') || n.includes('bladder')) return 'renal';
  if (n.includes('liver') || n.includes('stomach') || n.includes('intestin') || n.includes('gall')) return 'gastrointestinal';
  if (n.includes('thyroid') || n.includes('adrenal')) return 'endocrine';
  if (layer === 'nervous') return 'nervous';
  if (layer === 'muscular' || layer === 'skeletal') return 'musculoskeletal';
  if (layer === 'lymphoid') return 'lymphatic';
  return 'cardiovascular';
}

function RangeCtrl({ label, min, max, step, value, onChange }: { label: string; min: number; max: number; step: number; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block text-xs font-semibold text-slate-200">
      {label}
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-1 h-11 w-full accent-emerald-500" />
    </label>
  );
}

export function MedSciBodyCaeStudio3D() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [activeTab, setActiveTab] = useState<StudioTab>('cad');
  const [shaderMode, setShaderMode] = useState<VisualShaderMode>('studio-pbr');
  const [highDpi, setHighDpi] = useState(false);
  const [enabledLayers, setEnabledLayers] = useState<Set<AtlasLayerId>>(() => new Set(STUDIO_LAYERS.filter((l) => l.defaultOn).map((l) => l.id)));
  const [loadingCount, setLoadingCount] = useState(0);
  const [webglStatus, setWebglStatus] = useState<'ready' | 'unavailable'>('ready');

  const [explodeX, setExplodeX] = useState(0);
  const [explodeY, setExplodeY] = useState(0);
  const [explodeZ, setExplodeZ] = useState(0);
  const [projectile, setProjectile] = useState(0);
  const [sliceAxis, setSliceAxis] = useState<SliceAxis>('none');
  const [sliceOffset, setSliceOffset] = useState(0);
  const [laserPitchMm, setLaserPitchMm] = useState(2.5);
  const [laserFluence, setLaserFluence] = useState(45);

  const [selectedSystem, setSelectedSystem] = useState<AnatomicalSystemKey>('cardiovascular');
  const [selectedScaleIdx, setSelectedScaleIdx] = useState(0);
  const [pickedPart, setPickedPart] = useState<{ layer: AtlasLayerId; rawName: string; label: string } | null>(null);

  const [fpCaseId, setFpCaseId] = useState<FirstPrinciplesCaseId>('poiseuille-hemodynamics');
  const [fpRadius, setFpRadius] = useState(1.8);
  const [fpSecondaryDim, setFpSecondaryDim] = useState(65);
  const [fpParamA, setFpParamA] = useState(95);
  const [fpParamB, setFpParamB] = useState(28);
  const [fpParamC, setFpParamC] = useState(0.0035);

  const [cabgPhase, setCabgPhase] = useState<CabgProcedurePhase>('LAD_ARTERIOTOMY_AND_DISTAL_ANASTOMOSIS');
  const [instrument, setInstrument] = useState<SurgicalInstrumentClass>('CASTROVIEJO_NEEDLE_HOLDER_8_0');
  const [stitchSpacingMm, setStitchSpacingMm] = useState(1.2);
  const [biteDepthMm, setBiteDepthMm] = useState(0.9);
  const [tensionUniformity, setTensionUniformity] = useState(0.92);
  const [edgeGapMm, setEdgeGapMm] = useState(0.12);
  const [phrenicDistMm, setPhrenicDistMm] = useState(12);

  const [drugId, setDrugId] = useState<CanonicalDrugId>('metoprolol-beta1-antagonist');
  const [drugConc, setDrugConc] = useState(47);
  const [vaccineDays, setVaccineDays] = useState(90);
  const [phredQ, setPhredQ] = useState(30);
  const [neckFlexDeg, setNeckFlexDeg] = useState(15);

  const [channelEnv, setChannelEnv] = useState<ChannelEnvironmentKind>('rural_3t');
  const [bearer, setBearer] = useState<TransportBearerKind>('3g-umts');
  const [bandwidthKHz, setBandwidthKHz] = useState(200);
  const [snrLinear, setSnrLinear] = useState(6);
  const [pendingKb, setPendingKb] = useState(180);
  const [congestionPenalty, setCongestionPenalty] = useState(1.0);
  const [availableBeds, setAvailableBeds] = useState(18);
  const [incomingPatients, setIncomingPatients] = useState(14);

  const offsets = useMemo(() => computeAxisExplodeAndProjectile({ explodeX, explodeY, explodeZ, projectileFactor: projectile }), [explodeX, explodeY, explodeZ, projectile]);
  const firstPrinciples = useMemo(() => evaluateFirstPrinciplesCase({ caseId: fpCaseId, radiusPrimary: fpRadius, secondaryDimension: fpSecondaryDim, drivingParamA: fpParamA, drivingParamB: fpParamB, drivingParamC: fpParamC }), [fpCaseId, fpRadius, fpSecondaryDim, fpParamA, fpParamB, fpParamC]);
  const laserEval = useMemo(() => evaluateLaserAndCaeInspection({ wavelengthNm: 532, slicePitchMm: laserPitchMm, scanSpeedMmSec: 120, fluenceMjCm2: laserFluence }), [laserPitchMm, laserFluence]);
  const sutureQa = useMemo(() => evaluateSurgicalSutureQuality({ procedurePhase: cabgPhase, instrument, graftRadiusMm: 1.5, graftLengthMm: 140, mapMmHg: 88, distalPressureMmHg: 30, distanceToPhrenicMm: phrenicDistMm, stitchSpacingMm, biteDepthMm, tensionUniformity0to1: tensionUniformity, edgeAppositionGapMm: edgeGapMm }), [cabgPhase, instrument, phrenicDistMm, stitchSpacingMm, biteDepthMm, tensionUniformity, edgeGapMm]);
  const pharmaEval = useMemo(() => evaluateMultiscalePharmacologyForSystem(drugId, drugConc, drugId === 'furosemide-nkcc2-inhibitor' ? 'uM' : 'nM'), [drugId, drugConc]);
  const frontierEval = useMemo(() => evaluateFrontierDiscoveryEducation({ vaccinePeakResponsePct: 92, vaccineHalfLifeDays: 120, daysPostPriming: vaccineDays, stemStateWeights: [0.25, 0.55, 0.2], hdrEvents: 48, nhejEvents: 152, phredQScore: phredQ, readCount: 4000, readLengthBp: 150, targetPanelBp: 50000 }), [vaccineDays, phredQ]);
  const channelEval = useMemo(() => selectAdaptive3TChannel({ environment: channelEnv, activeBearer: bearer, bandwidthKHz, snrLinear, pendingPacketsKb: pendingKb }), [channelEnv, bearer, bandwidthKHz, snrLinear, pendingKb]);
  const emergencyRoute = useMemo(() => planEmergencyNetworkDijkstra({ edges: DEFAULT_ROAD_EDGES.map((e) => (e.to === 'Regional_Hospital' ? { ...e, trafficMultiplier: Number((e.trafficMultiplier * congestionPenalty).toFixed(2)) } : e)), origin: 'Village_Clinic_A', destination: 'Trauma_Center_North', availableBeds, incomingPatients }), [congestionPenalty, availableBeds, incomingPatients]);
  const ergoEval = useMemo(() => evaluateErgonomicHumanLoad({ neckFlexionDeg: neckFlexDeg, screenDistanceCm: 56, continuousMinutes: 35 }), [neckFlexDeg]);
  const cochleaEval = useMemo(() => computeCochlearGreenwoodFrequency(0.5), []);
  const chipEval = useMemo(() => evaluateMicrofluidicChipFlow({ hydraulicDiameterUm: 120, velocityMmSec: 8 }), []);

  const stateRef = useRef({ shaderMode, offsets, sliceAxis, sliceOffset, stressRatio: firstPrinciples.ok ? firstPrinciples.stressRatio0to1 : 0.25 });
  stateRef.current = { shaderMode, offsets, sliceAxis, sliceOffset, stressRatio: firstPrinciples.ok ? firstPrinciples.stressRatio0to1 : 0.25 };

  const layerRootsRef = useRef<Map<AtlasLayerId, THREE.Group>>(new Map());
  const cadGridRef = useRef<THREE.GridHelper | null>(null);
  const cadAxesRef = useRef<THREE.AxesHelper | null>(null);
  const laserRingRef = useRef<THREE.Mesh | null>(null);
  const clipPlaneRef = useRef<THREE.Plane>(new THREE.Plane(new THREE.Vector3(0, -1, 0), 2));
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const requestRenderRef = useRef<(() => void) | null>(null);
  const applyMaterialsRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const host = mountRef.current;
    if (!host) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'default' });
    } catch {
      setWebglStatus('unavailable');
      return;
    }
    rendererRef.current = renderer;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, highDpi ? 2.5 : 1.25));
    renderer.setSize(host.clientWidth || 360, host.clientHeight || 420);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.localClippingEnabled = true;
    Object.assign(renderer.domElement.style, { display: 'block', width: '100%', height: '100%' });
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050911);
    const camera = new THREE.PerspectiveCamera(40, (host.clientWidth || 360) / (host.clientHeight || 420), 0.05, 50);
    camera.position.set(1.25, 1.05, 2.35);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = false;
    controls.target.set(0, 0.85, 0);
    controls.update();

    scene.add(new THREE.HemisphereLight(0xdce8ff, 0x0b1628, 0.85));
    const key = new THREE.DirectionalLight(0xfff7ed, 1.8); key.position.set(2.4, 3.2, 2.6); scene.add(key);
    const rim = new THREE.DirectionalLight(0x38bdf8, 1.2); rim.position.set(-1.5, 2.2, -2.8); scene.add(rim);

    const cadGrid = new THREE.GridHelper(3.2, 24, 0x06b6d4, 0x164e63); cadGrid.visible = false; scene.add(cadGrid); cadGridRef.current = cadGrid;
    const cadAxes = new THREE.AxesHelper(0.7); cadAxes.visible = false; scene.add(cadAxes); cadAxesRef.current = cadAxes;

    const laserGeom = new THREE.RingGeometry(0.46, 0.495, 64); laserGeom.rotateX(-Math.PI / 2);
    const laserRing = new THREE.Mesh(laserGeom, new THREE.MeshBasicMaterial({ color: 0x10b981, side: THREE.DoubleSide, transparent: true, opacity: 0.78 }));
    laserRing.position.y = 0.85; laserRing.visible = false; scene.add(laserRing); laserRingRef.current = laserRing;

    const bodyRoot = new THREE.Group(); scene.add(bodyRoot);
    let cancelled = false, scheduled = false;

    const renderNow = () => {
      scheduled = false;
      if (cancelled) return;
      const { offsets: off, sliceAxis: axis, sliceOffset: sOff } = stateRef.current;
      layerRootsRef.current.forEach((grp, id) => {
        const anchor = (grp.userData.anchorPos as THREE.Vector3 | undefined) ?? new THREE.Vector3();
        const delta = off[id] ?? [0, 0, 0];
        grp.position.set(anchor.x + delta[0], anchor.y + delta[1], anchor.z + delta[2]);
      });
      if (axis === 'axial') clipPlaneRef.current.set(new THREE.Vector3(0, -1, 0), 0.9 + sOff * 0.9);
      else if (axis === 'coronal') clipPlaneRef.current.set(new THREE.Vector3(0, 0, -1), sOff * 0.5);
      else if (axis === 'sagittal') clipPlaneRef.current.set(new THREE.Vector3(-1, 0, 0), sOff * 0.45);
      if (laserRingRef.current) laserRingRef.current.position.y = 0.85 + sOff * 0.65;
      renderer.render(scene, camera);
    };
    const requestRender = () => {
      if (cancelled || scheduled) return;
      scheduled = true;
      requestAnimationFrame(renderNow);
    };
    requestRenderRef.current = requestRender;
    controls.addEventListener('change', requestRender);

    const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
    let downX = 0, downY = 0;
    const onDown = (e: PointerEvent) => { downX = e.clientX; downY = e.clientY; };
    const onUp = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > 6) return;
      const r = renderer.domElement.getBoundingClientRect();
      if (!r.width || !r.height) return;
      pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects([...layerRootsRef.current.values()].filter((g) => g.visible), true);
      if (!hits.length) return;
      const h = hits[0].object;
      let cur: THREE.Object3D | null = h, layerFound: AtlasLayerId = 'cardiovascular';
      while (cur) { if (cur.userData?.studioLayerId) { layerFound = cur.userData.studioLayerId as AtlasLayerId; break; } cur = cur.parent; }
      const rawName = (h.userData?.originalName as string | undefined) || h.name || layerFound;
      setPickedPart({ layer: layerFound, rawName, label: humanizeNode(rawName) });
      setSelectedSystem(inferSystem(layerFound, rawName));
    };
    renderer.domElement.addEventListener('pointerdown', onDown);
    renderer.domElement.addEventListener('pointerup', onUp);

    const applyMaterials = () => {
      const { shaderMode: mode, sliceAxis: axis, stressRatio } = stateRef.current;
      if (cadGridRef.current) cadGridRef.current.visible = mode === 'cad-wireframe' || mode === 'laser-contour';
      if (cadAxesRef.current) cadAxesRef.current.visible = mode === 'cad-wireframe';
      if (laserRingRef.current) laserRingRef.current.visible = mode === 'laser-contour';
      const activeClip = axis === 'none' ? null : [clipPlaneRef.current];
      layerRootsRef.current.forEach((grp, layerId) => {
        grp.traverse((c) => {
          if (!(c instanceof THREE.Mesh)) return;
          if (!c.userData.baseStdMat) {
            const src = Array.isArray(c.material) ? c.material[0] : c.material;
            if (src instanceof THREE.MeshStandardMaterial) {
              const s = tissueShading(src.name);
              c.userData.baseColorHex = src.color.getHex();
              c.userData.baseStdMat = new THREE.MeshStandardMaterial({ color: src.color.clone(), roughness: s.roughness, metalness: s.metalness });
            } else if (src) c.userData.baseStdMat = src.clone();
          }
          const m = c.userData.baseStdMat as THREE.MeshStandardMaterial | undefined;
          if (!m) return;
          m.clippingPlanes = activeClip;
          m.side = activeClip ? THREE.DoubleSide : THREE.FrontSide;
          m.wireframe = mode === 'cad-wireframe';
          m.transparent = mode === 'xray' || layerId === 'surface';
          m.opacity = mode === 'xray' ? 0.28 : layerId === 'surface' ? 0.32 : 1;
          m.blending = mode === 'xray' ? THREE.AdditiveBlending : THREE.NormalBlending;
          m.depthWrite = mode !== 'xray' && layerId !== 'surface';
          if (mode === 'laser-contour') { m.color.setHex(layerId === 'skeletal' ? 0xa5f3fc : 0x0f766e); m.emissive.setHex(0x064e3b); m.emissiveIntensity = 0.45; }
          else if (mode === 'cae-stress' && (layerId === 'cardiovascular' || layerId === 'visceral' || layerId === 'muscular')) {
            const heat = new THREE.Color().setHSL(Math.max(0, 0.35 - stressRatio * 0.35), 0.9, 0.48);
            m.color.copy(heat); m.emissive.copy(heat); m.emissiveIntensity = 0.25 + stressRatio * 0.45;
          } else { if (typeof c.userData.baseColorHex === 'number') m.color.setHex(c.userData.baseColorHex); m.emissive.setHex(0); m.emissiveIntensity = 0; }
          c.material = m;
        });
      });
      requestRender();
    };
    applyMaterialsRef.current = applyMaterials;

    STUDIO_LAYERS.filter((l) => enabledLayers.has(l.id)).forEach(async (spec) => {
      setLoadingCount((c) => c + 1);
      try {
        const loaded = await loadStudioLayer(spec.file);
        if (cancelled) return;
        const clone = loaded.clone(true);
        clone.traverse((obj) => {
          if (obj.userData?.originalName == null) { const orig = loaded.getObjectByName(obj.name); if (orig?.userData?.originalName) obj.userData.originalName = orig.userData.originalName; }
        });
        clone.userData.studioLayerId = spec.id;
        const box = new THREE.Box3().setFromObject(clone);
        if (!box.isEmpty() && !bodyRoot.userData.baseShift) {
          const ctr = new THREE.Vector3(); box.getCenter(ctr);
          bodyRoot.userData.baseShift = new THREE.Vector3(-ctr.x, -box.min.y, -ctr.z);
        }
        const shift = bodyRoot.userData.baseShift as THREE.Vector3 | undefined;
        if (shift) clone.position.copy(shift);
        clone.userData.anchorPos = clone.position.clone();
        layerRootsRef.current.set(spec.id, clone);
        bodyRoot.add(clone);
        applyMaterials();
      } catch { /* non-fatal offline */ } finally { if (!cancelled) setLoadingCount((c) => Math.max(0, c - 1)); }
    });

    const ro = new ResizeObserver(() => {
      if (!mountRef.current) return;
      const w = Math.max(1, mountRef.current.clientWidth), h = Math.max(1, mountRef.current.clientHeight);
      camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h); requestRender();
    });
    ro.observe(host);
    requestRender();

    return () => {
      cancelled = true; ro.disconnect(); controls.removeEventListener('change', requestRender);
      renderer.domElement.removeEventListener('pointerdown', onDown); renderer.domElement.removeEventListener('pointerup', onUp);
      controls.dispose(); disposeOwnedObject3DResources(scene); layerRootsRef.current.clear(); renderer.dispose();
      if (renderer.domElement.parentNode === host) host.removeChild(renderer.domElement);
      rendererRef.current = null;
    };
  }, []);

  useEffect(() => {
    let active = true;
    layerRootsRef.current.forEach((grp, id) => { grp.visible = enabledLayers.has(id); });
    requestRenderRef.current?.();
    STUDIO_LAYERS.filter((l) => enabledLayers.has(l.id) && !layerRootsRef.current.has(l.id)).forEach(async (spec) => {
      setLoadingCount((c) => c + 1);
      try {
        const loaded = await loadStudioLayer(spec.file);
        if (!active || layerRootsRef.current.has(spec.id)) return;
        const firstGrp = [...layerRootsRef.current.values()][0];
        const clone = loaded.clone(true);
        clone.traverse((obj) => { if (obj.userData?.originalName == null) { const o = loaded.getObjectByName(obj.name); if (o?.userData?.originalName) obj.userData.originalName = o.userData.originalName; } });
        clone.userData.studioLayerId = spec.id;
        clone.position.copy((firstGrp?.userData.anchorPos as THREE.Vector3 | undefined) ?? new THREE.Vector3());
        clone.userData.anchorPos = clone.position.clone();
        if (firstGrp?.parent) { layerRootsRef.current.set(spec.id, clone); firstGrp.parent.add(clone); applyMaterialsRef.current?.(); }
      } catch { /* non-fatal */ } finally { if (active) setLoadingCount((c) => Math.max(0, c - 1)); }
    });
    return () => { active = false; };
  }, [enabledLayers]);

  useEffect(() => { applyMaterialsRef.current?.(); }, [shaderMode, sliceAxis, firstPrinciples]);
  useEffect(() => { requestRenderRef.current?.(); }, [offsets, sliceOffset]);
  useEffect(() => {
    if (!rendererRef.current) return;
    rendererRef.current.setPixelRatio(Math.min(window.devicePixelRatio || 1, highDpi ? 2.5 : 1.25));
    requestRenderRef.current?.();
  }, [highDpi]);

  const activeSystemRecord = SYSTEM_MULTISCALE_ATLAS[selectedSystem];
  const activeScaleSpec = TWELVE_BIOLOGICAL_SCALES[selectedScaleIdx] ?? TWELVE_BIOLOGICAL_SCALES[0];
  const toggleLayer = (id: AtlasLayerId) => setEnabledLayers((p) => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const combineAllAxes = () => { setExplodeX(0); setExplodeY(0); setExplodeZ(0); setProjectile(0); };

  const exportAiEmrJson = () => {
    const data = {
      schema: 'panacea.medscihub.cae.emr.draft.v1', clinically_reviewed: false, truthClass: 'SIMULATED_EDUCATIONAL',
      selectedSystem: activeSystemRecord.id, pickedStructure: pickedPart?.rawName ?? null, scale: activeScaleSpec.id,
      firstPrinciples, cabgSutureQa: sutureQa, boundary: CAE_ENGINE_BOUNDARY,
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = `panacea-${activeSystemRecord.id}-cae-draft.json`; a.click(); URL.revokeObjectURL(url);
  };

  const pillBtn = (sel: boolean) =>
    `min-h-[44px] rounded-xl border px-3 py-2 text-xs font-black transition ${sel ? 'border-[#047857] bg-[#047857] text-white shadow-sm' : 'border-white/15 bg-white/[0.06] text-slate-200 hover:border-cyan-400/40'}`;

  return (
    <section data-testid="medsci-cad-cae-studio" className="dark space-y-4 rounded-[28px] border border-cyan-500/20 bg-[#050911] p-3 text-slate-100 sm:p-5" aria-label="3D Anatomy First-Principles CAD/CAE & MedSciHub Studio">
      <header className="flex flex-col gap-3 border-b border-white/10 pb-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[#68fe9a]">Three.js Z-Anatomy · First Principles · Simulation Achieved Once Designed (CAE)</div>
          <h2 className="mt-1 text-lg font-black tracking-tight text-white sm:text-2xl">Human AI-EMR &amp; MedSciHub 3D CAD/CAE Multiscale Studio</h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-300">Separate Z-Anatomy GLB layers explodable across X / Y / Z &amp; 1-Projectile vectors, 12 scales, CABG/Suture QA &amp; 3T adaptive channels.</p>
        </div>
        <a href={`${import.meta.env.BASE_URL || './'}medscihub-human-ai-emr-3d.html`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-xl border border-cyan-400/50 bg-cyan-950/60 px-3.5 py-2 text-xs font-black text-cyan-100 hover:bg-cyan-900/70">
          Open Portable 1-File HTML ↗
        </a>
      </header>

      <div className="rounded-xl border border-amber-400/35 bg-amber-950/40 px-3 py-2 text-xs font-semibold text-amber-100">{CAE_ENGINE_BOUNDARY} · <code>clinically_reviewed: false</code></div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div className="space-y-3">
          <div className="relative h-[380px] overflow-hidden rounded-2xl border border-white/15 bg-[#03060c] sm:h-[460px]">
            <div ref={mountRef} className="h-full w-full" aria-label="Interactive Three.js anatomical viewport" />
            {webglStatus === 'unavailable' && <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-xs text-slate-300">WebGL unavailable; CAD/CAE &amp; 12-scale mathematical solvers remain live beside this stage.</div>}
            <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-1.5">
              <span className="rounded-full bg-black/75 px-2.5 py-1 text-[11px] font-bold text-[#68fe9a]">{loadingCount > 0 ? `Loading GLB (${loadingCount})…` : `${enabledLayers.size}/7 layers active`}</span>
              <span className="rounded-full bg-black/75 px-2.5 py-1 text-[11px] font-bold text-cyan-200">{pickedPart ? pickedPart.label : 'Tap 3D structure to inspect'}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <button type="button" onClick={combineAllAxes} className={pillBtn(explodeX === 0 && explodeY === 0 && explodeZ === 0 && projectile === 0)}>Snap Combine (0,0,0)</button>
            <button type="button" onClick={() => setProjectile(projectile > 0 ? 0 : 0.75)} className={pillBtn(projectile > 0)}>1-Projectile: {Math.round(projectile * 100)}%</button>
            <button type="button" onClick={() => setShaderMode((m) => (m === 'laser-contour' ? 'studio-pbr' : 'laser-contour'))} className={pillBtn(shaderMode === 'laser-contour')}>Laser Contour</button>
            <button type="button" onClick={() => setHighDpi((v) => !v)} className={pillBtn(highDpi)}>DPR: {highDpi ? 'Hi-Res ≤2.5×' : 'Standard'}</button>
          </div>
        </div>

        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Studio modules">
            {([['cad', 'CAD & XYZ'], ['scales', '12 Scales & Physics'], ['surgery', 'CABG & Suture CAE'], ['pharma_emr', 'Drugs, Bio & EMR'], ['network_3t', '3T Offline & Routes']] as const).map(([id, label]) => (
              <button key={id} type="button" role="tab" aria-selected={activeTab === id} onClick={() => setActiveTab(id)} className={pillBtn(activeTab === id)}>{label}</button>
            ))}
          </div>

          {activeTab === 'cad' && (
            <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <div className="flex flex-wrap gap-1.5">
                {STUDIO_LAYERS.map((l) => <button key={l.id} type="button" aria-pressed={enabledLayers.has(l.id)} onClick={() => toggleLayer(l.id)} className={pillBtn(enabledLayers.has(l.id))}>{l.label}</button>)}
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <RangeCtrl label={`X-Axis Explode (${explodeX.toFixed(2)})`} min={-1.5} max={1.5} step={0.05} value={explodeX} onChange={setExplodeX} />
                <RangeCtrl label={`Y-Axis Explode (${explodeY.toFixed(2)})`} min={-1.5} max={1.5} step={0.05} value={explodeY} onChange={setExplodeY} />
                <RangeCtrl label={`Z-Axis Explode (${explodeZ.toFixed(2)})`} min={-1.5} max={1.5} step={0.05} value={explodeZ} onChange={setExplodeZ} />
                <RangeCtrl label={`1-Projectile Burst (${Math.round(projectile * 100)}%)`} min={0} max={1} step={0.05} value={projectile} onChange={setProjectile} />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {([['studio-pbr', 'UHD PBR'], ['cad-wireframe', 'CAD Wireframe'], ['laser-contour', 'Laser Contour'], ['cae-stress', 'CAE Stress Map'], ['xray', 'X-Ray Slice']] as const).map(([id, label]) => (
                  <button key={id} type="button" onClick={() => setShaderMode(id)} className={pillBtn(shaderMode === id)}>{label}</button>
                ))}
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="text-xs font-semibold text-slate-200">Slice Plane
                  <select value={sliceAxis} onChange={(e) => setSliceAxis(e.target.value as SliceAxis)} className="mt-1 min-h-[44px] w-full rounded-xl border border-white/15 bg-slate-900 px-3 text-xs text-white">
                    <option value="none">None</option><option value="axial">Axial Y</option><option value="coronal">Coronal Z</option><option value="sagittal">Sagittal X</option>
                  </select>
                </label>
                <RangeCtrl label={`Slice / Laser Y (${sliceOffset.toFixed(2)})`} min={-1} max={1} step={0.05} value={sliceOffset} onChange={setSliceOffset} />
                <RangeCtrl label={`Laser Pitch (${laserPitchMm} mm)`} min={0.5} max={8} step={0.5} value={laserPitchMm} onChange={setLaserPitchMm} />
                <RangeCtrl label={`Laser Fluence (${laserFluence} mJ/cm²)`} min={10} max={200} step={5} value={laserFluence} onChange={setLaserFluence} />
              </div>
              {laserEval.ok && <div className="text-xs text-slate-300">532 nm Laser Profile: <b>{laserEval.nyquistContoursPerCm} contours/cm</b> · {laserEval.surfaceSafetyStatus}</div>}
            </div>
          )}

          {activeTab === 'scales' && (
            <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <select aria-label="Body system" value={selectedSystem} onChange={(e) => setSelectedSystem(e.target.value as AnatomicalSystemKey)} className="min-h-[44px] w-full rounded-xl border border-white/15 bg-slate-900 px-3 text-xs text-white">
                {Object.values(SYSTEM_MULTISCALE_ATLAS).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <div className="flex flex-wrap gap-1.5">
                {TWELVE_BIOLOGICAL_SCALES.map((sc, i) => <button key={sc.id} type="button" onClick={() => setSelectedScaleIdx(i)} className={pillBtn(selectedScaleIdx === i)}>{sc.order}. {sc.label}</button>)}
              </div>
              <div className="rounded-xl border border-cyan-500/25 bg-black/40 p-3 text-xs space-y-1">
                <div className="font-black text-white">Scale {activeScaleSpec.order}/12 ({activeScaleSpec.lengthLabel}) · {activeSystemRecord.name} ({activeSystemRecord.fmaId})</div>
                <div className="font-bold text-[#68fe9a]">Entity: {activeSystemRecord.scaleEntities[activeScaleSpec.id]}</div>
                <div>Law: <code>{activeSystemRecord.physiologyLaw}</code></div>
                <div className="text-rose-200">Pathophysiology: {activeSystemRecord.pathophysiologyCascade}</div>
                <div className="text-amber-200/90 text-[11px]">{activeScaleSpec.epistemicBoundary}</div>
              </div>
              <select aria-label="First-principles solver" value={fpCaseId} onChange={(e) => {
                const n = e.target.value as FirstPrinciplesCaseId; setFpCaseId(n);
                if (n === 'poiseuille-hemodynamics') { setFpRadius(1.8); setFpSecondaryDim(65); setFpParamA(95); setFpParamB(28); setFpParamC(0.0035); }
                else if (n === 'nernst-electrochemical') { setFpRadius(37); setFpSecondaryDim(10); setFpParamA(145); setFpParamB(12); setFpParamC(1); }
                else if (n === 'laplace-alveolar-ventilation') { setFpRadius(120); setFpSecondaryDim(0.5); setFpParamA(18); setFpParamB(60); }
                else { setFpRadius(26); setFpSecondaryDim(10); setFpParamA(125); setFpParamB(72); }
              }} className="min-h-[44px] w-full rounded-xl border border-white/15 bg-slate-900 px-3 text-xs text-white">
                <option value="poiseuille-hemodynamics">Poiseuille Vascular Flow &amp; Shear</option>
                <option value="nernst-electrochemical">Nernst Membrane Ion Equilibrium</option>
                <option value="laplace-alveolar-ventilation">Laplace Alveolar &amp; Fick Diffusion</option>
                <option value="laplace-myocardial-stress">Laplace LV Myocardial Wall Stress</option>
              </select>
              <div className="grid gap-2 sm:grid-cols-2">
                <RangeCtrl label={`Primary Dim (${fpRadius})`} min={0.5} max={180} step={0.5} value={fpRadius} onChange={setFpRadius} />
                <RangeCtrl label={`Param A (${fpParamA})`} min={5} max={220} step={1} value={fpParamA} onChange={setFpParamA} />
              </div>
              <div className="rounded-xl border border-white/10 bg-black/50 p-3 text-xs space-y-1">
                {firstPrinciples.ok ? (
                  <>
                    <div className="font-black text-white">{firstPrinciples.title}</div>
                    <div>1. Strip: {firstPrinciples.step1StripAssumptions}</div>
                    <div>2. Axioms: {firstPrinciples.step2ImmutableAxioms.join(' | ')}</div>
                    <div className="font-bold text-[#68fe9a]">{firstPrinciples.primaryMetricLabel}: {firstPrinciples.primaryValue} {firstPrinciples.primaryUnit} · {firstPrinciples.secondaryMetricLabel}: {firstPrinciples.secondaryValue} {firstPrinciples.secondaryUnit}</div>
                  </>
                ) : <div className="text-rose-200">{firstPrinciples.error}</div>}
              </div>
            </div>
          )}

          {activeTab === 'surgery' && (
            <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="text-xs text-slate-200">Operative Phase
                  <select value={cabgPhase} onChange={(e) => setCabgPhase(e.target.value as CabgProcedurePhase)} className="mt-1 min-h-[44px] w-full rounded-xl border border-white/15 bg-slate-900 px-3 text-xs text-white">
                    <option value="PREOP_CORONARY_ANGIO_MAPPING">Pre-op Angio Mapping</option>
                    <option value="MEDIAN_STERNOTOMY_AND_PERICARDIOTOMY">Sternotomy &amp; Pericardiotomy</option>
                    <option value="LIMA_PEDICLE_HARVEST">LIMA Pedicle Harvest</option>
                    <option value="LAD_ARTERIOTOMY_AND_DISTAL_ANASTOMOSIS">LAD Arteriotomy &amp; Anastomosis</option>
                    <option value="CLAMP_RELEASE_AND_DOPPLER_FLOW_VERIFICATION">Doppler Flow Verification</option>
                    <option value="HEMOSTASIS_AND_CLOSURE">Hemostasis &amp; Closure</option>
                  </select>
                </label>
                <label className="text-xs text-slate-200">Instrument
                  <select value={instrument} onChange={(e) => setInstrument(e.target.value as SurgicalInstrumentClass)} className="mt-1 min-h-[44px] w-full rounded-xl border border-white/15 bg-slate-900 px-3 text-xs text-white">
                    <option value="CASTROVIEJO_NEEDLE_HOLDER_8_0">Castroviejo 8-0 Holder</option>
                    <option value="INTERNAL_THORACIC_DISSECTOR">Internal Thoracic Dissector</option>
                    <option value="ATRAUMATIC_VASCULAR_CLAMP">Atraumatic Clamp</option>
                    <option value="TRANSIT_TIME_DOPPLER_PROBE">Doppler Probe</option>
                  </select>
                </label>
                <RangeCtrl label={`Stitch Pitch (${stitchSpacingMm} mm)`} min={0.4} max={2.5} step={0.1} value={stitchSpacingMm} onChange={setStitchSpacingMm} />
                <RangeCtrl label={`Bite Depth (${biteDepthMm} mm)`} min={0.3} max={2} step={0.1} value={biteDepthMm} onChange={setBiteDepthMm} />
                <RangeCtrl label={`Tension Uniformity (${Math.round(tensionUniformity * 100)}%)`} min={0.4} max={1} step={0.02} value={tensionUniformity} onChange={setTensionUniformity} />
                <RangeCtrl label={`Anastomotic Gap (${edgeGapMm} mm)`} min={0} max={0.6} step={0.02} value={edgeGapMm} onChange={setEdgeGapMm} />
                <RangeCtrl label={`Phrenic Margin (${phrenicDistMm} mm)`} min={2} max={20} step={1} value={phrenicDistMm} onChange={setPhrenicDistMm} />
                <RangeCtrl label={`Neck Flexion (${neckFlexDeg}°)`} min={0} max={60} step={5} value={neckFlexDeg} onChange={setNeckFlexDeg} />
              </div>
              {sutureQa.ok && (
                <div className="rounded-xl border border-white/10 bg-black/50 p-3 text-xs space-y-1">
                  <div className="font-black text-[#68fe9a]">QA Verdict: {sutureQa.verdict} ({sutureQa.sutureQualityScore}/100) · Flow {sutureQa.cabg.poiseuilleGraftHemodynamics.limaGraftFlowMlMin} mL/min</div>
                  <div>{sutureQa.cabg.structuresAtRiskAlert}</div>
                  <div>Anomalies: {sutureQa.detectedAnomalies.length ? sutureQa.detectedAnomalies.join(', ') : 'None (within 8-0 suture envelope)'}</div>
                  {ergoEval.ok && <div className="text-cyan-200">Operator Cervical Load: {ergoEval.effectiveCervicalLoadKg} kg</div>}
                </div>
              )}
            </div>
          )}

          {activeTab === 'pharma_emr' && (
            <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="text-xs text-slate-200">Reference Agent
                  <select value={drugId} onChange={(e) => setDrugId(e.target.value as CanonicalDrugId)} className="mt-1 min-h-[44px] w-full rounded-xl border border-white/15 bg-slate-900 px-3 text-xs text-white">
                    <option value="metoprolol-beta1-antagonist">Metoprolol (ADRB1 · Heart)</option>
                    <option value="salbutamol-beta2-agonist">Salbutamol (ADRB2 · Lung)</option>
                    <option value="furosemide-nkcc2-inhibitor">Furosemide (SLC12A1 · Kidney)</option>
                    <option value="lisinopril-ace-inhibitor">Lisinopril (ACE · Vasculature)</option>
                  </select>
                </label>
                <RangeCtrl label={`Concentration (${drugConc} ${drugId === 'furosemide-nkcc2-inhibitor' ? 'uM' : 'nM'})`} min={1} max={300} step={1} value={drugConc} onChange={setDrugConc} />
                <RangeCtrl label={`Vaccine Decay (${vaccineDays} d)`} min={0} max={365} step={15} value={vaccineDays} onChange={setVaccineDays} />
                <RangeCtrl label={`HTS Phred Q${phredQ}`} min={10} max={45} step={1} value={phredQ} onChange={setPhredQ} />
              </div>
              <div className="rounded-xl border border-white/10 bg-black/50 p-3 text-xs space-y-1">
                {pharmaEval.occupancy.ok && <div className="font-black text-[#68fe9a]">Hill Occupancy: {(pharmaEval.occupancy.fractionalOccupancy * 100).toFixed(1)}% ({pharmaEval.occupancy.l7MolecularTarget}) · Gene {pharmaEval.occupancy.l8TargetGene} → {pharmaEval.occupancy.fmaOrganId}</div>}
                {frontierEval.ok && <div className="text-cyan-200">Discovery Math: Immune {frontierEval.vaccineAdaptiveRetentionPct}% · Stem {frontierEval.stemEntropyBits} bits · HDR {frontierEval.hdrPrecisionRatioPct}% · Error {frontierEval.phredBaseErrorProb}</div>}
                {cochleaEval.ok && chipEval.ok && <div className="text-slate-300">Cochlear Mid (x=0.5): <b>{cochleaEval.frequencyHz} Hz</b> · Lab-on-a-Chip Re = <b>{chipEval.reynoldsNumber}</b> ({chipEval.regime})</div>}
              </div>
              <button type="button" onClick={exportAiEmrJson} className={pillBtn(true)}>Export AI-EMR + CAE Draft JSON (clinically_reviewed: false)</button>
            </div>
          )}

          {activeTab === 'network_3t' && (
            <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="text-xs text-slate-200">Environment
                  <select value={channelEnv} onChange={(e) => setChannelEnv(e.target.value as ChannelEnvironmentKind)} className="mt-1 min-h-[44px] w-full rounded-xl border border-white/15 bg-slate-900 px-3 text-xs text-white">
                    <option value="rural_3t">Rural / 3T Papua &amp; Frontier</option><option value="underground_basement">Underground Basement</option><option value="maritime_open_sea">Maritime Open Sea</option><option value="remote_island">Remote Island</option><option value="urban_5g_fiber">Urban 5G / Fiber</option>
                  </select>
                </label>
                <label className="text-xs text-slate-200">Bearer
                  <select value={bearer} onChange={(e) => setBearer(e.target.value as TransportBearerKind)} className="mt-1 min-h-[44px] w-full rounded-xl border border-white/15 bg-slate-900 px-3 text-xs text-white">
                    <option value="offline-queue">Offline Store-and-Forward</option><option value="ble-mesh">BLE Mesh</option><option value="2g-edge">2G EDGE</option><option value="3g-umts">3G UMTS</option><option value="4g-lte">4G LTE</option><option value="5g-nr">5G NR</option><option value="fiber-optic">Fiber Optic</option><option value="leo-satellite">LEO Satellite</option>
                  </select>
                </label>
                <RangeCtrl label={`Bandwidth (${bandwidthKHz} kHz)`} min={10} max={2000} step={20} value={bandwidthKHz} onChange={setBandwidthKHz} />
                <RangeCtrl label={`Pending Queue (${pendingKb} KB)`} min={0} max={1000} step={20} value={pendingKb} onChange={setPendingKb} />
                <RangeCtrl label={`Traffic Penalty (×${congestionPenalty})`} min={1} max={4} step={0.25} value={congestionPenalty} onChange={setCongestionPenalty} />
                <RangeCtrl label={`Beds (${availableBeds}) / Demand (${incomingPatients})`} min={2} max={40} step={1} value={availableBeds} onChange={setAvailableBeds} />
              </div>
              <div className="rounded-xl border border-white/10 bg-black/50 p-3 text-xs space-y-1">
                {channelEval.ok && <div className="font-bold text-[#68fe9a]">{channelEval.sourceChannelDestination} · {channelEval.payloadPolicy} ({channelEval.effectivePayloadKbps} kbps)</div>}
                {emergencyRoute.ok && <div className="text-cyan-200">Dijkstra: {emergencyRoute.reachable ? `${emergencyRoute.path.join(' → ')} (${emergencyRoute.weightedDistanceKm} km)` : 'DISCONNECTED'} · {emergencyRoute.supplyDemandStatus}</div>}
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setIncomingPatients((p) => (p >= 24 ? 8 : p + 4))} className={pillBtn(false)}>Cycle Demand ({incomingPatients} pts)</button>
                <button type="button" onClick={() => setSnrLinear((s) => (s >= 20 ? 2 : s + 4))} className={pillBtn(false)}>Cycle SNR ({snrLinear})</button>
              </div>
            </div>
          )}

          <Fold label="Sources">
            <div className="space-y-1 text-[11px] text-slate-300">
              <div>• 3D Meshes: Z-Anatomy / BodyParts3D CC BY-SA 4.0 (<code>public/anatomy/*.glb</code> + MeshoptDecoder). Pharmacology: IUPHAR 2024 PMID: 37897341.</div>
              {BIOMED_FRONTIER_EXHIBIT_MAP.map((ex) => (
                <div key={ex.id}><b className="text-white">{ex.title}</b> → {ex.domainLink} <em>({ex.boundary})</em></div>
              ))}
            </div>
          </Fold>
        </div>
      </div>
    </section>
  );
}

export default MedSciBodyCaeStudio3D;
