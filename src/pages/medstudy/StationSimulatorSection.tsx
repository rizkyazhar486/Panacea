import { useState } from 'react'
import { Card, SectionTitle, Badge } from '../../components/ui'
import { IconStethoscope } from '../../components/icons'
import { OSCE_STATION_RUBRICS } from '../../lib/osceStationRubrics'

export default function StationSimulatorSection() {
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const station = OSCE_STATION_RUBRICS[idx % OSCE_STATION_RUBRICS.length]

  const next = () => { setIdx((i) => (i + 1) % OSCE_STATION_RUBRICS.length); setRevealed(false) }
  const prev = () => { setIdx((i) => (i - 1 + OSCE_STATION_RUBRICS.length) % OSCE_STATION_RUBRICS.length); setRevealed(false) }

  return (
    <div className="space-y-4">
      <Card className="!p-5">
        <SectionTitle icon={<IconStethoscope size={20} />} title="Station Simulator" subtitle="Official UKMPPD OSCE station templates — scenario, task, and the full examiner scoring rubric" />
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
          Read the scenario, mentally (or out loud) run through the tasks like a real OSCE station,
          then tap "Reveal examiner findings" to check your anamnesis, exam findings, diagnosis, and
          treatment against the official rubric.
        </p>
      </Card>

      <Card className="!p-4">
        <div className="flex items-center justify-between gap-2">
          <button onClick={prev} className="rounded-full bg-neutral-100 px-3 py-1.5 text-[11px] font-bold text-neutral-600 dark:bg-white/10 dark:text-neutral-300">← Prev</button>
          <span className="text-[11px] font-bold text-neutral-400">Station {idx + 1} / {OSCE_STATION_RUBRICS.length}</span>
          <button onClick={next} className="rounded-full bg-neutral-100 px-3 py-1.5 text-[11px] font-bold text-neutral-600 dark:bg-white/10 dark:text-neutral-300">Next →</button>
        </div>
      </Card>

      <Card className="!p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-xs font-black uppercase tracking-wide text-neutral-400">{station.system}</div>
            <div className="text-[16px] font-black text-ink dark:text-white">{station.title}</div>
          </div>
          <Badge tone="brand">{station.allocatedMinutes} menit</Badge>
        </div>
        <p className="mt-1 text-[11px] font-semibold text-neutral-400">SKDI: {station.skdiLevel}</p>

        <div className="mt-3 rounded-xl bg-neutral-50 p-3 dark:bg-white/5">
          <div className="text-[11px] font-black uppercase tracking-wide text-neutral-400">Skenario Klinik</div>
          <p className="mt-1 text-[13px] leading-relaxed text-neutral-700 dark:text-neutral-200">{station.scenario}</p>
        </div>

        <div className="mt-3">
          <div className="text-[11px] font-black uppercase tracking-wide text-neutral-400">Tugas</div>
          <ol className="mt-1 list-decimal space-y-1 pl-4 text-[13px] leading-relaxed text-neutral-700 dark:text-neutral-200">
            {station.tasks.map((t, i) => <li key={i}>{t}</li>)}
          </ol>
        </div>

        {!revealed ? (
          <button onClick={() => setRevealed(true)} className="mt-4 w-full rounded-xl bg-brand px-4 py-3 text-sm font-bold text-white">
            Reveal examiner findings
          </button>
        ) : (
          <div className="mt-4 space-y-3 border-t border-neutral-200 pt-3 dark:border-white/10">
            {station.examinerFindings.anamnesis && (
              <div>
                <div className="text-[11px] font-black uppercase tracking-wide text-brand-dark">Anamnesis (jawaban PS)</div>
                <p className="mt-1 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-300">{station.examinerFindings.anamnesis}</p>
              </div>
            )}
            {station.examinerFindings.physicalExam && (
              <div>
                <div className="text-[11px] font-black uppercase tracking-wide text-brand-dark">Pemeriksaan Fisik</div>
                <p className="mt-1 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-300">{station.examinerFindings.physicalExam}</p>
              </div>
            )}
            {station.examinerFindings.supportingExam && (
              <div>
                <div className="text-[11px] font-black uppercase tracking-wide text-brand-dark">Pemeriksaan Penunjang</div>
                <p className="mt-1 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-300">{station.examinerFindings.supportingExam}</p>
              </div>
            )}
            {station.examinerFindings.diagnosis && (
              <div>
                <div className="text-[11px] font-black uppercase tracking-wide text-brand-dark">Diagnosis</div>
                <p className="mt-1 text-[13px] font-bold text-ink dark:text-white">{station.examinerFindings.diagnosis}</p>
                {station.examinerFindings.differentials && station.examinerFindings.differentials.length > 0 && (
                  <p className="mt-0.5 text-[12px] text-neutral-500">DD: {station.examinerFindings.differentials.join(', ')}</p>
                )}
              </div>
            )}
            {station.examinerFindings.treatment && (
              <div>
                <div className="text-[11px] font-black uppercase tracking-wide text-brand-dark">Tatalaksana</div>
                <p className="mt-1 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-300">{station.examinerFindings.treatment}</p>
              </div>
            )}
            {station.standardPatient && (
              <div className="rounded-lg bg-neutral-50 p-3 dark:bg-white/5">
                <div className="text-[11px] font-black uppercase tracking-wide text-neutral-400">Naskah Pasien Standar</div>
                <p className="mt-1 text-[12px] text-neutral-500">
                  {station.standardPatient.nama} · {station.standardPatient.usia} · {station.standardPatient.jenisKelamin} · {station.standardPatient.pekerjaan}
                </p>
                {station.standardPatient.keluhanUtama && <p className="mt-1 text-[12px] text-neutral-600 dark:text-neutral-300"><b>Keluhan utama:</b> {station.standardPatient.keluhanUtama}</p>}
                {station.standardPatient.riwayatPenyakitSekarang && <p className="mt-1 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-300">{station.standardPatient.riwayatPenyakitSekarang}</p>}
                {station.standardPatient.pertanyaanWajib && <p className="mt-1 text-[12px] italic text-neutral-500">"{station.standardPatient.pertanyaanWajib}"</p>}
                {station.standardPatient.peranWajib && <p className="mt-1 text-[12px] text-neutral-400">Peran: {station.standardPatient.peranWajib}</p>}
              </div>
            )}
            {station.author && <p className="text-[10px] text-neutral-400">Penulis: {station.author}{station.reference ? ` · Referensi: ${station.reference}` : ''}</p>}
          </div>
        )}
      </Card>

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Diadaptasi dari template station OSCE UKMPPD resmi lintas fakultas kedokteran. Gunakan sebagai
        simulasi latihan — kompetensi & pemahaman klinis tetap yang utama, bukan hafalan kasus ini saja.
      </div>
    </div>
  )
}
