import { Link } from 'react-router-dom'
import { IconChartUp, IconPill, IconGauge } from './icons'

// Alat harian, satu ketukan dari beranda. Pemilik mewajibkan data harian,
// dosis obat dan kalkulator ada di beranda; sebelumnya dosis dan kalkulator
// hanya tercapai lewat pencarian. Clinical tidak diulang di sini karena sudah
// ada di dok atas; pahlawan beranda tetap dua aksi (lihat
// scripts/uji/home-simplicity-contract.mts). Tampilannya memakai kelas aksi
// pahlawan yang sama supaya beranda tetap satu bahasa visual.
export const HOME_ESSENTIAL_TOOLS = [
  { to: '/ikhtisar', label: 'Daily data', icon: IconChartUp },
  { to: '/drug-info', label: 'Drug dose', icon: IconPill },
  { to: '/clinical-calculators', label: 'Calculators', icon: IconGauge },
] as const

export function HomeEssentialTools() {
  return (
    <nav className="panacea-intent-hero__actions panacea-essential-tools" aria-label="Daily tools">
      {HOME_ESSENTIAL_TOOLS.map(({ to, label, icon: Icon }) => (
        <Link key={to} to={to} className="panacea-intent-action" aria-label={label}>
          <span className="panacea-intent-action__icon" aria-hidden="true"><Icon size={20} /></span>
          <span className="panacea-intent-action__label">{label}</span>
        </Link>
      ))}
    </nav>
  )
}

export default HomeEssentialTools
