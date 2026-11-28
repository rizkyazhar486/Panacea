import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { buatRendererAman } from '../../lib/rendererAman'
import { mulaiLoopTerjaga, type LoopTerjaga } from '../../lib/loopRenderTerjaga'
import type {
  RoboticsKinematicsState,
  TelesurgeryLinkStatus,
} from '../../domains/body-exposure/engine/roboticsAnesthesiaEngine'

export interface SurgicalRobotics3DViewportProps {
  readonly mode: 'robotics' | 'distant'
  readonly pitchDeg: number
  readonly yawDeg: number
  readonly insertionMm: number
  readonly wristPitchDeg: number
  readonly jawOpenPct: number
  readonly tissueResistanceN: number
  readonly kinematics: RoboticsKinematicsState
  readonly linkStatus: TelesurgeryLinkStatus
  readonly rttMs: number
  readonly jitterMs: number
  readonly autoSuturePlaying: boolean
}

type CameraPreset = 'iso' | 'macro' | 'top'

const MM_TO_SCENE = 1 / 40
const TISSUE_SURFACE_Y = -3.8

function buildSoftTissueColor(strain01: number): [number, number, number] {
  // Healthy rose-mucosa -> amber tension -> crimson collision limit
  if (strain01 < 0.5) {
    const t = strain01 * 2
    return [0.76 + t * 0.16, 0.34 + t * 0.14, 0.44 - t * 0.18]
  }
  const t = (strain01 - 0.5) * 2
  return [0.92 + t * 0.06, 0.48 - t * 0.34, 0.26 - t * 0.08]
}

