import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Vector2 } from 'three'
import { BODY_REGIONS, type BodyRegion } from '../lib/bodyRegions'

// ─────────────────────────────────────────────────────────────────────────────
// Model 3D INTERAKTIF (bisa diputar, diperbesar, diklik) — dirender langsung
// lewat WebGL (Three.js/react-three-fiber), bukan gambar/video.
//
// Bentuknya bukan lagi bola/kapsul polos: setiap segmen (dada, perut,
// panggul, lengan, kaki) adalah LatheGeometry — kurva radius-per-tinggi yang
// diputar 360° — dengan titik kontrolnya mengikuti proporsi tubuh manusia
// nyata (bahu melebar lalu menyempit ke pinggang, panggul melebar lagi,
// lengan/kaki meruncing dari pangkal ke ujung), bukan silinder seragam.
//
// Yang TETAP tidak berubah dari catatan sebelumnya: ini bukan mesh anatomi
// terperinci (otot/saraf/pembuluh darah individual seperti Z-Anatomy/
// BodyParts3D) — itu berkas aset besar berlisensi yang tidak bisa diunduh
// dari sandbox ini. Kurva di bawah ditulis dari nol berdasarkan proporsi
// tubuh manusia umum (kepala ~1/8 tinggi badan, dst.), bukan disalin dari
// model atau gambar mana pun.
// ─────────────────────────────────────────────────────────────────────────────

const SKIN = '#e8b894'
const SKIN_ACTIVE = '#00BF63'
const SKIN_HOVER = '#f0c9a8'

/** Membuat profil Lathe dari titik-titik (tinggi-relatif, jari-jari), lalu
 *  menaikkannya ke rentang y absolut [yBottom, yTop]. */
function profile(points: [number, number][], yBottom: number, yTop: number): Vector2[] {
  return points.map(([t, r]) => new Vector2(Math.max(0.001, r), yBottom + t * (yTop - yBottom)))
}

function LatheMesh({
  region,
  isActive,
  onPick,
  points,
  rotationZ = 0,
}: {
  region: BodyRegion
  isActive: boolean
  onPick: (r: BodyRegion) => void
  points: Vector2[]
  rotationZ?: number
}) {
  const [hovered, setHovered] = useState(false)
  const color = isActive ? SKIN_ACTIVE : hovered ? SKIN_HOVER : SKIN

  return (
    <mesh
      position={region.pos3d}
      rotation={[0, 0, rotationZ]}
      onClick={(e) => { e.stopPropagation(); onPick(region) }}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer' }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto' }}
    >
      <latheGeometry args={[points, 24]} />
      <meshStandardMaterial
        color={color}
        roughness={0.55}
        metalness={0.02}
        emissive={isActive ? '#00BF63' : '#000000'}
        emissiveIntensity={isActive ? 0.3 : 0}
      />
    </mesh>
  )
}

