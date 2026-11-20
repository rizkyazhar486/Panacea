import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export function HealthTrendRechart({
  data,
  active,
}: {
  readonly data: ReadonlyArray<Record<string, unknown>>
  readonly active: ReadonlyArray<{ readonly key: string; readonly name: string; readonly color: string }>
}) {
  return (
    <div className="mt-3 h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data as Record<string, unknown>[]} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} />
          <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: '1px solid #eee' }} />
          {active.map((s) => (
            <Line key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color} strokeWidth={2} dot={{ r: 2 }} connectNulls />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
