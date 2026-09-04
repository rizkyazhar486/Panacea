import { useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { Mesh } from 'three'
import { BODY_REGIONS, type BodyRegion } from '../lib/bodyRegions'

// ─────────────────────────────────────────────────────────────────────────────
// Model 3D INTERAKTIF (bisa diputar, diperbesar, diklik) — bukan hasil olahan
// gambar, benar-benar dirender lewat WebGL (Three.js/react-three-fiber).
//
// TAPI: bentuknya bola/kapsul/silinder polos, BUKAN mesh anatomi terperinci
// (otot, saraf, pembuluh darah bertekstur seperti Z-Anatomy/BodyParts3D).
// Alasannya tetap sama seperti versi siluet 2D — mesh anatomi nyata adalah
// berkas aset puluhan-ratusan MB dengan lisensinya sendiri, dan sandbox sesi
// ini tidak bisa mengunduh berkas aset dari CDN/GitHub pihak ketiga. Yang
// bisa ditulis sebagai kode di sini adalah geometri primitif orisinal —
// jujur bukan pengganti atlas anatomi, tapi kerangka interaksi 3D yang
// sungguhan (putar/zoom/klik/sorot) sudah berfungsi, dan mesh anatomi asli
// bisa ditukar masuk ke posisi yang sama begitu ada sumber asetnya.
// ─────────────────────────────────────────────────────────────────────────────

function RegionMesh({
  region,
  isActive,
  onPick,
  shape,
  args,
}: {
  region: BodyRegion
  isActive: boolean
  onPick: (r: BodyRegion) => void
  shape: 'sphere' | 'capsule' | 'cylinder' | 'box'
  args: [number, number, number] | [number, number] | [number, number, number, number]
}) {
  const ref = useRef<Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const color = isActive ? '#00BF63' : hovered ? '#5fd99a' : '#9fb8ad'

  return (
    <mesh
      ref={ref}
      position={region.pos3d}
      onClick={(e) => { e.stopPropagation(); onPick(region) }}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer' }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto' }}
    >
      {shape === 'sphere' && <sphereGeometry args={args as [number, number, number]} />}
      {shape === 'capsule' && <capsuleGeometry args={args as [number, number, number, number]} />}
      {shape === 'cylinder' && <cylinderGeometry args={args as [number, number, number]} />}
      {shape === 'box' && <boxGeometry args={args as [number, number, number]} />}
      <meshStandardMaterial color={color} roughness={0.5} metalness={0.05} emissive={isActive ? '#00BF63' : '#000000'} emissiveIntensity={isActive ? 0.25 : 0} />
    </mesh>
  )
}

function Figure({ active, onPick }: { active: BodyRegion | null; onPick: (r: BodyRegion) => void }) {
  const by = (key: string) => BODY_REGIONS.find((r) => r.key === key)!
  return (
    <group>
      <RegionMesh region={by('head')} isActive={active?.key === 'head'} onPick={onPick} shape="sphere" args={[0.55, 24, 24]} />
      <RegionMesh region={by('neck')} isActive={active?.key === 'neck'} onPick={onPick} shape="cylinder" args={[0.2, 0.22, 0.45]} />
      <RegionMesh region={by('chest')} isActive={active?.key === 'chest'} onPick={onPick} shape="capsule" args={[0.55, 0.5, 6, 12]} />
      <RegionMesh region={by('heart')} isActive={active?.key === 'heart'} onPick={onPick} shape="sphere" args={[0.16, 16, 16]} />
      <RegionMesh region={by('abdomen')} isActive={active?.key === 'abdomen'} onPick={onPick} shape="capsule" args={[0.5, 0.5, 6, 12]} />
      <RegionMesh region={by('pelvis')} isActive={active?.key === 'pelvis'} onPick={onPick} shape="box" args={[0.95, 0.4, 0.5]} />
      <RegionMesh region={by('arm-left')} isActive={active?.key === 'arm-left'} onPick={onPick} shape="capsule" args={[0.16, 1.5, 4, 8]} />
      <RegionMesh region={by('arm-right')} isActive={active?.key === 'arm-right'} onPick={onPick} shape="capsule" args={[0.16, 1.5, 4, 8]} />
      <RegionMesh region={by('leg-left')} isActive={active?.key === 'leg-left'} onPick={onPick} shape="capsule" args={[0.22, 1.7, 4, 8]} />
      <RegionMesh region={by('leg-right')} isActive={active?.key === 'leg-right'} onPick={onPick} shape="capsule" args={[0.22, 1.7, 4, 8]} />
    </group>
  )
}

export function Body3D({ active, onPick }: { active: BodyRegion | null; onPick: (r: BodyRegion) => void }) {
  return (
    <div className="h-[360px] w-full overflow-hidden rounded-2xl bg-gradient-to-b from-neutral-900 to-neutral-950">
      <Canvas camera={{ position: [0, 1.2, 6.5], fov: 40 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 5, 4]} intensity={1.1} />
        <directionalLight position={[-3, -2, -4]} intensity={0.3} />
        <Figure active={active} onPick={onPick} />
        <OrbitControls enablePan={false} minDistance={3} maxDistance={10} target={[0, 1.2, 0]} />
      </Canvas>
    </div>
  )
}

export default Body3D
