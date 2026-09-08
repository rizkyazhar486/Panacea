import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { folderModel, type OrganModel } from '../lib/organModels'
import { anatomyCoverageForOrgan, anatomyScopeForOrgan } from '../lib/organAnatomyRequirements'

// Penampil satu organ dari dekat. Model BodyParts3D membawa mesh anatomi
// bernama dan karena itu boleh di-ray-pick tepat. Model AI tetap hanya memakai
// hotspot yang dikurasi; jangan pernah menyulap satu mesh AI menjadi anatomi
// sub-struktur yang tidak benar-benar ada di sumbernya.

interface Props {
  organ: OrganModel
  /** Hotspot id atau exact named mesh yang sedang dipilih. */
  selected?: string | null
  onSelect?: (hotspotIdOrMeshName: string | null) => void
  /** Reports only names that really exist as distinct meshes in the loaded GLB. */
  onPartsLoaded?: (names: string[]) => void
}

function displayMeshName(name: string): string {
  return name.replace(/_/g, ' ').replace(/\s+/g, ' ').trim()
}

export function OrganModel3D({ organ, selected, onSelect, onPartsLoaded }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [pct, setPct] = useState(0)
  const [fatal, setFatal] = useState('')
  const [partNames, setPartNames] = useState<string[]>([])
  const [showAllParts, setShowAllParts] = useState(false)
  const [pickedMesh, setPickedMesh] = useState<string | null>(null)
  // Posisi layar tiap hotspot, dihitung ulang tiap frame. Titiknya digambar
  // sebagai HTML di atas kanvas, bukan sebagai objek 3D: teksnya jadi tetap
  // tajam, bisa dibaca pembaca layar, dan sasaran sentuhnya cukup besar di
  // ponsel tanpa ikut membesar saat model diperbesar.
  const [layar, setLayar] = useState<Record<string, { x: number; y: number; depan: boolean }>>({})
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect
  const onPartsLoadedRef = useRef(onPartsLoaded)
  onPartsLoadedRef.current = onPartsLoaded
  const selectedRef = useRef(selected)
  selectedRef.current = selected

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    setLoading(true)
    setPct(0)
    setFatal('')
    setPickedMesh(null)
    setPartNames([])
    setShowAllParts(false)
    onPartsLoadedRef.current?.([])

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(38, 1, 0.01, 100)
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    } catch {
      setFatal('This device could not start 3D graphics (WebGL).')
      setLoading(false)
      return
    }
    const mobile = window.matchMedia('(max-width: 640px)').matches
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2))
    renderer.setClearColor(0x000000, 0)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.domElement.dataset.organModel3d = organ.id
    container.appendChild(renderer.domElement)

    scene.add(new THREE.AmbientLight(0xffffff, 0.9))
    const key = new THREE.DirectionalLight(0xffffff, 1.1)
    key.position.set(2, 3, 4)
    scene.add(key)
    const rim = new THREE.DirectionalLight(0xffffff, 0.4)
    rim.position.set(-3, 1, -3)
    scene.add(rim)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enablePan = false
    controls.enableDamping = true
    controls.autoRotate = true
    controls.autoRotateSpeed = 0.7

    const resize = () => {
      const w = container.clientWidth
      const h = container.clientHeight
      if (w < 2 || h < 2) return
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(container)

    let group: THREE.Group | null = null
    const namedMeshes: THREE.Mesh[] = []
    const originalEmissive = new Map<THREE.Mesh, THREE.Color>()
    const highlighted = new Set<THREE.Mesh>()
    const ray = new THREE.Raycaster()
    const pointer = new THREE.Vector2()

    const selectionName = (value?: string | null) => {
      if (!value) return ''
      return organ.hotspots.find((h) => h.id === value)?.ta ?? value
    }

    const restoreHighlight = () => {
      for (const mesh of highlighted) {
        const material = mesh.material as THREE.MeshStandardMaterial
        const original = originalEmissive.get(mesh)
        if (original) material.emissive.copy(original)
      }
      highlighted.clear()
    }

    const applyHighlight = (value?: string | null) => {
      restoreHighlight()
      const wanted = selectionName(value).toLowerCase()
      if (!wanted) return
      const hits = namedMeshes.filter(
        (mesh) => String(mesh.userData.panaceaDisplayName ?? displayMeshName(mesh.name)).toLowerCase() === wanted,
      )
      for (const hit of hits) {
        const material = hit.material as THREE.MeshStandardMaterial
        material.emissive.set(organ.accent).multiplyScalar(0.35)
        highlighted.add(hit)
      }
    }

    const loader = new GLTFLoader()
    loader.load(
      `${import.meta.env.BASE_URL}${folderModel(organ)}/${organ.id}.glb`,
      (gltf) => {
        group = gltf.scene

        // Reference organ GLBs contain individually named anatomy meshes.
        // Expose semantic names from BodyParts3D, Z-Anatomy, or HRA. AI close-ups
        // remain marker-only because a generated surface is not boundary evidence.
        if (organ.sumber && organ.sumber !== 'ai') {
          const names: string[] = []
          group.traverse((object) => {
            if (!(object as THREE.Mesh).isMesh) return
            const mesh = object as THREE.Mesh
            if (!mesh.name || Array.isArray(mesh.material)) return
            const sourceMaterial = mesh.material as THREE.MeshStandardMaterial
            const material = sourceMaterial.clone()
            mesh.material = material
            const exactName = typeof mesh.userData.panaceaAnatomyName === 'string'
              ? mesh.userData.panaceaAnatomyName
              : displayMeshName(mesh.name)
            mesh.userData.panaceaDisplayName = exactName
            namedMeshes.push(mesh)
            originalEmissive.set(mesh, material.emissive.clone())
            names.push(exactName)
          })
          const uniqueNames = [...new Set(names)].sort((a, b) => a.localeCompare(b))
          setPartNames(uniqueNames)
          onPartsLoadedRef.current?.(uniqueNames)
        }

        // Model dinormalkan ke ukuran & titik pusat yang sama, karena berkas
        // aslinya tidak sepakat soal skala — tanpa ini ginjal bisa datang
        // sebesar otak.
        const box = new THREE.Box3().setFromObject(group)
        const size = box.getSize(new THREE.Vector3())
        const center = box.getCenter(new THREE.Vector3())
        const skala = 2.6 / Math.max(size.x, size.y, size.z, 0.001)
        group.scale.setScalar(skala)
        group.position.set(-center.x * skala, -center.y * skala, -center.z * skala)
        scene.add(group)
        camera.position.set(0, 0.4, 4.6)
        controls.target.set(0, 0, 0)
        controls.update()
        applyHighlight(selectedRef.current)
        setLoading(false)
      },
      (ev) => { if (ev.total > 0) setPct(ev.loaded / ev.total) },
      () => {
        onPartsLoadedRef.current?.([])
        setFatal('Could not load this organ model.')
        setLoading(false)
      },
    )

    let inViewport = true
    let documentVisible = !document.hidden
    let raf = 0

    const stopRendering = () => {
      if (!raf) return
      cancelAnimationFrame(raf)
      raf = 0
    }

    const startRendering = () => {
      if (raf || !inViewport || !documentVisible) return
      raf = requestAnimationFrame(animate)
    }

    const onContextLost = (e: Event) => {
      e.preventDefault()
      stopRendering()
      setFatal('The browser dropped the 3D context, usually because memory ran low.')
    }
    const onContextRestored = () => {
      setFatal('')
      resize()
      startRendering()
    }
    renderer.domElement.addEventListener('webglcontextlost', onContextLost)
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored)

    // Berhenti berputar begitu pengguna menyentuh — memutar sendiri itu
    // undangan, bukan sesuatu yang harus dilawan saat orang mau mengarahkan.
    const stopAuto = () => { controls.autoRotate = false }
    renderer.domElement.addEventListener('pointerdown', stopAuto)

    const pickNamedMesh = (ev: PointerEvent) => {
      if (!organ.sumber || organ.sumber === 'ai' || !namedMeshes.length) return
      const rect = renderer.domElement.getBoundingClientRect()
      if (rect.width < 2 || rect.height < 2) return
      pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1
      ray.setFromCamera(pointer, camera)
      const hit = ray.intersectObjects(namedMeshes, false)[0]?.object as THREE.Mesh | undefined
      if (!hit) return
      const name = String(hit.userData.panaceaDisplayName ?? displayMeshName(hit.name))
      setPickedMesh(name)
      onSelectRef.current?.(name)
    }
    renderer.domElement.addEventListener('pointerup', pickNamedMesh)

    const v = new THREE.Vector3()
    let previousSelection = ''
    function animate() {
      raf = 0
      if (!inViewport || !documentVisible) return

      const currentSelection = selectionName(selectedRef.current)
      if (currentSelection !== previousSelection) {
        previousSelection = currentSelection
        applyHighlight(currentSelection)
        if (currentSelection) setPickedMesh(currentSelection)
      }

      controls.update()
      renderer.render(scene, camera)
      // Proyeksikan tiap hotspot ke koordinat layar.
      if (group) {
        const w = container!.clientWidth
        const h = container!.clientHeight
        const next: Record<string, { x: number; y: number; depan: boolean }> = {}
        for (const spot of organ.hotspots) {
          v.set(spot.position[0], spot.position[1], spot.position[2])
          group.localToWorld(v)
          const jarakKamera = v.distanceTo(camera.position)
          v.project(camera)
          next[spot.id] = {
            x: ((v.x + 1) / 2) * w,
            y: ((1 - v.y) / 2) * h,
            // Titik di sisi belakang organ diredupkan supaya tidak tampak
            // mengambang di depan padahal ada di baliknya.
            depan: jarakKamera < camera.position.length() + 0.4,
          }
        }
        setLayar(next)
      }
      raf = requestAnimationFrame(animate)
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        inViewport = Boolean(entry?.isIntersecting)
        if (inViewport) startRendering()
        else stopRendering()
      },
      { rootMargin: '128px' },
    )
    io.observe(container)

    const onVisibility = () => {
      documentVisible = !document.hidden
      if (documentVisible) startRendering()
      else stopRendering()
    }
    document.addEventListener('visibilitychange', onVisibility)
    startRendering()

    return () => {
      stopRendering()
      io.disconnect()
      ro.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost)
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored)
      renderer.domElement.removeEventListener('pointerdown', stopAuto)
      renderer.domElement.removeEventListener('pointerup', pickNamedMesh)
      restoreHighlight()
      controls.dispose()
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh
        if (!mesh.isMesh) return
        mesh.geometry.dispose()
        const material = mesh.material as THREE.Material | THREE.Material[]
        if (Array.isArray(material)) material.forEach((m) => m.dispose())
        else material.dispose()
      })
      renderer.renderLists.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      if (renderer.domElement.parentNode === container) container.removeChild(renderer.domElement)
    }
  }, [organ])

  const visibleParts = showAllParts ? partNames : partNames.slice(0, 12)
  const selectedName = selected ? (organ.hotspots.find((h) => h.id === selected)?.ta ?? selected) : ''
  const anatomyScope = organ.focusKey ? anatomyScopeForOrgan(organ.focusKey) : undefined
  const anatomyCoverage = organ.focusKey ? anatomyCoverageForOrgan(organ.focusKey, partNames) : undefined
  const matchedRequirementIds = new Set(anatomyCoverage?.matched.map((item) => item.id) ?? [])

  return (
    <div className="space-y-2">
      <div className="relative h-[300px] w-full overflow-hidden rounded-2xl bg-gradient-to-b from-neutral-100 to-neutral-200 dark:from-neutral-900 dark:to-neutral-950">
        <div ref={containerRef} className="h-full w-full touch-none" />

        {organ.hotspots.map((spot) => {
          const pos = layar[spot.id]
          if (!pos || loading || fatal) return null
          const aktif = selected === spot.id || selected === spot.ta
          return (
            <button
              key={spot.id}
              onClick={() => onSelectRef.current?.(aktif ? null : spot.id)}
              style={{ left: pos.x, top: pos.y, opacity: pos.depan ? 1 : 0.35 }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 transition ${
                aktif ? 'h-5 w-5 border-white bg-brand' : 'h-3.5 w-3.5 border-white/90'
              }`}
              aria-label={spot.ta}
            >
              <span className="sr-only">{spot.ta}</span>
              {!aktif && <span className="block h-full w-full rounded-full" style={{ background: spot.color }} />}
            </button>
          )
        })}

        {loading && !fatal && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="rounded-xl bg-black/60 px-3 py-2 text-center">
              <span className="text-xs font-semibold text-white">Loading {organ.label.toLowerCase()}…</span>
              <div className="mt-1 h-1 w-32 overflow-hidden rounded-full bg-white/20">
                <div className="h-full rounded-full bg-brand" style={{ width: `${Math.round(pct * 100)}%` }} />
              </div>
            </div>
          </div>
        )}
        {fatal && (
          <div className="absolute inset-0 flex items-center justify-center p-5">
            <p className="text-center text-xs leading-relaxed text-neutral-500">{fatal}</p>
          </div>
        )}
        {!loading && !fatal && (
          <p className="pointer-events-none absolute bottom-1.5 left-0 right-0 px-3 text-center text-[10px] text-neutral-500">
            {pickedMesh
              ? pickedMesh
              : organ.sumber && organ.sumber !== 'ai'
                ? 'Drag to rotate · tap any named reference structure'
                : 'Drag to rotate · tap a verified marker'}
          </p>
        )}
      </div>

      {organ.sumber && organ.sumber !== 'ai' && partNames.length > 0 && (
        <div className="rounded-xl border border-neutral-200 p-2.5 dark:border-white/10">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-[11px] font-bold text-ink dark:text-white">Named reference anatomy</div>
              <p className="text-[10px] text-neutral-400">
                {partNames.length} named structures from {organ.jumlahMesh ?? partNames.length} source meshes ·{' '}
                {organ.sourceLabel ?? (organ.sumber === 'bodyparts3d' ? 'BodyParts3D 4.0' : organ.sumber)}
              </p>
            </div>
            {partNames.length > 12 && (
              <button
                type="button"
                onClick={() => setShowAllParts((value) => !value)}
                className="shrink-0 rounded-full border border-neutral-200 px-2 py-1 text-[10px] font-bold text-neutral-600 dark:border-white/10 dark:text-neutral-300"
              >
                {showAllParts ? 'Show less' : 'Show all ' + partNames.length}
              </button>
            )}
          </div>
          <div className="mt-2 flex max-h-40 flex-wrap gap-1 overflow-y-auto">
            {visibleParts.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => onSelectRef.current?.(selectedName === name ? null : name)}
                className={
                  'rounded-full border px-2 py-1 text-[10px] font-semibold transition ' +
                  (selectedName === name
                    ? 'border-brand bg-brand text-white'
                    : 'border-neutral-200 text-neutral-600 hover:border-brand/50 dark:border-white/10 dark:text-neutral-300')
                }
              >
                {name}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[9.5px] leading-relaxed text-neutral-400">
            These labels come from the named meshes stored in the reference GLB. Missing microscopic or segmental
            structures are not fabricated.
          </p>
        </div>
      )}

      {anatomyScope && anatomyCoverage && (
        <div
          data-anatomy-completeness={organ.focusKey ?? organ.id}
          className="rounded-xl border border-neutral-200 p-2.5 dark:border-white/10"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-ink dark:text-white">Anatomical completeness gate</div>
              <p className="mt-0.5 text-[10px] leading-relaxed text-neutral-400">
                {anatomyCoverage.matched.length}/{anatomyCoverage.total} required macro structures are individually represented by exact named 3D source meshes.
              </p>
            </div>
            <span className="shrink-0 rounded-full border border-neutral-200 px-2 py-1 text-[9.5px] font-bold text-neutral-500 dark:border-white/10">
              {organ.sumber && organ.sumber !== 'ai' ? 'REFERENCE 3D' : 'SHAPE ONLY'}
            </span>
          </div>
          <div className="mt-2 max-h-48 space-y-1 overflow-y-auto pr-0.5">
            {anatomyScope.requirements.map((requirement) => {
              const exact = matchedRequirementIds.has(requirement.id)
              return (
                <div
                  key={requirement.id}
                  className="flex items-center justify-between gap-2 rounded-lg bg-neutral-50 px-2 py-1.5 dark:bg-white/5"
                >
                  <span className="min-w-0 text-[10.5px] font-semibold text-neutral-700 dark:text-neutral-200">
                    {requirement.label}
                  </span>
                  <span className={
                    'shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold ' +
                    (exact ? 'bg-brand/10 text-brand' : 'bg-neutral-200/70 text-neutral-500 dark:bg-white/10')
                  }>
                    {exact ? 'Exact 3D' : 'Source gap'}
                  </span>
                </div>
              )
            })}
          </div>
          <p className="mt-2 text-[9.5px] leading-relaxed text-neutral-400">
            “Source gap” means this close-up does not contain that structure as its own named geometry; it does not mean the structure is absent from the human body. Panacea does not generate a fake mesh to fill the gap. Scope terminology follows standard gross anatomy / FIPAT Terminologia Anatomica concepts; BodyParts3D reference objects map to FMA concepts.
          </p>
        </div>
      )}
    </div>
  )
}

export default OrganModel3D
