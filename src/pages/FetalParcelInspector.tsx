import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { penjagaMuatan } from '../lib/gltfSesudahLepas'
import { Prosa } from '../components/ui/Prosa'
import { FETAL_PARCEL_COLORS, parseFetalParcelDataset, visibleParcelTriangles, wholeLungOverlap, type FetalParcelDataset } from '../domains/body-exposure'
import './fetalParcelInspector.css'

const BASE = `${import.meta.env.BASE_URL}bodyexposure/dataset-inspection/fetal-parcels/`
type Section = 'off' | 'sagittal' | 'coronal' | 'axial'
type SceneHandle = { meshes: Map<number, THREE.Mesh[]>; render: () => void; fit: (side?: 'anterior' | 'left' | 'superior', focusLabel?: number) => void; plane: THREE.Plane; bounds: THREE.Box3 }
const organLabels: Record<string, string> = { '0': 'Background', '1': 'Older whole-lung mask', '2': 'Liver', '3': 'Stomach', '4': 'Spleen', '5': 'Renal pelvis', '6': 'Renal parenchyma', '7': 'Bladder', '8': 'Thymus', '9': 'Gallbladder', '10': 'Adrenal glands' }

export function FetalParcelInspector() {
  const canvasHost = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<SceneHandle | null>(null)
  const [dataset, setDataset] = useState<FetalParcelDataset | null>(null)
  const [error, setError] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [visible, setVisible] = useState([1, 2, 3, 4, 5])
  const [selected, setSelected] = useState(1)
  const [isolate, setIsolate] = useState(false)
  const [section, setSection] = useState<Section>('off')
  const [cut, setCut] = useState(50)
  const [opacity, setOpacity] = useState(1)
  const activeLabels = isolate ? [selected] : visible
  const region = dataset?.regions.find(r => r.source_label === selected)

  useEffect(() => {
    const abort = new AbortController()
    fetch(`${BASE}manifest.json`, { signal: abort.signal }).then(response => {
      if (!response.ok) throw new Error('Dataset manifest could not be loaded')
      return response.json()
    }).then(parseFetalParcelDataset).then(setDataset).catch(reason => { if (!abort.signal.aborted) setError(String(reason.message ?? reason)) })
    return () => abort.abort()
  }, [])

  useEffect(() => {
    const host = canvasHost.current
    if (!host || !dataset) return
    let disposed = false
    const penjaga = penjagaMuatan()
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#101b29')
    const camera = new THREE.PerspectiveCamera(38, 1, 0.001, 10)
    let renderer: THREE.WebGLRenderer
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false }) }
    catch { setError('3D rendering is unavailable on this device'); return }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.localClippingEnabled = true
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.domElement.setAttribute('aria-label', 'Anonymous fetal dataset regions in source coordinates')
    host.appendChild(renderer.domElement)
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = false
    scene.add(new THREE.HemisphereLight('#e4f1ff', '#415366', 2.4))
    const key = new THREE.DirectionalLight('#fff5eb', 3); key.position.set(0.3, 0.5, 0.5); scene.add(key)
    const fill = new THREE.DirectionalLight('#b2d6ff', 1.5); fill.position.set(-0.3, 0.1, -0.3); scene.add(fill)
    const meshes = new Map<number, THREE.Mesh[]>()
    const bounds = new THREE.Box3()
    const regionBounds = new Map<number, THREE.Box3>()
    const plane = new THREE.Plane()
    const render = () => { if (!disposed) renderer.render(scene, camera) }
    const fit = (side: 'anterior' | 'left' | 'superior' = 'anterior', focusLabel?: number) => {
      const frame = focusLabel === undefined ? bounds : regionBounds.get(focusLabel)
      if (!frame || frame.isEmpty()) return
      const center = frame.getCenter(new THREE.Vector3()), size = frame.getSize(new THREE.Vector3())
      const radius = size.length() / 2
      const distance = radius / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2)) / Math.min(camera.aspect, 1) * 1.15
      const direction = side === 'left' ? new THREE.Vector3(1, 0, 0) : side === 'superior' ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(0, 0, 1)
      camera.up.set(0, side === 'superior' ? 0 : 1, side === 'superior' ? -1 : 0)
      camera.position.copy(center).addScaledVector(direction, distance)
      camera.near = Math.max(radius / 1000, 0.00001); camera.far = distance + radius * 10; camera.updateProjectionMatrix()
      controls.target.copy(center); controls.update(); render()
    }
    const resize = () => {
      const { width, height } = host.getBoundingClientRect()
      if (width <= 0 || height <= 0) return
      camera.aspect = width / height; camera.updateProjectionMatrix(); renderer.setSize(width, height, false)
      fit()
    }
    const observer = new ResizeObserver(resize); observer.observe(host)
    controls.addEventListener('change', render)
    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)
    loader.load(`${BASE}${dataset.asset}`, gltf => {
      if (!penjaga.terima(gltf.scene)) return
      let failure = ''
      gltf.scene.traverse(ob => {
        if (!(ob instanceof THREE.Mesh)) return
        let owner: THREE.Object3D | null = ob
        while (owner && owner.userData.source_label === undefined) owner = owner.parent
        const label = Number(owner?.userData.source_label)
        if (!Number.isInteger(label) || label < 1 || label > 9 || owner?.userData.anatomical_identity !== 'unresolved' || owner?.userData.clinical_validation !== 'pending') {
          failure = 'Asset source identity differs from the anonymous manifest'; return
        }
        ;(Array.isArray(ob.material) ? ob.material : [ob.material]).forEach(m => m.dispose())
        ob.material = new THREE.MeshStandardMaterial({ color: FETAL_PARCEL_COLORS[label - 1], roughness: 0.65, metalness: 0, side: THREE.DoubleSide })
        ob.userData.inspectionLabel = label
        ob.visible = dataset.default_labels.includes(label)
        meshes.set(label, [...(meshes.get(label) ?? []), ob])
      })
      scene.add(gltf.scene)
      gltf.scene.updateMatrixWorld(true)
      // Referenced vertices only: packed GLBs may share a POSITION accessor.
      for (const [label, list] of meshes) {
        const box = new THREE.Box3()
        for (const mesh of list) {
          const positions = mesh.geometry.attributes.position, indices = mesh.geometry.index, point = new THREE.Vector3()
          for (let i = 0; i < (indices?.count ?? positions.count); i++) box.expandByPoint(point.fromBufferAttribute(positions, indices ? indices.getX(i) : i).applyMatrix4(mesh.matrixWorld))
        }
        regionBounds.set(label, box); bounds.union(box)
      }
      if (failure || meshes.size !== 9) { setError(failure || 'The dataset does not contain all nine regions'); return }
      sceneRef.current = { meshes, render, fit, plane, bounds }; resize(); setLoaded(true)
    }, undefined, () => { if (!disposed) setError('Dataset geometry could not be loaded') })
    const raycaster = new THREE.Raycaster()
    let down = { x: 0, y: 0 }
    const pointerDown = (event: PointerEvent) => { down = { x: event.clientX, y: event.clientY } }
    const pick = (event: PointerEvent) => {
      if (Math.hypot(event.clientX - down.x, event.clientY - down.y) > 5) return
      const rect = renderer.domElement.getBoundingClientRect()
      raycaster.setFromCamera(new THREE.Vector2((event.clientX - rect.left) / rect.width * 2 - 1, 1 - (event.clientY - rect.top) / rect.height * 2), camera)
      const hit = raycaster.intersectObjects([...meshes.values()].flat()).find(h => h.object.visible && (!sceneRef.current || sectionState.current === 'off' || plane.distanceToPoint(h.point) >= 0))
      if (hit) setSelected(Number(hit.object.userData.inspectionLabel))
    }
    renderer.domElement.addEventListener('pointerdown', pointerDown); renderer.domElement.addEventListener('pointerup', pick)
    return () => {
      penjaga.lepas(); disposed = true; sceneRef.current = null; observer.disconnect(); controls.dispose()
      renderer.domElement.removeEventListener('pointerdown', pointerDown); renderer.domElement.removeEventListener('pointerup', pick)
      scene.traverse(ob => { if (ob instanceof THREE.Mesh) { ob.geometry.dispose(); (Array.isArray(ob.material) ? ob.material : [ob.material]).forEach(m => m.dispose()) } })
      renderer.dispose(); renderer.domElement.remove()
    }
  }, [dataset])

  const sectionState = useRef(section)
  sectionState.current = section
  useEffect(() => {
    const handle = sceneRef.current
    if (!handle) return
    const axis = section === 'sagittal' ? 0 : section === 'coronal' ? 2 : 1
    const at = THREE.MathUtils.lerp(handle.bounds.min.getComponent(axis), handle.bounds.max.getComponent(axis), cut / 100)
    handle.plane.normal.set(0, 0, 0).setComponent(axis, 1); handle.plane.constant = -at
    for (const [label, list] of handle.meshes) for (const mesh of list) {
      mesh.visible = activeLabels.includes(label)
      const material = mesh.material as THREE.MeshStandardMaterial
      material.opacity = opacity; material.transparent = opacity < 1; material.depthWrite = opacity === 1
      material.emissive.set(label === selected ? '#504226' : '#000000'); material.emissiveIntensity = 0.35
      material.clippingPlanes = section === 'off' ? [] : [handle.plane]
      material.needsUpdate = true
    }
    handle.render()
  }, [loaded, visible, isolate, selected, section, cut, opacity])

  return <main className="fetal-parcel-inspector">
    <header><Link to="/body-exposure/canonical">← Body Exposure atlas</Link><h1>Fetal segmentation dataset</h1>
      <p>KCL population-average MRI · nine numeric regions · anatomical identities unresolved · clinical review pending.</p>
      <Prosa kelas="fpi-note">Colours distinguish source labels. Display cuts and transparency change the view only. No named lobes are added to the canonical atlas.</Prosa>
    </header>
    {error && <p role="alert">{error}</p>}
    <div className="fpi-layout">
      <section className="fpi-view"><div className="fpi-canvas" ref={canvasHost} />
        <p role="status">{loaded && dataset ? `${activeLabels.length} visible regions · ${visibleParcelTriangles(dataset.regions, activeLabels).toLocaleString()} triangles` : 'Loading source geometry…'}</p>
        <div className="fpi-controls" aria-label="Dataset views">{(['anterior', 'left', 'superior'] as const).map(view => <button key={view} disabled={!loaded} onClick={() => sceneRef.current?.fit(view)}>{view.charAt(0).toUpperCase() + view.slice(1)}</button>)}</div>
        <button disabled={!loaded} onClick={() => { setIsolate(true); sceneRef.current?.fit('anterior', selected) }}>Focus selected region</button>
        <label>Display cut <select value={section} onChange={e => setSection(e.target.value as Section)}>{(['off', 'sagittal', 'coronal', 'axial'] as const).map(value => <option key={value}>{value}</option>)}</select></label>
        {section !== 'off' && <label>Cut position <input aria-label="Cut position" type="range" min="0" max="100" value={cut} onChange={e => setCut(Number(e.target.value))} /></label>}
        <label>Surface opacity <input type="range" min="0.15" max="1" step="0.05" value={opacity} onChange={e => setOpacity(Number(e.target.value))} /></label>
        <Prosa kelas="fpi-note">+X subject left · +Y superior · +Z anterior. Metres, source origin retained. Cuts expose open display surfaces; underlying meshes remain closed.</Prosa>
      </section>
      <section className="fpi-panel" aria-label="Source regions">
        <div className="fpi-controls"><button onClick={() => { setVisible([1,2,3,4,5]); setIsolate(false) }}>Show labels 1–5</button><button onClick={() => { setVisible([1,2,3,4,5,6,7,8,9]); setIsolate(false) }}>Show all nine</button></div>
        <label><input type="checkbox" checked={isolate} onChange={e => setIsolate(e.target.checked)} /> Isolate selected region</label>
        <div className="fpi-region-list">{dataset?.regions.map(r => <div key={r.id}>
          <label><input type="checkbox" aria-label={`Show region ${r.source_label}`} checked={visible.includes(r.source_label)} disabled={isolate} onChange={e => setVisible(current => e.target.checked ? [...current, r.source_label] : current.filter(n => n !== r.source_label))} /></label>
          <button aria-pressed={selected === r.source_label} onClick={() => setSelected(r.source_label)}><span style={{ background: FETAL_PARCEL_COLORS[r.source_label - 1] }} />Region {r.source_label}<small>{r.voxels.toLocaleString()} voxels</small></button>
        </div>)}</div>
        {region && <article aria-label="Selected region evidence"><h2>Region {region.source_label}</h2><p>Source label {region.source_label} · {region.id} · identity unresolved</p>
          <dl><dt>Voxel volume</dt><dd>{region.voxel_volume_mm3.toFixed(2)} mm³</dd><dt>Surface volume</dt><dd>{region.surface_volume_mm3.toFixed(2)} mm³</dd>
            <dt>Discretization difference</dt><dd>{(region.mesh_volume_relative_error * 100).toFixed(2)}%</dd><dt>Connected components</dt><dd>{region.components}</dd><dt>Triangles</dt><dd>{region.triangles.toLocaleString()}</dd>
            <dt>Boundary / nonmanifold edges</dt><dd>{region.boundary_edges} / {region.nonmanifold_edges}</dd><dt>Older lung-mask overlap</dt><dd>{(wholeLungOverlap(region) * 100).toFixed(2)}%</dd></dl>
          <h3>Source mask correspondence</h3><table><thead><tr><th>Older organ label</th><th>Shared voxels</th></tr></thead><tbody>{Object.entries(region.organ_label_overlap_voxels).sort((a,b) => b[1]-a[1]).map(([label, count]) => <tr key={label}><td>{organLabels[label] ?? `Label ${label}`}</td><td>{count.toLocaleString()}</td></tr>)}</tbody></table>
          <p className="fpi-note">Overlap and measured volume differences describe dataset correspondence and mesh extraction. They do not establish anatomical identity or a clinical tolerance.</p>
        </article>}
      </section>
    </div>
    {dataset && <footer><a href={dataset.source} target="_blank" rel="noopener noreferrer">KCL source atlas</a> · {dataset.license} · population reference · no smoothing or fragment removal<br />
      <a href={`${BASE}manifest.json`} download>Download source evidence</a> · <a href={`${BASE}${dataset.asset}`} download>Download numeric-region GLB</a>
    </footer>}
  </main>
}
