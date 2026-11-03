/**
 * @file BodyExposureAtlasHome.tsx
 * @description Canonical 3D Human Atlas Home (BioDigital / e-Anatomy progressive disclosure contract).
 * Single Three.js scene shell with 3-stage progressive workflow:
 *   [1. ANATOMY] -> [2. LIVING PHYSIOLOGY] -> [3. CLINICAL RELEVANCE].
 * Zero new Three.js engine primitives: reuses existing camera views, quality presets, and domain decks.
 * Scoped inline styles for zero Tailwind CSS bundle impact.
 */

import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { muatAtlas, namaAtlas, type AtlasDimuat } from '../../../lib/anatomy/pemuatAtlas'
import { body3dPixelRatio } from '../../../lib/body3dQuality'
import { organFactIndex, firstSentence } from '../engine/structureAtlas'
import { CardiopulmonaryCouplingDeck } from './CardiopulmonaryCouplingDeck'
import { SoftTissueBiomechanicsDeck } from './SoftTissueBiomechanicsDeck'
import { NeuroFascicularReflexDeck } from './NeuroFascicularReflexDeck'

import {
  ATLAS_LAYERS,
  ANATOMICAL_REGIONS,
  type AtlasStage,
  type LayerSpec,
  type SelectedStructureInfo,
} from '../engine/atlasHomeConfig'

