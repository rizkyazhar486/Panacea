import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const page = readFileSync('src/pages/Notifications.tsx', 'utf8')

// Notification filters are a single named control set and expose their selected
// state. Visual colour alone must never be the only indication of which filter
// is active.
assert.match(page, /role="group" aria-label="Notification filters"/)
assert.match(page, /aria-pressed=\{filter === item\.id\}/)
assert.match(page, /aria-label=\{\`\$\{item\.label\}: \$\{item\.count\} notifications\`\}/)

// Compact mobile controls still meet the 44 px touch-target baseline.
assert.match(page, /className=\{\`min-h-11 shrink-0 rounded-full/)
assert.match(page, /onClick=\{markAllRead\} className="min-h-11/)
assert.match(page, /onClick=\{load\} disabled=\{loading\} className="min-h-11/)

// Async refresh state is announced, errors interrupt politely, and repeated
// taps cannot start concurrent refresh requests.
assert.match(page, /aria-busy=\{loading\}/)
assert.match(page, /role="status" aria-live="polite"/)
assert.match(page, /role="alert" aria-live="assertive"/)
assert.match(page, /disabled=\{loading\}/)
assert.match(page, /loading \? 'Refreshing…' : 'Refresh'/)
assert.match(page, /loading \? 'Retrying…' : 'Try again'/)

// A routed notification's primary action is also a full-size touch target.
assert.match(page, /className="mt-3 min-h-11 rounded-xl bg-brand/)

console.log('Notification Center exposes selected filters, live refresh/error states, and 44 px mobile touch targets.')