function Figure({ active, onPick }: { active: BodyRegion | null; onPick: (r: BodyRegion) => void }) {
  const by = (key: string) => BODY_REGIONS.find((r) => r.key === key)!

  // Kurva torso dari nol, bukan diambil dari referensi manapun — dinaikkan
  // dari titik terendah tiap segmen ke titik tertinggi lewat profile().
  const neckPts = profile([[0, 0.24], [0.5, 0.16], [1, 0.15]], 2.62, 2.86)
  const chestPts = profile([
    [0, 0.24], [0.15, 0.34], [0.45, 0.36], [0.7, 0.3], [1, 0.24],
  ], 2.1, 2.62)
  const abdomenPts = profile([
    [0, 0.24], [0.4, 0.2], [0.7, 0.21], [1, 0.24],
  ], 1.68, 2.1)
  const pelvisPts = profile([
    [0, 0.24], [0.3, 0.24], [0.7, 0.3], [1, 0.24],
  ], 1.32, 1.68)

  // Lengan: bahu → siku (lebih tebal) → pergelangan (meruncing). Direvolusi
  // lalu diputar 90° (rotationZ) supaya "tinggi" lathe-nya menjadi horizontal
  // (menjulur ke samping), dan ditempatkan di posisi bahu masing-masing sisi.
  const armPts = profile([[0, 0.1], [0.45, 0.11], [0.8, 0.08], [1, 0.055]], 0, 1.35)
  // Kaki: paha (paling tebal) → lutut → betis → pergelangan kaki.
  const legPts = profile([[0, 0.24], [0.35, 0.19], [0.55, 0.16], [0.85, 0.11], [1, 0.09]], 0, 1.55)

  return (
    <group>
      {/* Kepala — bola sedikit lonjong, bukan bola sempurna, supaya tidak
          terbaca seperti bola pantai di atas leher. */}
      <mesh
        position={by('head').pos3d}
        scale={[1, 1.18, 0.92]}
        onClick={(e) => { e.stopPropagation(); onPick(by('head')) }}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer' }}
        onPointerOut={() => { document.body.style.cursor = 'auto' }}
      >
        <sphereGeometry args={[0.3, 28, 28]} />
        <meshStandardMaterial
          color={active?.key === 'head' ? SKIN_ACTIVE : SKIN}
          roughness={0.55}
          emissive={active?.key === 'head' ? '#00BF63' : '#000000'}
          emissiveIntensity={active?.key === 'head' ? 0.3 : 0}
        />
      </mesh>

      <LatheMesh region={by('neck')} isActive={active?.key === 'neck'} onPick={onPick} points={neckPts} />
      <LatheMesh region={{ ...by('chest'), pos3d: [0, 0, 0] }} isActive={active?.key === 'chest'} onPick={onPick} points={chestPts} />
      <LatheMesh region={{ ...by('abdomen'), pos3d: [0, 0, 0] }} isActive={active?.key === 'abdomen'} onPick={onPick} points={abdomenPts} />
      <LatheMesh region={{ ...by('pelvis'), pos3d: [0, 0, 0] }} isActive={active?.key === 'pelvis'} onPick={onPick} points={pelvisPts} />

      {/* Jantung — bola kecil tertanam di dalam dinding dada (bukan
          menonjol di depan), warna dibaur dengan kulit supaya tidak terbaca
          sebagai bola merah lepas; tetap bisa diklik/disorot saat aktif. */}
      <mesh position={by('heart').pos3d} onClick={(e) => { e.stopPropagation(); onPick(by('heart')) }}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial
          color={active?.key === 'heart' ? SKIN_ACTIVE : '#c96f52'}
          emissive={active?.key === 'heart' ? '#00BF63' : '#000000'}
          emissiveIntensity={active?.key === 'heart' ? 0.4 : 0}
        />
      </mesh>

      {/* Lengan — bahu di x≈±0.44, digantung ke bawah di sisi badan (bukan
          menjulur mendatar seperti huruf T) dengan sedikit condong keluar
          supaya terlihat tergantung wajar. */}
      <group position={[-0.46, 2.5, 0]}>
        <LatheMesh region={{ ...by('arm-left'), pos3d: [0, 0, 0] }} isActive={active?.key === 'arm-left'} onPick={onPick} points={armPts} rotationZ={Math.PI - 0.16} />
      </group>
      <group position={[0.46, 2.5, 0]}>
        <LatheMesh region={{ ...by('arm-right'), pos3d: [0, 0, 0] }} isActive={active?.key === 'arm-right'} onPick={onPick} points={armPts} rotationZ={-(Math.PI - 0.16)} />
      </group>

      {/* Kaki — pangkal paha di bawah panggul, sedikit merenggang ke
          samping seperti berdiri wajar, bukan menyatu di tengah. */}
      <group position={[-0.16, 1.32, 0]}>
        <LatheMesh region={{ ...by('leg-left'), pos3d: [0, 0, 0] }} isActive={active?.key === 'leg-left'} onPick={onPick} points={legPts} rotationZ={Math.PI} />
      </group>
      <group position={[0.16, 1.32, 0]}>
        <LatheMesh region={{ ...by('leg-right'), pos3d: [0, 0, 0] }} isActive={active?.key === 'leg-right'} onPick={onPick} points={legPts} rotationZ={Math.PI} />
      </group>
    </group>
  )
}

export function Body3D({ active, onPick }: { active: BodyRegion | null; onPick: (r: BodyRegion) => void }) {
  return (
    <div className="h-[400px] w-full overflow-hidden rounded-2xl bg-gradient-to-b from-neutral-900 to-neutral-950">
      <Canvas camera={{ position: [0, 0, 5.6], fov: 44 }}>
        <ambientLight intensity={0.65} />
        <directionalLight position={[3, 5, 4]} intensity={1.15} />
        <directionalLight position={[-3, 1, -3]} intensity={0.35} />
        {/* Figur dinaikkan/diturunkan supaya rentang kepala↔kaki (y≈-0.23..3.57
            sebelum offset, pusatnya ≈1.67) terpusat di y=0 dan seluruhnya
            masuk bingkai kamera. */}
        <group position={[0, -1.67, 0]}>
          <Figure active={active} onPick={onPick} />
        </group>
        <OrbitControls enablePan={false} minDistance={3} maxDistance={9} target={[0, 0, 0]} />
      </Canvas>
    </div>
  )
}

export default Body3D
