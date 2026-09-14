(() => {
  const ROOT_ID = 'panacea-atlas-command-v1'
  const STYLE_ID = 'panacea-atlas-command-v1-style'
  const TARGET_HASH = '#/body-explorer'
  let observer = null
  let deadline = 0

  function bodyExplorerActive() {
    return window.location.hash.startsWith(TARGET_HASH)
  }

  function findButton(label) {
    return [...document.querySelectorAll('button')].find((button) => button.textContent?.trim() === label) || null
  }

  function activatePanel(label) {
    const button = findButton(label)
    if (!button) return false
    button.click()
    button.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    return true
  }

  function activateNestedPanel(parentLabel, childLabel) {
    if (!activatePanel(parentLabel)) return false
    const until = Date.now() + 3000
    const clickChild = () => {
      const child = findButton(childLabel)
      if (!child) return false
      child.click()
      child.scrollIntoView({ block: 'nearest', inline: 'nearest' })
      return true
    }
    if (clickChild()) return true
    const nestedObserver = new MutationObserver(() => {
      if (clickChild() || Date.now() > until) nestedObserver.disconnect()
    })
    nestedObserver.observe(document.documentElement, { childList: true, subtree: true })
    window.setTimeout(() => nestedObserver.disconnect(), 3100)
    return true
  }

  function addStyles() {
    if (document.getElementById(STYLE_ID)) return
    const style = document.createElement('style')
    style.id = STYLE_ID
    style.textContent = `
      #${ROOT_ID}{position:fixed;right:max(14px,env(safe-area-inset-right));bottom:max(18px,env(safe-area-inset-bottom));z-index:2147482000;font:500 13px/1.35 Inter,system-ui,sans-serif;color:#eef7ff}
      #${ROOT_ID} *{box-sizing:border-box}
      #${ROOT_ID} .atlas-launch{display:flex;align-items:center;gap:9px;min-height:46px;border:1px solid rgba(111,240,179,.26);border-radius:999px;padding:0 15px;background:linear-gradient(135deg,rgba(3,10,18,.96),rgba(4,25,24,.94));color:#f6fffb;box-shadow:0 16px 42px rgba(0,0,0,.35),0 0 28px rgba(0,191,99,.12);backdrop-filter:blur(16px);font-weight:800;letter-spacing:.02em}
      #${ROOT_ID} .atlas-dot{width:9px;height:9px;border-radius:50%;background:#00bf63;box-shadow:0 0 16px rgba(0,191,99,.9)}
      #${ROOT_ID} .atlas-panel{width:min(356px,calc(100vw - 24px));margin-bottom:10px;border:1px solid rgba(126,169,255,.18);border-radius:24px;padding:14px;background:radial-gradient(circle at 90% 0%,rgba(49,130,255,.18),transparent 38%),radial-gradient(circle at 0% 100%,rgba(0,191,99,.14),transparent 42%),rgba(2,7,14,.96);box-shadow:0 28px 80px rgba(0,0,0,.46);backdrop-filter:blur(22px)}
      #${ROOT_ID} .atlas-panel[hidden]{display:none}
      #${ROOT_ID} .atlas-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
      #${ROOT_ID} .atlas-kicker{font-size:10px;text-transform:uppercase;letter-spacing:.16em;color:#6ff0b3;font-weight:900}
      #${ROOT_ID} h2{margin:3px 0 0;font-size:18px;line-height:1.05;color:#fff}
      #${ROOT_ID} .atlas-close{width:34px;height:34px;border:1px solid rgba(255,255,255,.12);border-radius:50%;background:rgba(255,255,255,.05);color:#fff;font-size:18px}
      #${ROOT_ID} .atlas-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:13px}
      #${ROOT_ID} .atlas-command{min-height:58px;text-align:left;border:1px solid rgba(255,255,255,.09);border-radius:15px;padding:9px 10px;background:rgba(255,255,255,.045);color:#eef7ff;font-weight:800}
      #${ROOT_ID} .atlas-command small{display:block;margin-top:3px;color:#93a9bd;font-size:10px;font-weight:600}
      #${ROOT_ID} .atlas-command:hover,#${ROOT_ID} .atlas-command:focus-visible{border-color:rgba(111,240,179,.48);background:rgba(0,191,99,.09);outline:none}
      #${ROOT_ID} .breath-note{margin-top:10px;border-left:2px solid #21d4fd;border-radius:10px;padding:9px 10px;background:rgba(33,212,253,.06);color:#bdd2e3;font-size:10.5px;line-height:1.5}
      #${ROOT_ID} .atlas-foot{margin-top:10px;color:#72879b;font-size:9.5px;line-height:1.45}
      @media(max-width:640px){#${ROOT_ID}{left:12px;right:12px;bottom:max(12px,env(safe-area-inset-bottom))}#${ROOT_ID} .atlas-panel{width:100%}#${ROOT_ID} .atlas-launch{margin-left:auto}}
      html.pmd-low-memory #${ROOT_ID} .atlas-panel,#${ROOT_ID} .atlas-launch{backdrop-filter:none}
      @media(prefers-reduced-motion:reduce){#${ROOT_ID} *{scroll-behavior:auto!important;transition:none!important;animation:none!important}}
    `
    document.head.appendChild(style)
  }

  function makeCommand(label, hint, onClick) {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'atlas-command'
    button.innerHTML = `${label}<small>${hint}</small>`
    button.addEventListener('click', onClick)
    return button
  }

  function mount() {
    if (!bodyExplorerActive() || document.getElementById(ROOT_ID)) return
    const anatomyInput = document.querySelector('input[placeholder^="Ask about anatomy"]')
    if (!anatomyInput) return

    addStyles()
    const root = document.createElement('aside')
    root.id = ROOT_ID
    root.setAttribute('aria-label', 'Body Atlas Command')

    const panel = document.createElement('section')
    panel.className = 'atlas-panel'
    panel.hidden = true
    panel.innerHTML = `
      <div class="atlas-head">
        <div><div class="atlas-kicker">Body intelligence console</div><h2>Atlas Command</h2></div>
        <button type="button" class="atlas-close" aria-label="Close Atlas Command">×</button>
      </div>
      <div class="atlas-grid"></div>
      <div class="breath-note"><strong>Breath Atlas reference.</strong> Opens Whole-body precision → Breath atlas, using Panacea's existing source-aware respiratory workspace. It does not measure a patient, infer disease, or deform source anatomy.</div>
      <div class="atlas-foot">Command-center interaction only — not AGI, diagnosis, or autonomous clinical decision-making. Panacea's existing source/provenance and safety gates remain authoritative.</div>
    `

    const grid = panel.querySelector('.atlas-grid')
    grid.append(
      makeCommand('Explore anatomy', 'systems + source geometry', () => activatePanel('Layers')),
      makeCommand('Find structure', 'named source-node index', () => activatePanel('Find structure')),
      makeCommand('Whole-body precision', 'unfold + depth workspace', () => activatePanel('Whole-body precision')),
      makeCommand('Breath Atlas', 'source-aware respiratory atlas', () => activateNestedPanel('Whole-body precision', 'Breath atlas')),
      makeCommand('Organs', 'focus existing organ atlas', () => activatePanel('Organs')),
      makeCommand('Study', 'existing education workspace', () => activatePanel('Study')),
    )

    const launch = document.createElement('button')
    launch.type = 'button'
    launch.className = 'atlas-launch'
    launch.setAttribute('aria-expanded', 'false')
    launch.innerHTML = '<span class="atlas-dot" aria-hidden="true"></span>Atlas Command <span aria-hidden="true">⌘K</span>'

    const setOpen = (open) => {
      panel.hidden = !open
      launch.setAttribute('aria-expanded', String(open))
      if (open) panel.querySelector('.atlas-command')?.focus()
    }

    launch.addEventListener('click', () => setOpen(panel.hidden))
    panel.querySelector('.atlas-close').addEventListener('click', () => setOpen(false))
    root.append(panel, launch)
    document.body.appendChild(root)
  }

  function unmount() {
    document.getElementById(ROOT_ID)?.remove()
  }

  function scan() {
    if (!bodyExplorerActive()) {
      unmount()
      observer?.disconnect()
      observer = null
      return
    }
    mount()
    if (document.getElementById(ROOT_ID)) {
      observer?.disconnect()
      observer = null
    }
  }

  function scheduleMount() {
    unmount()
    observer?.disconnect()
    observer = null
    if (!bodyExplorerActive()) return
    deadline = Date.now() + 8000
    scan()
    if (document.getElementById(ROOT_ID)) return
    observer = new MutationObserver(() => {
      scan()
      if (Date.now() > deadline) {
        observer?.disconnect()
        observer = null
      }
    })
    observer.observe(document.documentElement, { childList: true, subtree: true })
    window.setTimeout(() => {
      observer?.disconnect()
      observer = null
    }, 8100)
  }

  window.addEventListener('hashchange', scheduleMount)
  window.addEventListener('keydown', (event) => {
    if (!bodyExplorerActive() || !(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'k') return
    const root = document.getElementById(ROOT_ID)
    if (!root) return
    event.preventDefault()
    const launch = root.querySelector('.atlas-launch')
    const panel = root.querySelector('.atlas-panel')
    const open = panel.hidden
    panel.hidden = !open
    launch.setAttribute('aria-expanded', String(open))
    if (open) panel.querySelector('.atlas-command')?.focus()
  })

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scheduleMount, { once: true })
  else scheduleMount()
})()
