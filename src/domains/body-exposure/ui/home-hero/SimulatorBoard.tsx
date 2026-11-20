// Nine charts of one simulated body, all driven by the scenario picker. Every number is read back from
// lib/bodySim's simulate() for the chosen scenario, so changing the scenario changes every chart at once.
//
// This is a MODEL of a textbook adult in that state, never a measurement of the person looking at it. Each tile
// says what it draws through its own shape and its glyph; the wording sits behind the tile's (i) disclosure.

import { useMemo, useState } from 'react'
import {
  AreaChart, BubbleChart, DivergingChart, DonutChart, GaugeChart, GroupedBarChart, HeatmapChart, RadarChart,
  StackedColumnChart, WaterfallChart,
} from '../../../../shared/charts/Charts.tsx'
import { DEFAULT_PARAMS, cardiacStateAt } from '../../engine/cardiacCycle.ts'
import {
  BOARD_METRICS, oxygenCascade, oxygenSplit, ratiosVsRest, scenarioRows, ventilationSplit,
} from '../../engine/home-hero/homeBodyStage.ts'
import './simulatorBoard.css'

const TONE = { heart: '#ef4459', flow: '#e5739a', air: '#2fb8e6', o2: '#4cbf6b', renal: '#d9a72f', cold: '#1d4e63', hot: '#f08a3c', down: '#6c8699' }

/** Scenario marks: one picture per state, the name only in the tooltip and accessible label. */
const SCENARIO_GLYPH: Readonly<Record<string, string>> = {
  normal: 'M12 20.5C7 16.9 3.5 13.9 3.5 10.2A4.6 4.6 0 0 1 12 7.6a4.6 4.6 0 0 1 8.5 2.6c0 3.7-3.5 6.7-8.5 10.3Z',
  exercise: 'M14 4.5a1.8 1.8 0 1 0 0 3.6a1.8 1.8 0 0 0 0-3.6Z M9 21l2.5-6l3 2.5V21 M6.5 12.5l3-3.5h4l2.5 3.5h3 M11.5 15l2-6',
  hemorrhage: 'M12 3.5c3.6 4.6 5.5 7.9 5.5 10.6a5.5 5.5 0 0 1-11 0c0-2.7 1.9-6 5.5-10.6Z',
  sepsis: 'M12 7.5a4.5 4.5 0 1 0 0 9a4.5 4.5 0 0 0 0-9Z M12 3v3 M12 18v3 M3 12h3 M18 12h3 M5.6 5.6l2.1 2.1 M16.3 16.3l2.1 2.1 M5.6 18.4l2.1-2.1 M16.3 7.7l2.1-2.1',
  'heart-failure': 'M12 20.5C7 16.9 3.5 13.9 3.5 10.2A4.6 4.6 0 0 1 12 7.6a4.6 4.6 0 0 1 8.5 2.6c0 3.7-3.5 6.7-8.5 10.3Z M12 7.6l-1.6 4h3l-1.8 4.6',
  copd: 'M12 3v8 M9.5 11c0-2-1-3.2-2.4-3.2C5.2 7.8 4 10.4 4 13.4c0 2.4.6 4.6 2.2 4.6c1.6 0 3.3-1.4 3.3-3.4Z M14.5 15.5l5 5 M19.5 15.5l-5 5',
  aki: 'M14.5 4.2c3 0 5 3.3 5 7.4s-2 7.4-5 7.4c-2.2 0-3.1-1.8-3.8-3.6c-.7-1.9-1.4-2.8-3-3.8c1.6-1 2.3-1.9 3-3.8c.7-1.8 1.6-3.6 3.8-3.6Z M4 20L20 4',
  ards: 'M12 3v8 M9.5 11c0-2-1-3.2-2.4-3.2C5.2 7.8 4 10.4 4 13.4c0 2.4.6 4.6 2.2 4.6c1.6 0 3.3-1.4 3.3-3.4Zm5 0c0-2 1-3.2 2.4-3.2c1.9 0 3.1 2.6 3.1 5.6c0 2.4-.6 4.6-2.2 4.6c-1.6 0-3.3-1.4-3.3-3.4Z M6 13h1 M17 13h1',
  anemia: 'M12 3.5c3.6 4.6 5.5 7.9 5.5 10.6a5.5 5.5 0 0 1-11 0c0-2.7 1.9-6 5.5-10.6Z M9 14h6',
}

