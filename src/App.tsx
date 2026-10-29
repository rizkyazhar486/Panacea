import React from 'react'
import ParametricDashboard from './pages/medstudy/ParametricDashboard'
import DailyPreventiveView from './pages/medstudy/DailyPreventiveView'

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-12 text-slate-100 selection:bg-cyan-500 selection:text-slate-950 font-mono">
      <div className="mx-auto max-w-6xl space-y-8">
        <ParametricDashboard />
        <DailyPreventiveView />
      </div>
    </div>
  )
}
export default App;
