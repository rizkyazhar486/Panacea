(() => {
  'use strict'

  const VERSION = '44'
  const STORAGE = {
    orb: 'pmd-command-orb-v44',
    prefs: 'pmd-command-prefs-v44',
    theme: 'pmd-theme',
    motion: 'pmd-reduced-motion',
  }

  const ROUTES = {
    home: '/',
    ask: '/chatbot',
    body: '/body-explorer',
    numbers: '/tubuh',
    training: '/latihan',
    recovery: '/recovery',
    learn: '/med-study',
    scores: '/sports-scores',
    labs: '/clinical-calculators',
    drugs: '/drug-info',
    records: '/emr',
    plan: '/planning',
    social: '/community',
    stories: '/feed',
    prayer: '/prayer-times',
    sos: '/emergency',
    notifications: '/notifications',
    messages: '/messages',
    profile: '/profile',
    settings: '/settings',
    features: '/semua-fitur',
    hospitals: '/hospitals',
    daily: '/harian',
    radiology: '/radiology',
    nutrition: '/nutrition',
  }

  const ICONS = {
    home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/><path d="M9.5 20v-6h5v6"/>',
    spark: '<path d="m12 3 1.7 4.3L18 9l-4.3 1.7L12 15l-1.7-4.3L6 9l4.3-1.7L12 3Z"/><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z"/>',
    body: '<path d="M12 4a2.3 2.3 0 1 0 0-4.6A2.3 2.3 0 0 0 12 4Z" transform="translate(0 3)"/><path d="M8.5 9.5c.7-1.7 2-2.5 3.5-2.5s2.8.8 3.5 2.5L17 14l-2.2 1.2L14 21h-4l-.8-5.8L7 14l1.5-4.5Z"/>',
    activity: '<path d="M3 12h4l2-5 4 10 2-5h6"/>',
    run: '<circle cx="14.5" cy="4.5" r="1.7"/><path d="m12.5 8-3 4 3 2.2 2.2 4.8M12.5 8l4 2 2.5-1M9.5 12 6 18M12.5 14.2l4.5-.3"/>',
    moon: '<path d="M20 15.5A8 8 0 0 1 8.5 4 8.2 8.2 0 1 0 20 15.5Z"/>',
    book: '<path d="M4 5.5A3.5 3.5 0 0 1 7.5 4H11v15H7.5A3.5 3.5 0 0 0 4 20.5v-15Z"/><path d="M20 5.5A3.5 3.5 0 0 0 16.5 4H13v15h3.5a3.5 3.5 0 0 1 3.5 1.5v-15Z"/>',
    flame: '<path d="M12 22c4 0 7-2.7 7-6.6 0-3-1.6-5.2-4.7-8.4.2 3-1.4 4-2.2 4.5.2-3.4-1.7-6.2-4-8.5.2 4-3.1 6.7-3.1 11.2C5 18.7 8 22 12 22Z"/><path d="M12 19c1.8 0 3-1.1 3-2.8 0-1.2-.7-2.3-2-3.6 0 1.2-.7 1.8-1.4 2.2-.1-1.3-.8-2.4-1.7-3.4.1 1.7-1.4 2.8-1.4 4.6 0 1.8 1.4 3 3.5 3Z"/>',
    calculator: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h2m4 0h2M8 15h2m4 0h2M8 19h2m4 0h2"/>',
    pill: '<path d="m8.2 18.8-3-3a4.2 4.2 0 0 1 0-6l4.6-4.6a4.2 4.2 0 1 1 6 6l-4.6 4.6a4.2 4.2 0 0 1-6 0"/><path d="m8.2 8.2 7.6 7.6"/>',
    record: '<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v5h5M10 12h5M10 16h5"/>',
    calendar: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4m8-4v4M4 10h16M8 14h3m2 0h3"/>',
    users: '<circle cx="9" cy="8" r="3"/><path d="M3.5 20c.4-4 2.4-6 5.5-6s5.1 2 5.5 6M16 7a2.5 2.5 0 0 1 0 5M16.5 15c2.5.3 3.9 2 4 5"/>',
    stories: '<rect x="3" y="4" width="18" height="16" rx="5"/><path d="m10 9 5 3-5 3V9Z"/>',
    prayer: '<path d="M19 15.5A7.5 7.5 0 0 1 8.5 5 7.7 7.7 0 1 0 19 15.5Z"/><path d="m17 4 .7 1.7L19.5 6l-1.8.7L17 8.5l-.7-1.8L14.5 6l1.8-.3L17 4Z"/>',
    sos: '<circle cx="12" cy="12" r="9"/><path d="M12 7v10M7 12h10"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 5 5"/>',
    bell: '<path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z"/><path d="M9.7 21h4.6"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 21c.6-5 3.1-7 7.5-7s6.9 2 7.5 7"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/>',
    message: '<path d="M4 5h16v12H8l-4 4V5Z"/><path d="M8 10h8M8 13h5"/>',
    support: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.7 2.7 0 1 1 3.9 2.4c-.9.5-1.4 1-1.4 2.1M12 17.3v.1"/>',
    theme: '<circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16V4Z"/>',
    grid: '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    back: '<path d="m15 18-6-6 6-6"/>',
    accessibility: '<circle cx="12" cy="4" r="2"/><path d="M5 8h14M12 8v5m0 0-4 8m4-8 4 8"/>',
  }

  function icon(name, size = 20) {
    return `<svg aria-hidden="true" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ICONS.grid}</svg>`
  }

  const RAIL = [
    ['Home', 'home', ROUTES.home], ['Ask AI', 'spark', ROUTES.ask], ['Body', 'body', ROUTES.body],
    ['Numbers', 'activity', ROUTES.numbers], ['Training', 'run', ROUTES.training], ['Recovery', 'moon', ROUTES.recovery],
    ['Learn', 'book', ROUTES.learn], ['Scores', 'flame', ROUTES.scores], ['Labs', 'calculator', ROUTES.labs],
    ['Drugs', 'pill', ROUTES.drugs], ['Records', 'record', ROUTES.records], ['Plan', 'calendar', ROUTES.plan],
    ['Social', 'users', ROUTES.social], ['Stories', 'stories', ROUTES.stories], ['Prayer', 'prayer', ROUTES.prayer], ['SOS', 'sos', ROUTES.sos],
  ]

  const ACTIONS = {
    menu: { label: 'Command', icon: 'grid', fn: () => toggleCommand(true) },
    ask: { label: 'Ask AI', icon: 'spark', route: ROUTES.ask },
    search: { label: 'Search', icon: 'search', fn: () => window.dispatchEvent(new Event('panacea:cari')) },
    log: { label: 'Log today', icon: 'plus', route: ROUTES.daily }, home: { label: 'Home', icon: 'home', route: ROUTES.home },
    back: { label: 'Back', icon: 'back', fn: () => history.back() }, body: { label: 'Body', icon: 'body', route: ROUTES.body },
    numbers: { label: 'Numbers', icon: 'activity', route: ROUTES.numbers }, training: { label: 'Training', icon: 'run', route: ROUTES.training },
    recovery: { label: 'Recovery', icon: 'moon', route: ROUTES.recovery }, learn: { label: 'Learn', icon: 'book', route: ROUTES.learn },
    labs: { label: 'Labs', icon: 'calculator', route: ROUTES.labs }, drugs: { label: 'Drugs', icon: 'pill', route: ROUTES.drugs },
    plan: { label: 'Plan', icon: 'calendar', route: ROUTES.plan }, social: { label: 'Social', icon: 'users', route: ROUTES.social },
    stories: { label: 'Stories', icon: 'stories', route: ROUTES.stories }, messages: { label: 'Messages', icon: 'message', route: ROUTES.messages },
    notifications: { label: 'Alerts', icon: 'bell', route: ROUTES.notifications }, profile: { label: 'Profile', icon: 'user', route: ROUTES.profile },
    settings: { label: 'Settings', icon: 'settings', route: ROUTES.settings }, features: { label: 'All features', icon: 'grid', route: ROUTES.features },
    theme: { label: 'Theme', icon: 'theme', fn: () => cycleTheme() }, support: { label: 'Support', icon: 'support', fn: () => openSupport() },
    sos: { label: 'SOS', icon: 'sos', route: ROUTES.sos }, hospitals: { label: 'Hospital', icon: 'sos', route: ROUTES.hospitals },
    customize: { label: 'Customize', icon: 'settings', fn: () => openCustomizer() },
  }

  const DEFAULT_PREFS = {
    menuSlots: ['ask', 'search', 'log', 'body', 'numbers', 'training', 'labs', 'plan', 'messages', 'social', 'sos', 'settings'],
    singleTap: 'menu', doubleTap: 'ask', longPress: 'customize', swipeUp: 'search', swipeDown: 'home', swipeLeft: 'back', swipeRight: 'messages',
    size: 60, idleOpacity: 0.46, snap: true, haptics: true,
  }

  let prefs = loadPrefs(), orbPos = loadOrbPos(), chrome = null, commandPanel = null, accountSheet = null, customizer = null, supportSheet = null, orb = null
  let observer = null, scheduled = false, tapTimer = null, lastTapAt = 0, idleTimer = null, pointer = null, longTimer = null, longFired = false

  function loadPrefs() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE.prefs) || 'null')
      if (!raw || typeof raw !== 'object') return { ...DEFAULT_PREFS }
      const next = { ...DEFAULT_PREFS, ...raw }
      next.menuSlots = Array.isArray(raw.menuSlots) ? raw.menuSlots.filter((id) => ACTIONS[id] && !['menu', 'customize'].includes(id)).slice(0, 12) : [...DEFAULT_PREFS.menuSlots]
      if (next.menuSlots.length < 4) next.menuSlots = [...DEFAULT_PREFS.menuSlots]
      next.size = clamp(Number(next.size) || 60, 48, 76); next.idleOpacity = clamp(Number(next.idleOpacity) || .46, .28, 1)
      return next
    } catch { return { ...DEFAULT_PREFS } }
  }
  function savePrefs() { try { localStorage.setItem(STORAGE.prefs, JSON.stringify(prefs)) } catch {} applyOrbPrefs() }
  function loadOrbPos() { try { const raw = JSON.parse(localStorage.getItem(STORAGE.orb) || 'null'); if (Number.isFinite(raw?.x) && Number.isFinite(raw?.y)) return { x: raw.x, y: raw.y } } catch {} return null }
  function saveOrbPos() { try { localStorage.setItem(STORAGE.orb, JSON.stringify(orbPos)) } catch {} }
  function clamp(v, min, max) { return Math.min(Math.max(v, min), max) }
  function currentPath() { return (location.hash.replace(/^#/, '') || '/').split('?')[0] }
  function go(route) { if (route && location.hash !== `#${route}`) location.hash = `#${route}` }
  function vibrate(ms = 9) { if (prefs.haptics && navigator.vibrate) try { navigator.vibrate(ms) } catch {} }

  function applyTheme(pref) {
    const mode = pref || localStorage.getItem(STORAGE.theme) || 'system'
    try { localStorage.setItem(STORAGE.theme, mode) } catch {}
    const dark = mode === 'dark' || (mode === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.classList.toggle('dark', dark); document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
    document.querySelectorAll('[data-pmd-theme-choice]').forEach((el) => el.setAttribute('aria-pressed', String(el.getAttribute('data-pmd-theme-choice') === mode)))
  }
  function cycleTheme() { const mode = localStorage.getItem(STORAGE.theme) || 'system'; applyTheme(mode === 'system' ? 'dark' : mode === 'dark' ? 'light' : 'system'); vibrate() }
  function runAction(id) { const action = ACTIONS[id]; if (!action) return; vibrate(); toggleCommand(false); if (action.route) go(action.route); else action.fn?.() }

  function routeTitle() {
    const legacyTitle = document.querySelector('[data-pmd-legacy-header="true"] h1')?.textContent?.trim()
    if (legacyTitle) return legacyTitle
    const hit = RAIL.find(([, , route]) => route === currentPath()); return hit?.[0] || 'Panaceamed'
  }
  function setActiveRail() {
    if (!chrome) return
    const path = currentPath(); chrome.querySelectorAll('[data-pmd-route]').forEach((el) => el.setAttribute('aria-current', el.getAttribute('data-pmd-route') === path ? 'page' : 'false'))
    const title = chrome.querySelector('.pmd-command-title'); if (title) title.textContent = routeTitle()
    const context = commandPanel?.querySelector('.pmd-command-context'); if (context) context.textContent = routeTitle(); renderContextActions()
  }

  function annotateLegacy() {
    const legacy = Array.from(document.querySelectorAll('#root header')).find((el) => el.classList.contains('kaca') && el.querySelector('h1'))
    if (legacy) legacy.setAttribute('data-pmd-legacy-header', 'true')
    const shell = legacy?.closest('.relative.flex.min-h-screen') || document.querySelector('#root > .relative.flex.min-h-screen')
    if (shell) Array.from(shell.children).forEach((child) => { if (child.tagName === 'ASIDE') child.setAttribute('data-pmd-legacy-sidebar', 'true') })
    const legacyFab = Array.from(document.querySelectorAll('button')).find((el) => /menu navigasi|Tutup menu/i.test(el.getAttribute('aria-label') || ''))
    const host = legacyFab?.closest('.fixed.z-50') || legacyFab?.parentElement; if (host instanceof HTMLElement) host.setAttribute('data-pmd-legacy-fab', 'true')
    document.querySelectorAll('[data-pintasan]').forEach((el) => el.setAttribute('data-pmd-legacy-quick', 'true'))
  }

  function railMarkup() { return RAIL.map(([label, iconName, route]) => `<button class="pmd-rail-item" type="button" data-pmd-route="${route}" aria-label="${label}"><span class="pmd-rail-icon">${icon(iconName, 18)}</span><span>${label}</span></button>`).join('') }
  function ensureChrome() {
    if (document.getElementById('pmd-command-chrome')) { chrome = document.getElementById('pmd-command-chrome'); return }
    const main = document.querySelector('#root main'), parent = main?.parentElement; if (!parent) return
    chrome = document.createElement('div'); chrome.id = 'pmd-command-chrome'
    chrome.innerHTML = `<header class="pmd-command-head" aria-label="Panacea command header"><div class="pmd-command-brandline"><img class="pmd-command-mini-logo" src="/logo-mark.png" alt="" width="30" height="30" /><h1 class="pmd-command-title">${routeTitle()}</h1></div><div class="pmd-command-actions" aria-label="Quick actions"><button type="button" class="pmd-head-action pmd-head-log" data-pmd-action="log" aria-label="Log today">${icon('plus', 20)}</button><button type="button" class="pmd-head-action" data-pmd-action="search" aria-label="Search">${icon('search', 21)}</button><button type="button" class="pmd-head-action" data-pmd-action="notifications" aria-label="Notifications">${icon('bell', 21)}<i class="pmd-alert-dot" aria-hidden="true"></i></button><button type="button" class="pmd-head-action pmd-account-trigger" data-pmd-account aria-label="Account command center">${icon('user', 22)}<i class="pmd-account-dot" aria-hidden="true"></i></button></div></header><nav class="pmd-super-rail" aria-label="Panacea super navigation">${railMarkup()}</nav>`
    parent.prepend(chrome)
    chrome.addEventListener('click', (event) => { const target = event.target.closest('[data-pmd-route],[data-pmd-action],[data-pmd-account]'); if (!target) return; if (target.hasAttribute('data-pmd-route')) go(target.getAttribute('data-pmd-route')); else if (target.hasAttribute('data-pmd-account')) openAccount(); else runAction(target.getAttribute('data-pmd-action')) })
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => document.documentElement.style.setProperty('--tinggi-bilah-atas', `${Math.ceil(chrome.getBoundingClientRect().height)}px`)) : null
    ro?.observe(chrome); document.documentElement.style.setProperty('--tinggi-bilah-atas', `${Math.ceil(chrome.getBoundingClientRect().height)}px`); setActiveRail()
  }

  function accountAction(label, iconName, action, tone = '') { return `<button type="button" class="pmd-hub-action ${tone}" data-pmd-account-action="${action}">${icon(iconName, 21)}<span>${label}</span></button>` }
  function ensureAccountSheet() {
    if (accountSheet) return accountSheet
    accountSheet = document.createElement('div'); accountSheet.id = 'pmd-account-sheet'; accountSheet.className = 'pmd-sheet-backdrop'; accountSheet.hidden = true
    accountSheet.innerHTML = `<section class="pmd-sheet pmd-account-sheet" role="dialog" aria-modal="true" aria-label="Account command center"><div class="pmd-sheet-grabber" aria-hidden="true"></div><div class="pmd-sheet-head"><div><strong>Account Hub</strong><span>Profile · context · system</span></div><button type="button" data-pmd-close aria-label="Close">×</button></div><div class="pmd-hub-grid">${accountAction('Profile','user','profile')}${accountAction('Settings','settings','settings')}${accountAction('Messages','message','messages')}${accountAction('Social','users','social')}${accountAction('Support','support','support')}${accountAction('Features','grid','features')}${accountAction('Alerts','bell','notifications')}${accountAction('SOS','sos','sos','pmd-danger')}${accountAction('Assistive','accessibility','customize')}</div><div class="pmd-theme-row" aria-label="Theme mode"><span>Theme</span><div class="pmd-segmented"><button type="button" data-pmd-theme-choice="system">System</button><button type="button" data-pmd-theme-choice="light">Light</button><button type="button" data-pmd-theme-choice="dark">Dark</button></div></div><button type="button" class="pmd-logout" data-pmd-logout>${icon('back',18)}<span>Log out</span></button></section>`
    document.body.appendChild(accountSheet)
    accountSheet.addEventListener('click', (event) => {
      if (event.target === accountSheet || event.target.closest('[data-pmd-close]')) return closeAccount()
      const theme = event.target.closest('[data-pmd-theme-choice]'); if (theme) return applyTheme(theme.getAttribute('data-pmd-theme-choice'))
      const action = event.target.closest('[data-pmd-account-action]')?.getAttribute('data-pmd-account-action'); if (action) { closeAccount(); runAction(action); return }
      if (event.target.closest('[data-pmd-logout]')) { const legacy = Array.from(document.querySelectorAll('#root button')).find((b) => b.getAttribute('aria-label') === 'Log Out' || b.textContent?.trim() === 'Log Out'); if (legacy) legacy.click() }
    })
    return accountSheet
  }
  function openAccount() { const sheet = ensureAccountSheet(); sheet.hidden = false; requestAnimationFrame(() => sheet.classList.add('is-open')); applyTheme(localStorage.getItem(STORAGE.theme) || 'system'); vibrate() }
  function closeAccount() { if (!accountSheet) return; accountSheet.classList.remove('is-open'); setTimeout(() => { if (accountSheet) accountSheet.hidden = true }, 180) }

  function ensureSupportSheet() {
    if (supportSheet) return supportSheet
    supportSheet = document.createElement('div'); supportSheet.id = 'pmd-support-sheet'; supportSheet.className = 'pmd-sheet-backdrop'; supportSheet.hidden = true
    supportSheet.innerHTML = `<section class="pmd-sheet pmd-mini-sheet" role="dialog" aria-modal="true" aria-label="Help and support"><div class="pmd-sheet-grabber" aria-hidden="true"></div><div class="pmd-sheet-head"><div><strong>Help & Support</strong><span>Choose the fastest path</span></div><button type="button" data-pmd-close aria-label="Close">×</button></div><div class="pmd-hub-grid pmd-hub-grid-2">${accountAction('Messages','message','messages')}${accountAction('Hospital','sos','hospitals')}${accountAction('Settings','settings','settings')}${accountAction('Emergency','sos','sos','pmd-danger')}</div></section>`
    document.body.appendChild(supportSheet)
    supportSheet.addEventListener('click', (event) => { if (event.target === supportSheet || event.target.closest('[data-pmd-close]')) return closeSupport(); const action = event.target.closest('[data-pmd-account-action]')?.getAttribute('data-pmd-account-action'); if (action) { closeSupport(); runAction(action) } })
    return supportSheet
  }
  function openSupport() { const sheet = ensureSupportSheet(); sheet.hidden = false; requestAnimationFrame(() => sheet.classList.add('is-open')) }
  function closeSupport() { if (!supportSheet) return; supportSheet.classList.remove('is-open'); setTimeout(() => { if (supportSheet) supportSheet.hidden = true }, 180) }

  function contextActions() { const path = currentPath(); if (path.startsWith('/body-explorer')) return ['numbers','labs','drugs']; if (path.startsWith('/med-study') || path.startsWith('/learn')) return ['search','labs','drugs']; if (path.startsWith('/latihan')) return ['numbers','recovery','plan']; if (path.startsWith('/community') || path.startsWith('/feed')) return ['messages','stories','profile']; return ['ask','log','numbers'] }
  function renderContextActions() { const host = commandPanel?.querySelector('.pmd-command-context-actions'); if (!host) return; host.innerHTML = contextActions().map((id) => { const a = ACTIONS[id]; return `<button type="button" data-pmd-command-action="${id}">${icon(a.icon,16)}<span>${a.label}</span></button>` }).join('') }

  function ensureCommandPanel() {
    if (commandPanel) return commandPanel
    commandPanel = document.createElement('section'); commandPanel.id = 'pmd-command-panel'; commandPanel.setAttribute('role','dialog'); commandPanel.setAttribute('aria-modal','false'); commandPanel.setAttribute('aria-label','Panacea command center'); commandPanel.hidden = true
    commandPanel.innerHTML = `<div class="pmd-command-panel-head"><div><span class="pmd-command-kicker">PANACEA COMMAND</span><strong class="pmd-command-context">${routeTitle()}</strong></div><button type="button" data-pmd-command-customize aria-label="Customize assistive button">${icon('settings',18)}</button></div><div class="pmd-command-context-actions"></div><div class="pmd-command-grid"></div><div class="pmd-command-foot"><span>Swipe orb · double tap · long press</span><button type="button" data-pmd-command-customize>Customize</button></div>`
    document.body.appendChild(commandPanel)
    commandPanel.addEventListener('click', (event) => { const action = event.target.closest('[data-pmd-command-action]')?.getAttribute('data-pmd-command-action'); if (action) runAction(action); if (event.target.closest('[data-pmd-command-customize]')) { toggleCommand(false); openCustomizer() } })
    renderCommandGrid(); renderContextActions(); return commandPanel
  }
  function renderCommandGrid() {
    if (!commandPanel) return; const grid = commandPanel.querySelector('.pmd-command-grid'); if (!grid) return
    grid.innerHTML = prefs.menuSlots.map((id,index) => { const a = ACTIONS[id]; if (!a) return ''; return `<button type="button" class="pmd-command-tile${index===0?' pmd-command-primary':''}${id==='sos'?' pmd-command-danger':''}" data-pmd-command-action="${id}"><span>${icon(a.icon,20)}</span><b>${a.label}</b></button>` }).join('')
  }
  function positionCommandPanel() {
    if (!commandPanel || !orb) return; const rect = orb.getBoundingClientRect(), vw = innerWidth, vh = innerHeight, width = Math.min(334, vw-20), height = Math.min(438, vh-120)
    commandPanel.style.width = `${width}px`; commandPanel.style.maxHeight = `${height}px`; let left = clamp(rect.left+rect.width/2-width/2,10,vw-width-10); let top = rect.top>vh/2 ? rect.top-height-12 : rect.bottom+12; top = clamp(top,10,vh-height-10); commandPanel.style.left=`${left}px`; commandPanel.style.top=`${top}px`
  }
  function toggleCommand(force) {
    const panel = ensureCommandPanel(), next = typeof force === 'boolean' ? force : panel.hidden
    if (next) { renderCommandGrid(); renderContextActions(); setActiveRail(); positionCommandPanel(); panel.hidden=false; requestAnimationFrame(()=>panel.classList.add('is-open')); orb?.setAttribute('aria-expanded','true') }
    else { panel.classList.remove('is-open'); orb?.setAttribute('aria-expanded','false'); setTimeout(()=>{ if(commandPanel&&!commandPanel.classList.contains('is-open')) commandPanel.hidden=true },150) }
  }

  function actionOptions(selected) { const ids=['menu','ask','search','log','home','back','body','numbers','training','recovery','learn','labs','drugs','plan','social','stories','messages','notifications','profile','settings','features','theme','support','sos','customize']; return ids.map((id)=>`<option value="${id}" ${id===selected?'selected':''}>${ACTIONS[id].label}</option>`).join('') }
  function mappingRow(label,key) { return `<label><span>${label}</span><select data-pmd-pref="${key}">${actionOptions(prefs[key])}</select></label>` }
  function ensureCustomizer() {
    if (customizer) return customizer
    customizer=document.createElement('div'); customizer.id='pmd-command-customizer'; customizer.className='pmd-sheet-backdrop'; customizer.hidden=true; document.body.appendChild(customizer)
    customizer.addEventListener('click',(event)=>{ if(event.target===customizer||event.target.closest('[data-pmd-close]')) closeCustomizer(); const reset=event.target.closest('[data-pmd-reset]'); if(reset){ prefs={...DEFAULT_PREFS,menuSlots:[...DEFAULT_PREFS.menuSlots]}; savePrefs(); renderCustomizer(); renderCommandGrid() } const slot=event.target.closest('[data-pmd-slot]'); if(slot){ const id=slot.getAttribute('data-pmd-slot'), active=prefs.menuSlots.includes(id); if(active) prefs.menuSlots=prefs.menuSlots.filter((x)=>x!==id); else if(prefs.menuSlots.length<12) prefs.menuSlots=[...prefs.menuSlots,id]; savePrefs(); renderCustomizer(); renderCommandGrid() } })
    customizer.addEventListener('change',(event)=>{ const el=event.target; if(!(el instanceof HTMLInputElement||el instanceof HTMLSelectElement)) return; const key=el.getAttribute('data-pmd-pref'); if(!key) return; if(el.type==='checkbox') prefs[key]=el.checked; else if(el.type==='range') prefs[key]=Number(el.value); else prefs[key]=el.value; savePrefs(); renderCommandGrid(); const value=customizer.querySelector(`[data-pmd-value-for="${key}"]`); if(value) value.textContent=key==='idleOpacity'?`${Math.round(prefs[key]*100)}%`:`${prefs[key]}px` })
    return customizer
  }
  function renderCustomizer() {
    const sheet=ensureCustomizer(), slotIds=['ask','search','log','body','numbers','training','recovery','learn','labs','drugs','plan','social','stories','messages','notifications','profile','settings','features','theme','support','sos']
    sheet.innerHTML=`<section class="pmd-sheet pmd-customizer-sheet" role="dialog" aria-modal="true" aria-label="Customize Panacea Assistive Touch"><div class="pmd-sheet-grabber" aria-hidden="true"></div><div class="pmd-sheet-head"><div><strong>Panacea Assistive Touch</strong><span>${prefs.menuSlots.length}/12 menu actions</span></div><button type="button" data-pmd-close aria-label="Close">×</button></div><div class="pmd-custom-scroll"><div class="pmd-setting-title">Custom actions</div><div class="pmd-action-mapping">${mappingRow('Single tap','singleTap')}${mappingRow('Double tap','doubleTap')}${mappingRow('Long press','longPress')}${mappingRow('Swipe up','swipeUp')}${mappingRow('Swipe down','swipeDown')}${mappingRow('Swipe left','swipeLeft')}${mappingRow('Swipe right','swipeRight')}</div><div class="pmd-setting-title">Command menu</div><div class="pmd-slot-grid">${slotIds.map((id)=>{const a=ACTIONS[id],on=prefs.menuSlots.includes(id);return `<button type="button" data-pmd-slot="${id}" aria-pressed="${on}">${icon(a.icon,18)}<span>${a.label}</span><i>${on?'✓':'+'}</i></button>`}).join('')}</div><div class="pmd-setting-title">Appearance & behavior</div><label class="pmd-slider-row"><span>Size <b data-pmd-value-for="size">${prefs.size}px</b></span><input type="range" min="48" max="76" step="2" value="${prefs.size}" data-pmd-pref="size" /></label><label class="pmd-slider-row"><span>Idle opacity <b data-pmd-value-for="idleOpacity">${Math.round(prefs.idleOpacity*100)}%</b></span><input type="range" min="0.28" max="1" step="0.04" value="${prefs.idleOpacity}" data-pmd-pref="idleOpacity" /></label><label class="pmd-switch-row"><span>Snap to edge</span><input type="checkbox" ${prefs.snap?'checked':''} data-pmd-pref="snap" /></label><label class="pmd-switch-row"><span>Haptic feedback</span><input type="checkbox" ${prefs.haptics?'checked':''} data-pmd-pref="haptics" /></label></div><div class="pmd-sheet-footer"><button type="button" data-pmd-reset>Restore defaults</button><button type="button" data-pmd-close class="pmd-done">Done</button></div></section>`
  }
  function openCustomizer(){const sheet=ensureCustomizer();renderCustomizer();sheet.hidden=false;requestAnimationFrame(()=>sheet.classList.add('is-open'));vibrate()}
  function closeCustomizer(){if(!customizer)return;customizer.classList.remove('is-open');setTimeout(()=>{if(customizer)customizer.hidden=true},180)}

  function constrainOrb(pos){const s=prefs.size;return{x:clamp(pos.x,10,Math.max(10,innerWidth-s-10)),y:clamp(pos.y,82,Math.max(82,innerHeight-s-12))}}
  function defaultOrbPos(){return constrainOrb({x:innerWidth-prefs.size-14,y:innerHeight*.7})}
  function placeOrb(){if(!orb)return;if(!orbPos)orbPos=defaultOrbPos();orbPos=constrainOrb(orbPos);orb.style.left=`${orbPos.x}px`;orb.style.top=`${orbPos.y}px`;positionCommandPanel()}
  function setOrbIdle(idle){if(orb)orb.style.opacity=String(idle?prefs.idleOpacity:1)}
  function wakeOrb(){setOrbIdle(false);clearTimeout(idleTimer);idleTimer=setTimeout(()=>setOrbIdle(true),2600)}
  function applyOrbPrefs(){if(!orb)return;orb.style.width=`${prefs.size}px`;orb.style.height=`${prefs.size}px`;placeOrb();wakeOrb()}
  function ensureOrb(){
    if(orb)return orb;orb=document.createElement('button');orb.id='pmd-panacea-orb';orb.type='button';orb.setAttribute('aria-label','Panacea Assistive Touch');orb.setAttribute('aria-haspopup','dialog');orb.setAttribute('aria-expanded','false');orb.innerHTML='<img src="/logo-mark.png" alt="" draggable="false" /><span class="pmd-orb-pulse" aria-hidden="true"></span>';document.body.appendChild(orb);applyOrbPrefs();orb.addEventListener('pointerdown',onOrbDown);orb.addEventListener('pointermove',onOrbMove);orb.addEventListener('pointerup',onOrbUp);orb.addEventListener('pointercancel',onOrbUp);orb.addEventListener('contextmenu',(e)=>e.preventDefault());orb.addEventListener('focus',wakeOrb);return orb
  }
  function onOrbDown(event){event.preventDefault();wakeOrb();longFired=false;pointer={id:event.pointerId,startX:event.clientX,startY:event.clientY,x:event.clientX,y:event.clientY,started:performance.now(),orbX:orbPos?.x||0,orbY:orbPos?.y||0,dragging:false};orb.setPointerCapture?.(event.pointerId);clearTimeout(longTimer);longTimer=setTimeout(()=>{if(!pointer||pointer.dragging)return;longFired=true;runAction(prefs.longPress)},650)}
  function onOrbMove(event){if(!pointer||event.pointerId!==pointer.id)return;pointer.x=event.clientX;pointer.y=event.clientY;const dx=pointer.x-pointer.startX,dy=pointer.y-pointer.startY,distance=Math.hypot(dx,dy),elapsed=performance.now()-pointer.started;if(distance>10)clearTimeout(longTimer);if(elapsed>220&&distance>10){pointer.dragging=true;orbPos=constrainOrb({x:pointer.orbX+dx,y:pointer.orbY+dy});placeOrb()}}
  function onOrbUp(event){
    if(!pointer||event.pointerId!==pointer.id)return;clearTimeout(longTimer);const p=pointer;pointer=null;orb.releasePointerCapture?.(event.pointerId);if(longFired)return;const dx=event.clientX-p.startX,dy=event.clientY-p.startY,distance=Math.hypot(dx,dy),elapsed=performance.now()-p.started
    if(p.dragging){if(prefs.snap){const left=10,right=innerWidth-prefs.size-10;orbPos.x=orbPos.x+prefs.size/2<innerWidth/2?left:right}orbPos=constrainOrb(orbPos);saveOrbPos();placeOrb();wakeOrb();return}
    if(distance>38&&elapsed<420){const horizontal=Math.abs(dx)>Math.abs(dy);runAction(horizontal?(dx>0?prefs.swipeRight:prefs.swipeLeft):(dy>0?prefs.swipeDown:prefs.swipeUp));return}
    if(distance>10)return;const now=Date.now();if(now-lastTapAt<280){clearTimeout(tapTimer);tapTimer=null;lastTapAt=0;runAction(prefs.doubleTap)}else{lastTapAt=now;clearTimeout(tapTimer);tapTimer=setTimeout(()=>{lastTapAt=0;runAction(prefs.singleTap)},250)}
  }

  function onKey(event){if(event.key==='Escape'){toggleCommand(false);closeAccount();closeCustomizer();closeSupport()}if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='j'){event.preventDefault();toggleCommand()}}
  function install(){
    annotateLegacy();const inApp=Boolean(document.querySelector('[data-pmd-legacy-header="true"]'));if(!inApp){if(chrome)chrome.hidden=true;if(orb)orb.hidden=true;toggleCommand(false);closeAccount();closeCustomizer();closeSupport();return}
    ensureChrome();ensureOrb();if(chrome)chrome.hidden=false;if(orb)orb.hidden=false;setActiveRail()
  }
  function scheduleInstall(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;install()})}
  function boot(){
    install();observer=new MutationObserver(scheduleInstall);observer.observe(document.getElementById('root')||document.body,{childList:true,subtree:true});addEventListener('hashchange',()=>{toggleCommand(false);closeAccount();scheduleInstall();setActiveRail()});addEventListener('resize',()=>{placeOrb();positionCommandPanel()},{passive:true});addEventListener('orientationchange',()=>setTimeout(()=>{placeOrb();positionCommandPanel()},120));addEventListener('keydown',onKey);matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change',()=>{if((localStorage.getItem(STORAGE.theme)||'system')==='system')applyTheme('system')});applyTheme(localStorage.getItem(STORAGE.theme)||'system');document.documentElement.setAttribute('data-pmd-command-ui',VERSION)
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot()
})()