/** Tile marks: what each chart measures, drawn instead of written. */
const TILE_GLYPH: Readonly<Record<string, string>> = {
  o2: 'M12 4a8 8 0 1 0 0 16a8 8 0 0 0 0-16Z M9 12a3 3 0 1 0 6 0a3 3 0 0 0-6 0Z',
  pressure: 'M4 16a8 8 0 1 1 16 0 M12 16l4-5',
  blood: 'M12 3.5c3.6 4.6 5.5 7.9 5.5 10.6a5.5 5.5 0 0 1-11 0c0-2.7 1.9-6 5.5-10.6Z',
  radar: 'M12 3l8 6l-3 10H7L4 9Z M12 8l4 3l-1.5 5h-5L8 11Z',
  air: 'M3 9h11a3 3 0 1 0-3-3 M3 13h15a3 3 0 1 1-3 3 M3 17h7',
  cascade: 'M4 5h4v14H4Z M10 9h4v10h-4Z M16 13h4v6h-4Z',
  diverge: 'M12 3v18 M12 7h7 M5 11h7 M12 15h5 M8 19h4',
  bubble: 'M8 14a4 4 0 1 0 0 .01Z M16.5 8a2.5 2.5 0 1 0 0 .01Z M17 17a1.5 1.5 0 1 0 0 .01Z',
  heat: 'M4 4h5v5H4Z M10 4h5v5h-5Z M16 4h4v5h-4Z M4 10h5v5H4Z M10 10h5v5h-5Z M16 10h4v5h-4Z M4 16h5v4H4Z M10 16h5v4h-5Z M16 16h4v4h-4Z',
  bars: 'M5 20V10 M9 20V6 M15 20v-8 M19 20V9',
  wave: 'M3 14c2 0 2-6 4.5-6S10 18 12.5 18S15 6 17.5 6S20 14 21 14',
}

function Mark({ d, size = 18 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable="false">
      <path d={d} />
    </svg>
  )
}

function Tile({ title, note, glyph, wide, children }: { title: string; note: string; glyph: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <figure className={wide ? 'sb-tile sb-tile-wide' : 'sb-tile'} aria-label={title}>
      <figcaption className="sb-cap">
        <span className="sb-mark" title={title}><Mark d={TILE_GLYPH[glyph] ?? TILE_GLYPH.bars} /></span>
        <details className="sb-info">
          <summary aria-label={`About ${title}`}><span aria-hidden>i</span></summary>
          <p>{note}</p>
        </details>
      </figcaption>
      {children}
    </figure>
  )
}