export default function SurgicalRobotics3DViewport(props: SurgicalRobotics3DViewportProps) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const [webglReady, setWebglReady] = useState(true)
  const [preset, setPreset] = useState<CameraPreset>('iso')

  const latestRef = useRef(props)
  latestRef.current = props
  const presetTargetRef = useRef<CameraPreset>('iso')
  presetTargetRef.current = preset

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const renderer = buatRendererAman({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    })
    if (!renderer) {
      setWebglReady(false)
      return
    }
    setWebglReady(true)

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    const initialW = Math.max(260, host.clientWidth || 420)
    const initialH = Math.max(220, host.clientHeight || 290)
    renderer.setSize(initialW, initialH, false)
    renderer.domElement.style.display = 'block'
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    renderer.domElement.dataset.roboticsCanvas = 'true'
    host.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#030810')

    const camera = new THREE.PerspectiveCamera(42, initialW / initialH, 0.1, 100)
    camera.position.set(5.4, 2.2, 6.2)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.target.set(0, -2.0, 0)
    controls.minDistance = 2.6
    controls.maxDistance = 14

    // Studio theater lighting
    const hemiLight = new THREE.HemisphereLight(0xa5f3fc, 0x0f172a, 0.9)
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.8)
    keyLight.position.set(4, 7, 5)
    const rimLight = new THREE.DirectionalLight(0x22d3ee, 0.9)
    rimLight.position.set(-5, 3, -4)
    scene.add(hemiLight, keyLight, rimLight)

    // Trocar RCM pedestal & cyan port ring at (0, 0, 0)
    const trocarGroup = new THREE.Group()
    const portRingGeo = new THREE.TorusGeometry(0.42, 0.055, 16, 48)
    const portRingMat = new THREE.MeshStandardMaterial({
      color: 0x22d3ee,
      emissive: 0x0891b2,
      emissiveIntensity: 0.75,
      metalness: 0.6,
      roughness: 0.25,
    })
    const portRing = new THREE.Mesh(portRingGeo, portRingMat)
    portRing.rotation.x = Math.PI / 2

    const trocarSleeveGeo = new THREE.CylinderGeometry(0.14, 0.18, 0.9, 24)
    const metalMat = new THREE.MeshStandardMaterial({
      color: 0xcbd5e1,
      metalness: 0.82,
      roughness: 0.22,
    })
    const trocarSleeve = new THREE.Mesh(trocarSleeveGeo, metalMat)
    trocarSleeve.position.y = 0.25
    trocarGroup.add(portRing, trocarSleeve)
    scene.add(trocarGroup)

    // Subtle workspace floor reference grid beneath tissue
    const gridHelper = new THREE.GridHelper(6.4, 16, 0x164e63, 0x0f172a)
    gridHelper.position.y = TISSUE_SURFACE_Y - 0.55
    scene.add(gridHelper)

    // Primary Robotic Instrument Assembly (pivoting around RCM at origin)
    const armPivot = new THREE.Group()
    const shaftGeo = new THREE.CylinderGeometry(0.065, 0.065, 1, 20)
    const carbonMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.75,
      roughness: 0.32,
    })
    const shaftMesh = new THREE.Mesh(shaftGeo, carbonMat)

    const wristGroup = new THREE.Group()
    const wristHubGeo = new THREE.SphereGeometry(0.11, 18, 18)
    const accentMat = new THREE.MeshStandardMaterial({
      color: 0x34d399,
      emissive: 0x059669,
      emissiveIntensity: 0.45,
      metalness: 0.5,
      roughness: 0.3,
    })
    const wristHub = new THREE.Mesh(wristHubGeo, accentMat)

    const jawGeo = new THREE.BoxGeometry(0.032, 0.28, 0.055)
    jawGeo.translate(0, -0.14, 0)
    const jawLeft = new THREE.Mesh(jawGeo, metalMat)
    const jawRight = new THREE.Mesh(jawGeo, metalMat)
    wristGroup.add(wristHub, jawLeft, jawRight)
    armPivot.add(shaftMesh, wristGroup)
    scene.add(armPivot)

    // Dual Ghost Console Command Arm (Distant Telesurgery overlay)
    const ghostPivot = new THREE.Group()
    const ghostMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.34,
      wireframe: false,
    })
    const ghostShaft = new THREE.Mesh(shaftGeo, ghostMat)
    const ghostTipGeo = new THREE.SphereGeometry(0.12, 16, 16)
    const ghostTip = new THREE.Mesh(ghostTipGeo, ghostMat)
    ghostPivot.add(ghostShaft, ghostTip)
    ghostPivot.visible = false
    scene.add(ghostPivot)

    // Deformable Elastic Soft Tissue Surface Mesh
    const tissueSegs = 28
    const tissueGeo = new THREE.PlaneGeometry(5.6, 5.6, tissueSegs, tissueSegs)
    tissueGeo.rotateX(-Math.PI / 2)
    const posAttr = tissueGeo.attributes.position as THREE.BufferAttribute
    const vertexCount = posAttr.count
    const baseXZ = new Float32Array(vertexCount * 2)
    const colorArray = new Float32Array(vertexCount * 3)
    for (let i = 0; i < vertexCount; i++) {
      baseXZ[i * 2] = posAttr.getX(i)
      baseXZ[i * 2 + 1] = posAttr.getZ(i)
      const [r, g, b] = buildSoftTissueColor(0.2)
      colorArray[i * 3] = r
      colorArray[i * 3 + 1] = g
      colorArray[i * 3 + 2] = b
    }
    tissueGeo.setAttribute('color', new THREE.BufferAttribute(colorArray, 3))
    const tissueMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.58,
      metalness: 0.08,
      side: THREE.DoubleSide,
    })
    const tissueMesh = new THREE.Mesh(tissueGeo, tissueMat)
    tissueMesh.position.y = TISSUE_SURFACE_Y
    scene.add(tissueMesh)

    // Automated 8-point Suture Waypoints + Path + Animated Needle Marker
    const waypointGeo = new THREE.SphereGeometry(0.055, 12, 12)
    const waypointMat = new THREE.MeshBasicMaterial({ color: 0x34d399 })
    const waypointMeshes = Array.from({ length: 8 }, () => {
      const mesh = new THREE.Mesh(waypointGeo, waypointMat)
      scene.add(mesh)
      return mesh
    })

    const suturePoints = Array.from({ length: 8 }, () => new THREE.Vector3())
    const sutureLineGeo = new THREE.BufferGeometry().setFromPoints(suturePoints)
    const sutureLineMat = new THREE.LineBasicMaterial({ color: 0x6ee7b7, transparent: true, opacity: 0.85 })
    const sutureLine = new THREE.Line(sutureLineGeo, sutureLineMat)
    scene.add(sutureLine)

    const needleGeo = new THREE.SphereGeometry(0.09, 14, 14)
    const needleMat = new THREE.MeshBasicMaterial({ color: 0xfef08a })
    const needleMesh = new THREE.Mesh(needleGeo, needleMat)
    scene.add(needleMesh)

    let lastAppliedPreset: CameraPreset | null = null
    let simTimeSec = 0
    let lastTimestampMs = performance.now()
    let contextLost = false

    const handleContextLost = (ev: Event) => {
      ev.preventDefault()
      contextLost = true
      loopRef?.kontekHilang()
    }
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost)

    const updateScene = (nowMs: number) => {
      if (contextLost) return
      const dt = Math.min(0.05, Math.max(0, (nowMs - lastTimestampMs) / 1000))
      lastTimestampMs = nowMs
      simTimeSec += dt

      const state = latestRef.current
      const desiredPreset = presetTargetRef.current
      if (desiredPreset !== lastAppliedPreset) {
        lastAppliedPreset = desiredPreset
        if (desiredPreset === 'iso') {
          camera.position.set(5.4, 2.2, 6.2)
          controls.target.set(0, -2.0, 0)
        } else if (desiredPreset === 'macro') {
          const tip = state.kinematics.tipPositionMm
          const tx = tip.x * MM_TO_SCENE
          const ty = tip.y * MM_TO_SCENE
          const tz = tip.z * MM_TO_SCENE
          camera.position.set(tx + 1.8, ty + 1.3, tz + 2.1)
          controls.target.set(tx, ty - 0.15, tz)
        } else {
          camera.position.set(0.01, 6.8, 0.01)
          controls.target.set(0, -3.2, 0)
        }
        controls.update()
      }

      const pitchRad = (state.pitchDeg * Math.PI) / 180
      const yawRad = (state.yawDeg * Math.PI) / 180
      const wristRad = (state.wristPitchDeg * Math.PI) / 180
      const depthUnits = Math.max(0.5, state.insertionMm * MM_TO_SCENE)
      const jawSpread = 0.12 + (Math.max(0, Math.min(100, state.jawOpenPct)) / 100) * 0.48

      // Console command direction vs Patient follower in Distant mode
      const lagNorm = state.mode === 'distant' ? Math.min(1.4, state.linkStatus.estimatedTrackingLagMm * MM_TO_SCENE * 4) : 0
      const jitterRad =
        state.mode === 'distant' && !state.linkStatus.safeHoldTriggered
          ? Math.sin(simTimeSec * 9.5) * (state.jitterMs / 1000) * 0.45
          : 0

      // Orient ghost arm to ideal surgeon command when Distant Surgery is active
      ghostPivot.visible = state.mode === 'distant'
      ghostPivot.rotation.set(pitchRad, 0, yawRad)
      ghostShaft.scale.set(1, depthUnits, 1)
      ghostShaft.position.set(0, -depthUnits / 2, 0)
      ghostTip.position.set(0, -depthUnits, 0)

      // Orient patient-side follower arm with lag + safe-hold visual state
      const followerPitch = state.linkStatus.safeHoldTriggered && state.mode === 'distant' ? pitchRad * 0.92 : pitchRad - lagNorm * 0.12 + jitterRad
      const followerYaw = state.linkStatus.safeHoldTriggered && state.mode === 'distant' ? yawRad * 0.92 : yawRad - lagNorm * 0.16 - jitterRad * 0.7
      armPivot.rotation.set(followerPitch, 0, followerYaw)
      shaftMesh.scale.set(1, depthUnits, 1)
      shaftMesh.position.set(0, -depthUnits / 2, 0)
      wristGroup.position.set(0, -depthUnits, 0)
      wristGroup.rotation.set(wristRad, 0, 0)
      jawLeft.rotation.z = -jawSpread
      jawRight.rotation.z = jawSpread

      // Update indicator materials for collision force or telesurgery E-stop
      const safeHold = state.mode === 'distant' && state.linkStatus.safeHoldTriggered
      if (safeHold || state.kinematics.forceWarning) {
        accentMat.color.setHex(0xf43f5e)
        accentMat.emissive.setHex(0xbe123c)
      } else if (state.mode === 'distant' && state.linkStatus.state === 'DEGRADED_CAUTION') {
        accentMat.color.setHex(0xfbbf24)
        accentMat.emissive.setHex(0xb45309)
      } else {
        accentMat.color.setHex(0x34d399)
        accentMat.emissive.setHex(0x059669)
      }

      // Deform elastic soft tissue beneath current surgical tip position
      const tipX = Math.max(-2.3, Math.min(2.3, state.kinematics.tipPositionMm.x * MM_TO_SCENE))
      const tipZ = Math.max(-2.3, Math.min(2.3, state.kinematics.tipPositionMm.z * MM_TO_SCENE))
      const strain01 = Math.max(0.05, Math.min(1, state.tissueResistanceN / 7.5))
      const indentDepth = 0.08 + strain01 * 0.62

      const colAttr = tissueGeo.attributes.color as THREE.BufferAttribute
      for (let i = 0; i < vertexCount; i++) {
        const vx = baseXZ[i * 2]!
        const vz = baseXZ[i * 2 + 1]!
        const dx = vx - tipX
        const dz = vz - tipZ
        const distSq = dx * dx + dz * dz
        const gaussian = Math.exp(-distSq / 0.52)
        const vy = -indentDepth * gaussian
        posAttr.setY(i, vy)
        const localStrain = Math.max(0.12, Math.min(1, strain01 * (0.35 + gaussian * 0.95)))
        const [r, g, b] = buildSoftTissueColor(localStrain)
        colAttr.setXYZ(i, r, g, b)
      }
      posAttr.needsUpdate = true
      colAttr.needsUpdate = true
      tissueGeo.computeVertexNormals()

      // Sync 8 automated suture waypoints in 3D space
      const wps = state.kinematics.automatedSutureWaypoints
      const linePosAttr = sutureLineGeo.attributes.position as THREE.BufferAttribute
      for (let i = 0; i < 8; i++) {
        const wp = wps[i]
        if (!wp) continue
        const wx = wp.xMm * MM_TO_SCENE
        const wy = wp.yMm * MM_TO_SCENE
        const wz = wp.zMm * MM_TO_SCENE
        waypointMeshes[i]!.position.set(wx, wy, wz)
        linePosAttr.setXYZ(i, wx, wy, wz)
      }
      linePosAttr.needsUpdate = true

      // Animate suture needle along arc when autoSuturePlaying is enabled
      needleMesh.visible = state.autoSuturePlaying
      if (state.autoSuturePlaying && wps.length >= 2) {
        const phase = (simTimeSec * 0.9) % 1
        const scaled = phase * (wps.length - 1)
        const idx = Math.min(wps.length - 2, Math.floor(scaled))
        const frac = scaled - idx
        const a = wps[idx]!
        const b = wps[idx + 1]!
        needleMesh.position.set(
          (a.xMm + (b.xMm - a.xMm) * frac) * MM_TO_SCENE,
          (a.yMm + (b.yMm - a.yMm) * frac) * MM_TO_SCENE,
          (a.zMm + (b.zMm - a.zMm) * frac) * MM_TO_SCENE,
        )
      }

      controls.update()
      renderer.render(scene, camera)
    }

    let loopRef: LoopTerjaga | null = null
    loopRef = mulaiLoopTerjaga(host, () => {
      updateScene(performance.now())
    })

    const ro = new ResizeObserver(() => {
      if (!host) return
      const w = Math.max(260, host.clientWidth)
      const h = Math.max(220, host.clientHeight)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h, false)
    })
    ro.observe(host)

    return () => {
      ro.disconnect()
      loopRef?.hentikan()
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost)
      controls.dispose()
      portRingGeo.dispose()
      portRingMat.dispose()
      trocarSleeveGeo.dispose()
      metalMat.dispose()
      shaftGeo.dispose()
      carbonMat.dispose()
      wristHubGeo.dispose()
      accentMat.dispose()
      jawGeo.dispose()
      ghostMat.dispose()
      ghostTipGeo.dispose()
      tissueGeo.dispose()
      tissueMat.dispose()
      waypointGeo.dispose()
      waypointMat.dispose()
      sutureLineGeo.dispose()
      sutureLineMat.dispose()
      needleGeo.dispose()
      needleMat.dispose()
      gridHelper.dispose()
      renderer.dispose()
      if (renderer.domElement.parentElement === host) {
        renderer.domElement.remove()
      }
    }
  }, [])

  return (
    <div
      data-surgical-robotics-3d="v1"
      data-live-actuator-connected="false"
      className="dark space-y-2 rounded-2xl border border-cyan-400/25 p-2.5 text-white"
      style={{ backgroundColor: '#030810' }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="font-mono text-[10px] font-black uppercase tracking-wider text-cyan-200">
          {props.mode === 'distant'
            ? `3D Tele-Robotic Twin · Lag ${props.linkStatus.estimatedTrackingLagMm} mm`
            : '3D 6-DOF RCM Surgical Workspace & Soft-Tissue Deformation'}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {([
            ['iso', 'Trocar ISO'],
            ['macro', 'EndoWrist Macro'],
            ['top', 'Top-Down'],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setPreset(id)}
              aria-pressed={preset === id}
              className={`min-h-[44px] rounded-xl border px-3 font-mono text-[10px] font-black transition ${
                preset === id
                  ? 'border-cyan-300 bg-cyan-500/20 text-white'
                  : 'border-white/15 bg-white/5 text-slate-300 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {webglReady ? (
        <div
          ref={hostRef}
          className="relative w-full overflow-hidden rounded-xl border border-white/10"
          style={{ height: 280, backgroundColor: '#030810' }}
          role="img"
          aria-label="Interactive 3D Surgical Robotics kinematic viewport"
        />
      ) : (
        <div
          className="grid place-items-center rounded-xl border border-white/10 bg-slate-950 p-4 text-center font-mono text-xs text-slate-300"
          style={{ height: 240 }}
          role="status"
        >
          <div>
            <p className="font-black text-cyan-200">2D Kinematic Schematic Fallback (WebGL inactive)</p>
            <p className="mt-1 text-[11px] text-slate-400">
              Tip ({props.kinematics.tipPositionMm.x}, {props.kinematics.tipPositionMm.y}, {props.kinematics.tipPositionMm.z}) mm · Force {props.tissueResistanceN} N
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 px-1 font-mono text-[10px] text-slate-400">
        <span>Drag to orbit · Scroll to zoom · Suture 8 pts live</span>
        <span>clinically_reviewed=false · educational simulation</span>
      </div>
    </div>
  )
}