export function BodyExposureAtlasHome() {
  const mountRef = useRef<HTMLDivElement | null>(null)
  const [stage, setStage] = useState<AtlasStage>('anatomy')
  const [peelLevel, setPeelLevel] = useState<number>(0) // 0 = skin visible, up to 6 = deepest layer
  const [activeLayers, setActiveLayers] = useState<Record<string, boolean>>({
    surface: true,
    muscular: true,
    skeletal: true,
    cardiovascular: true,
    visceral: true,
    nervous: true,
    lymphoid: true,
  })
  const [selectedRegion, setSelectedRegion] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedStructure, setSelectedStructure] = useState<SelectedStructureInfo | null>(null)
  const [loadingLayers, setLoadingLayers] = useState<Record<string, boolean>>({})
  const [layerError, setLayerError] = useState<string | null>(null)

  // Three.js instances preserved in refs
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const layerGroupsRef = useRef<Map<string, THREE.Group>>(new Map())
  const nameMapsRef = useRef<Map<string, Map<THREE.Object3D, string>>>(new Map())

  // Adjust layer opacities and visibility based on peel level & layer toggles
  const applyLayerVisibility = useCallback(() => {
    layerGroupsRef.current.forEach((group, layerId) => {
      const spec = ATLAS_LAYERS.find((l) => l.id === layerId)
      if (!spec) return

      const isLayerActive = activeLayers[layerId] ?? true
      // Peel logic: layers with peelRank < peelLevel are made transparent or hidden
      const isPeeledOff = spec.peelRank < peelLevel

      group.visible = isLayerActive && !isPeeledOff
      group.traverse((obj) => {
        if (obj instanceof THREE.Mesh && obj.material) {
          const mat = obj.material as THREE.MeshStandardMaterial
          if (isPeeledOff) {
            mat.opacity = 0
            mat.transparent = true
          } else {
            mat.opacity = spec.defaultOpacity
            mat.transparent = spec.defaultOpacity < 1
          }
          mat.needsUpdate = true
        }
      })
    })
  }, [activeLayers, peelLevel])

  useEffect(() => {
    applyLayerVisibility()
  }, [applyLayerVisibility])

  // Move camera smoothly when anatomical region changes
  const focusRegion = useCallback((regionId: string) => {
    const reg = ANATOMICAL_REGIONS.find((r) => r.id === regionId) ?? ANATOMICAL_REGIONS[0]
    setSelectedRegion(reg.id)
    if (!controlsRef.current || !cameraRef.current) return

    controlsRef.current.target.set(0, reg.targetY, 0)
    cameraRef.current.position.set(0, reg.targetY + 0.1, reg.distance)
    controlsRef.current.update()
  }, [])

  // Raycasting for organ/mesh picking
  const handleCanvasClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!mountRef.current || !cameraRef.current || !sceneRef.current) return
      const rect = mountRef.current.getBoundingClientRect()
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current)

      const visibleMeshes: THREE.Mesh[] = []
      layerGroupsRef.current.forEach((group) => {
        if (group.visible) {
          group.traverse((child) => {
            if (child instanceof THREE.Mesh && child.visible) {
              visibleMeshes.push(child)
            }
          })
        }
      })

      const intersects = raycaster.intersectObjects(visibleMeshes, false)
      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh
        let resolvedName = hit.name || 'Anatomical Structure'
        let matchedLayer = 'visceral'

        for (const [layerId, nameMap] of nameMapsRef.current.entries()) {
          const original = namaAtlas(nameMap, hit)
          if (original && original !== hit.name) {
            resolvedName = original
            matchedLayer = layerId
            break
          }
        }

        const cleanName = resolvedName.replace(/[._][lrLR]$/, '').replace(/_/g, ' ')
        const summary = `Normal human reference geometry from ${matchedLayer}.glb.`

        setSelectedStructure({
          meshName: resolvedName,
          layerId: matchedLayer,
          cleanName: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
          functionalRole: summary,
          organKey: resolvedName.toLowerCase(),
        })
      }
    },
    [],
  )

  // Initialize Three.js WebGL Scene Shell
  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    let disposed = false
    let rafId = 0
    let isVisible = true

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a0f1d)
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(38, mount.clientWidth / Math.max(1, mount.clientHeight), 0.1, 50)
    camera.position.set(0, 0.1, 3.2)
    cameraRef.current = camera

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' })
    } catch {
      setLayerError('WebGL 3D graphics could not be initialized on this browser.')
      return
    }

    const initW = mount.clientWidth || 300
    const initH = mount.clientHeight || 300
    renderer.setSize(initW, initH)
    renderer.setPixelRatio(body3dPixelRatio(initW, initH, window.devicePixelRatio || 1, window.innerWidth < 1024))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    renderer.domElement.style.display = 'block'
    mount.replaceChildren(renderer.domElement)
    rendererRef.current = renderer

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.minDistance = 0.5
    controls.maxDistance = 6.0
    controls.target.set(0, 0, 0)
    controlsRef.current = controls

    // Anatomical illumination
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x1e293b, 1.8)
    scene.add(hemiLight)
    const keyLight = new THREE.DirectionalLight(0xfff5eb, 2.4)
    keyLight.position.set(2.5, 4, 3)
    scene.add(keyLight)
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.2)
    rimLight.position.set(-2.5, 1, -2)
    scene.add(rimLight)

    // Progressive asynchronous layer loading
    ATLAS_LAYERS.forEach((spec) => {
      setLoadingLayers((prev) => ({ ...prev, [spec.id]: true }))
      muatAtlas(spec.file)
        .then((dimuat: AtlasDimuat) => {
          if (disposed) return
          layerGroupsRef.current.set(spec.id, dimuat.scene)
          nameMapsRef.current.set(spec.id, dimuat.namaAsli)
          scene.add(dimuat.scene)
          setLoadingLayers((prev) => ({ ...prev, [spec.id]: false }))
          applyLayerVisibility()
        })
        .catch(() => {
          if (!disposed) {
            setLoadingLayers((prev) => ({ ...prev, [spec.id]: false }))
          }
        })
    })

    const onResize = () => {
      if (!mount || !rendererRef.current || !cameraRef.current) return
      const w = mount.clientWidth
      const h = Math.max(340, mount.clientHeight)
      cameraRef.current.aspect = w / h
      cameraRef.current.updateProjectionMatrix()
      rendererRef.current.setSize(w, h)
    }

    const ro = new ResizeObserver(onResize)
    ro.observe(mount)

    const renderLoop = () => {
      if (disposed) return
      if (isVisible && !document.hidden) {
        controls.update()
        renderer.render(scene, camera)
      }
      rafId = requestAnimationFrame(renderLoop)
    }
    rafId = requestAnimationFrame(renderLoop)

    const io = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting
    }, { threshold: 0.05 })
    io.observe(mount)

    return () => {
      disposed = true
      cancelAnimationFrame(rafId)
      io.disconnect()
      ro.disconnect()
      controls.dispose()
      layerGroupsRef.current.forEach((group) => {
        scene.remove(group)
        group.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            obj.geometry?.dispose()
            if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose())
            else obj.material?.dispose()
          }
        })
      })
      renderer.dispose()
      mount.replaceChildren()
    }
  }, [applyLayerVisibility])

  // Filtered structures matching search query
  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return []
    const q = searchQuery.toLowerCase()
    const matches: Array<{ name: string; layer: string }> = []
    nameMapsRef.current.forEach((map, layerId) => {
      for (const rawName of map.values()) {
        if (rawName.toLowerCase().includes(q) && matches.length < 8) {
          matches.push({ name: rawName, layer: layerId })
        }
      }
    })
    return matches
  }, [searchQuery])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        minHeight: '85vh',
        background: '#070b14',
        color: '#f8fafc',
        borderRadius: '1.25rem',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Top Bar: Ruthless Simplicity Navigation (<=6 Controls) */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem 1.25rem',
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#00BF63' }}>
            Panacea Atlas Home
          </span>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>· 7 Shipped Z-Anatomy Layers</span>
        </div>

        {/* 3-Stage Workflow Switcher */}
        <div style={{ display: 'flex', background: 'rgba(0, 0, 0, 0.35)', padding: '0.2rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.08)' }}>
          {(['anatomy', 'physiology', 'clinical'] as const).map((s) => {
            const isActive = stage === s
            const labels = { anatomy: '1. Anatomy', physiology: '2. Living Physiology', clinical: '3. Clinical Relevance' }
            return (
              <button
                key={s}
                type="button"
                onClick={() => setStage(s)}
                style={{
                  background: isActive ? '#00BF63' : 'transparent',
                  color: isActive ? '#ffffff' : '#94a3b8',
                  border: 'none',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {labels[s]}
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Workspace: 3D Viewport with Floating Controls & Side Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedStructure ? 'minmax(0, 1fr) 360px' : '1fr', flex: 1, minHeight: '620px', position: 'relative' }}>
        {/* 3D Viewport Host */}
        <div
          ref={mountRef}
          onClick={handleCanvasClick}
          style={{ width: '100%', height: '100%', minHeight: '580px', position: 'relative', cursor: 'pointer' }}
        >
          {layerError && (
            <div style={{ position: 'absolute', top: '1rem', left: '1rem', padding: '0.75rem 1rem', borderRadius: '0.5rem', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#fca5a5', fontSize: '0.8rem' }}>
              {layerError}
            </div>
          )}

          {/* Floating HUD: Layer Peel Slider & Region Selector */}
          <div
            style={{
              position: 'absolute',
              bottom: '1rem',
              left: '1rem',
              right: selectedStructure ? '1rem' : 'auto',
              maxWidth: '520px',
              padding: '0.75rem 1rem',
              borderRadius: '0.75rem',
              background: 'rgba(10, 15, 29, 0.85)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              pointerEvents: 'auto',
            }}
          >
            {/* Peel Slider */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem' }}>
              <span style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#38bdf8' }}>
                Layer Peel: {ATLAS_LAYERS[peelLevel]?.label ?? 'Deep'}
              </span>
              <span style={{ color: '#94a3b8' }}>Level {peelLevel} / 6</span>
            </div>
            <input
              type="range"
              min={0}
              max={6}
              step={1}
              value={peelLevel}
              onChange={(e) => setPeelLevel(Number(e.target.value))}
              aria-label="Layer peel depth"
              style={{ width: '100%', accentColor: '#00BF63', height: '6px', cursor: 'pointer' }}
            />

            {/* Region Tabs */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.2rem' }}>
              {ANATOMICAL_REGIONS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => focusRegion(r.id)}
                  style={{
                    background: selectedRegion === r.id ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                    border: selectedRegion === r.id ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.06)',
                    color: selectedRegion === r.id ? '#38bdf8' : '#cbd5e1',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.375rem',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Search Overlay (Top Left) */}
          <div style={{ position: 'absolute', top: '1rem', left: '1rem', width: '240px', pointerEvents: 'auto' }}>
            <input
              type="text"
              placeholder="Search structure (e.g. femur, aorta)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.45rem 0.75rem',
                borderRadius: '0.5rem',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                background: 'rgba(15, 23, 42, 0.85)',
                color: '#fff',
                fontSize: '0.75rem',
                outline: 'none',
              }}
            />
            {searchResults.length > 0 && (
              <div style={{ marginTop: '0.25rem', background: 'rgba(15, 23, 42, 0.95)', borderRadius: '0.5rem', border: '1px solid rgba(255, 255, 255, 0.12)', maxHeight: '180px', overflowY: 'auto' }}>
                {searchResults.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setSelectedStructure({
                        meshName: item.name,
                        layerId: item.layer,
                        cleanName: item.name.replace(/_/g, ' '),
                        functionalRole: `Normal human reference geometry from ${item.layer}.glb.`,
                        organKey: item.name.toLowerCase(),
                      })
                      setSearchQuery('')
                    }}
                    style={{ padding: '0.35rem 0.6rem', fontSize: '0.7rem', color: '#e2e8f0', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                  >
                    <b>{item.name.replace(/_/g, ' ')}</b> <span style={{ color: '#94a3b8', fontSize: '0.6rem' }}>({item.layer})</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Side Panel: Progressive Disclosure per Stage */}
        {selectedStructure && (
          <div
            style={{
              background: 'rgba(10, 15, 29, 0.95)',
              borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
              maxHeight: '100%',
              gap: '1rem',
            }}
          >
            {/* Header with Close */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 800, color: '#00BF63', letterSpacing: '0.1em' }}>
                  {selectedStructure.layerId} layer
                </span>
                <h4 style={{ margin: '0.2rem 0 0 0', fontSize: '1.15rem', fontWeight: 900, color: '#ffffff' }}>
                  {selectedStructure.cleanName}
                </h4>
                <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                  Source: {selectedStructure.meshName}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStructure(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.1rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* STAGE 1: ANATOMY SUMMARY */}
            {stage === 'anatomy' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: '#38bdf8' }}>
                    Succinct Functional Role
                  </span>
                  <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.8rem', lineHeight: 1.5, color: '#e2e8f0' }}>
                    {selectedStructure.functionalRole}
                  </p>
                </div>

                <div style={{ padding: '0.6rem', borderRadius: '0.5rem', background: 'rgba(0,191,99,0.08)', border: '1px solid rgba(0,191,99,0.2)', fontSize: '0.7rem', color: '#86efac' }}>
                  <b>Truth Class:</b> ATLAS_REFERENCE_LABEL (Normative Population Geometry, Z-Anatomy CC-BY-SA).
                </div>

                {/* Primary Stage Transition CTAs */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setStage('physiology')}
                    style={{
                      background: '#0284c7',
                      color: '#ffffff',
                      border: 'none',
                      padding: '0.5rem',
                      borderRadius: '0.5rem',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    See Living Physiology →
                  </button>
                  <button
                    type="button"
                    onClick={() => setStage('clinical')}
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      color: '#ffffff',
                      border: '1px solid rgba(255,255,255,0.12)',
                      padding: '0.5rem',
                      borderRadius: '0.5rem',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    Clinical Relevance →
                  </button>
                </div>
              </div>
            )}

            {/* STAGE 2: LIVING PHYSIOLOGY (Same Scene Shell) */}
            {stage === 'physiology' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase' }}>
                  Stage 2: Mechanistic Physiology Simulation
                </div>

                {/* Mount appropriate deck depending on organ system */}
                {selectedStructure.layerId === 'cardiovascular' || selectedStructure.cleanName.toLowerCase().includes('heart') ? (
                  <CardiopulmonaryCouplingDeck />
                ) : selectedStructure.layerId === 'nervous' || selectedStructure.cleanName.toLowerCase().includes('brain') ? (
                  <NeuroFascicularReflexDeck />
                ) : (
                  <SoftTissueBiomechanicsDeck />
                )}

                <button
                  type="button"
                  onClick={() => setStage('clinical')}
                  style={{
                    background: '#00BF63',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.5rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    marginTop: '0.5rem',
                  }}
                >
                  Advance to Clinical Relevance →
                </button>
              </div>
            )}

            {/* STAGE 3: CLINICAL RELEVANCE */}
            {stage === 'clinical' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase' }}>
                  Stage 3: Clinical & Diagnostic Correlation
                </div>

                <div style={{ padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8' }}>
                    Vascular Territory & Referred Pain
                  </div>
                  <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.75rem', lineHeight: 1.5, color: '#cbd5e1' }}>
                    Segmental perfusion and viscerosomatic referred pain dermatomes (C1–S5) correlate directly with this structure.
                  </p>
                </div>

                {/* Fail-closed Boundary Notice */}
                <div style={{ padding: '0.6rem', borderRadius: '0.5rem', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '0.7rem', color: '#fca5a5' }}>
                  <b>Clinical Gate:</b> Reference correlation for educational study. Does not constitute autonomous patient diagnosis or signed radiological report.
                </div>

                <button
                  type="button"
                  onClick={() => setStage('anatomy')}
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    color: '#ffffff',
                    border: '1px solid rgba(255,255,255,0.12)',
                    padding: '0.5rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  ← Return to Anatomy View
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
