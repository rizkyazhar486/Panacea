import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui'

export function NotFound() {
  const nav = useNavigate()
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="animate-gradient-text bg-gradient-to-r from-brand via-emerald-500 to-brand-dark bg-clip-text text-7xl font-extrabold text-transparent">
        404
      </div>
      <h1 className="text-xl font-extrabold">Page not found</h1>
      <p className="max-w-sm text-sm text-neutral-500">
        The link you followed doesn't exist or has been moved.
      </p>
      <Button onClick={() => nav('/')}>← Back to Dashboard</Button>
    </div>
  )
}