export function SimulatorBoard() {
  const rows = useMemo(() => scenarioRows(), [])
  const [key, setKey] = useState('normal')
  const row = rows.find((r) => r.key === key) ?? rows[0]
  const rest = rows.find((r) => r.key === 'normal') ?? rows[0]

  const ratios = ratiosVsRest(rows, row.key)
  const o2 = oxygenSplit(row)
  const vent = ventilationSplit(row)
  const cascade = oxygenCascade(row)
  const lv = useMemo(() => {
    const beat = 60 / DEFAULT_PARAMS.hrBpm
    return Array.from({ length: 80 }, (_, i) => cardiacStateAt(DEFAULT_PARAMS, (i / 79) * beat * 2).ventricleMl)
  }, [])
  const matrix = rows.map((r) => ratiosVsRest(rows, r.key).map((v) => Math.min(3, v)))

  return (
    <section className="sb" aria-label="Whole-body simulator">
      <div className="sb-pick" role="group" aria-label="Scenario">
        {rows.map((r) => (
          <button key={r.key} type="button" aria-pressed={r.key === row.key} aria-label={r.label} title={r.label} onClick={() => setKey(r.key)} className="sb-chip" data-scenario={r.key}>
            <Mark d={SCENARIO_GLYPH[r.key] ?? SCENARIO_GLYPH.normal} size={20} />
          </button>
        ))}
        <span className="sb-sim" title="Simulated model of a textbook adult, not your measurements">SIM</span>
      </div>

      <div className="sb-grid">
        <Tile title="Oxygen saturation" glyph="o2" note="Arterial oxygen saturation the model computes for this state, on a 70–100% dial.">
          <GaugeChart value={row.out.sao2} min={70} max={100} tone={TONE.o2} centre={<><b>{row.out.sao2.toFixed(0)}</b><i>%</i></>} />
        </Tile>

        <Tile title="Mean pressure" glyph="pressure" note="Mean arterial pressure for this state, on a 30–130 mmHg dial.">
          <GaugeChart value={row.out.map} min={30} max={130} tone={TONE.flow} centre={<><b>{row.out.map.toFixed(0)}</b><i>mmHg</i></>} />
        </Tile>

        <Tile title="Oxygen in blood" glyph="blood" note="Oxygen carried in one decilitre of arterial blood: the large share bound to haemoglobin, the small one dissolved in plasma.">
          <DonutChart
            size={112} thickness={15}
            slices={[{ key: 'bound', value: o2.bound, tone: TONE.heart }, { key: 'dissolved', value: o2.dissolved, tone: TONE.air }]}
            centre={<><b>{(o2.bound + o2.dissolved).toFixed(1)}</b><i>mL/dL</i></>}
          />
        </Tile>

        <Tile title="Against rest" glyph="radar" note="Each measure as a share of the same measure at rest: the outer ring is three times resting, the centre is zero. Cardiac output, pressure, oxygen delivery, saturation, filtration, urine.">
          <RadarChart
            size={150}
            series={[
              { key: 'rest', values: BOARD_METRICS.map(() => 1 / 3), tone: TONE.down },
              { key: row.key, values: ratios.map((v) => Math.min(1, v / 3)), tone: TONE.heart },
            ]}
          />
        </Tile>

        <Tile title="Ventilation" glyph="air" note="Minute ventilation per scenario, split into the air reaching alveoli and the air that only fills dead space." wide>
          <StackedColumnChart
            columns={rows.map((r) => { const v = ventilationSplit(r); return { key: r.key, parts: [v.alveolar, v.deadSpace] } })}
            tones={[TONE.air, TONE.down]}
          />
        </Tile>

        <Tile title="Oxygen cascade" glyph="cascade" note="Oxygen pressure from inspired air, down by what carbon dioxide displaces in the alveolus, then across the lung to the arterial value.">
          <WaterfallChart base={cascade.base} steps={cascade.steps} up={TONE.o2} down={TONE.down} total={TONE.air} />
        </Tile>

        <Tile title="Change from rest" glyph="diverge" note="How far each measure moves from its resting value in this state: right of the line is above rest, left is below.">
          <DivergingChart rows={BOARD_METRICS.map((m, i) => ({ key: m.key, value: (ratios[i] ?? 1) - 1 }))} up={TONE.o2} down={TONE.heart} />
        </Tile>

        <Tile title="Flow against pressure" glyph="bubble" note="Every scenario placed by cardiac output and mean pressure; the bubble's area is oxygen delivery.">
          <BubbleChart
            rows={rows.map((r) => ({ key: r.key, x: r.out.cardiacOutput, y: r.out.map, size: r.out.do2, tone: r.key === row.key ? TONE.heart : TONE.down }))}
            xDomain={[0, Math.max(...rows.map((r) => r.out.cardiacOutput)) * 1.05]}
            yDomain={[0, Math.max(...rows.map((r) => r.out.map)) * 1.05]}
          />
        </Tile>

        <Tile title="Every state at once" glyph="heat" note="Scenarios down, measures across, each cell shaded by how far it sits from the resting value." wide>
          <HeatmapChart matrix={matrix} cold={TONE.cold} hot={TONE.hot} />
        </Tile>

        <Tile title="Output and delivery" glyph="bars" note="Cardiac output beside oxygen delivery for every scenario, both on their own scale." wide>
          <GroupedBarChart
            groups={rows.map((r) => ({ key: r.key, values: [r.out.cardiacOutput / rest.out.cardiacOutput, r.out.do2 / rest.out.do2] }))}
            tones={[TONE.flow, TONE.o2]}
          />
        </Tile>

        <Tile title="Ventricle filling" glyph="wave" note="Left-ventricular volume across two heartbeats from the cardiac cycle model at its default rate.">
          <AreaChart values={lv} min={DEFAULT_PARAMS.esvMl - 10} max={DEFAULT_PARAMS.edvMl + 10} tone={TONE.heart} />
        </Tile>
      </div>
    </section>
  )
}

export default SimulatorBoard
