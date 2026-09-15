import { dopplerShiftHz, sonarAirGestures } from './sonarAirGestures'

const ROOT_ID = 'panacea-sonar-launcher-root'
const OVERLAY_ID = 'panacea-sonar-setup-overlay'

function onSettingsRoute() {
  return location.hash === '#/settings' || location.hash.startsWith('#/settings?')
}

function buttonStyle(button: HTMLButtonElement) {
  Object.assign(button.style, {
    position: 'fixed',
    right: '14px',
    bottom: 'calc(18px + env(safe-area-inset-bottom, 0px))',
    zIndex: '2147482998',
    minHeight: '44px',
    border: '1px solid rgba(77,231,255,.28)',
    borderRadius: '999px',
    padding: '10px 14px',
    background: 'rgba(5,10,20,.88)',
    color: '#f8fbff',
    boxShadow: '0 12px 34px rgba(0,0,0,.34), inset 0 1px rgba(255,255,255,.08)',
    backdropFilter: 'blur(18px) saturate(150%)',
    font: '700 12px/1 Montserrat,ui-sans-serif,system-ui,sans-serif',
    cursor: 'pointer',
  })
}

function createOverlay() {
  const overlay = document.createElement('div')
  overlay.id = OVERLAY_ID
  overlay.hidden = true
  Object.assign(overlay.style, {
    position: 'fixed', inset: '0', zIndex: '2147482999', display: 'grid', placeItems: 'center',
    padding: '18px', background: 'rgba(0,3,10,.68)', backdropFilter: 'blur(12px)',
  })

  const panel = document.createElement('section')
  panel.setAttribute('role', 'dialog')
  panel.setAttribute('aria-modal', 'true')
  panel.setAttribute('aria-labelledby', 'panacea-sonar-title')
  Object.assign(panel.style, {
    width: 'min(520px,100%)', maxHeight: 'min(760px,calc(100dvh - 36px))', overflow: 'auto',
    border: '1px solid rgba(119,229,255,.26)', borderRadius: '24px', padding: '20px',
    background: 'linear-gradient(145deg,rgba(8,15,29,.98),rgba(4,8,17,.98))', color: '#f8fbff',
    boxShadow: '0 28px 90px rgba(0,0,0,.58), inset 0 1px rgba(255,255,255,.08)',
    font: '500 13px/1.55 Montserrat,ui-sans-serif,system-ui,sans-serif',
  })

  panel.innerHTML = `
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px">
      <div>
        <div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#4de7ff;font-weight:800">Experimental input</div>
        <h2 id="panacea-sonar-title" style="margin:5px 0 0;font-size:21px;line-height:1.2">Touchless Air Gestures</h2>
        <p style="margin:7px 0 0;color:rgba(238,247,255,.66)">Use the laptop speaker + microphone as a local Doppler sensor for hands-free scrolling.</p>
      </div>
      <button data-sonar-close type="button" aria-label="Close Air Gestures setup" style="min-width:44px;min-height:44px;border:1px solid rgba(255,255,255,.12);border-radius:14px;background:rgba(255,255,255,.06);color:inherit;font-size:20px;cursor:pointer">×</button>
    </div>

    <div style="margin-top:16px;padding:14px;border:1px solid rgba(77,231,255,.18);border-radius:16px;background:rgba(77,231,255,.06)">
      <strong>Signal model</strong>
      <div style="margin-top:5px;color:rgba(238,247,255,.72)"><code>Δf ≈ 2vf₀/c</code>. A 0.5 m/s hand motion at 20 kHz ideally shifts the reflection by about ${dopplerShiftHz(0.5).toFixed(0)} Hz.</div>
    </div>

    <label style="display:block;margin-top:16px">
      <span style="display:flex;justify-content:space-between;gap:12px;font-weight:750"><span>Sensitivity</span><span data-sonar-sensitivity-label style="font-family:ui-monospace,monospace;color:#9ceeff">62%</span></span>
      <input data-sonar-sensitivity type="range" min="0" max="100" step="1" value="62" aria-label="Air gesture sensitivity" style="width:100%;margin-top:9px;accent-color:#4de7ff">
    </label>

    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:9px;margin-top:14px">
      <label style="display:flex;gap:10px;align-items:flex-start;padding:12px;border:1px solid rgba(255,255,255,.10);border-radius:14px;background:rgba(255,255,255,.035);cursor:pointer">
        <input data-sonar-invert type="checkbox" style="margin-top:3px;accent-color:#4de7ff">
        <span><strong style="display:block">Reverse direction</strong><span style="color:rgba(238,247,255,.58);font-size:11px">Swap approach/recede scrolling.</span></span>
      </label>
      <label style="display:flex;gap:10px;align-items:flex-start;padding:12px;border:1px solid rgba(255,255,255,.10);border-radius:14px;background:rgba(255,255,255,.035);cursor:pointer">
        <input data-sonar-double type="checkbox" checked style="margin-top:3px;accent-color:#4de7ff">
        <span><strong style="display:block">Double-air-tap reverse</strong><span style="color:rgba(238,247,255,.58);font-size:11px">Two short approach pulses toggle direction.</span></span>
      </label>
    </div>

    <div style="margin-top:16px;padding:13px;border:1px solid rgba(255,190,75,.24);border-radius:15px;background:rgba(255,190,75,.08);color:#ffe4ad">
      <strong>Before starting:</strong> this emits an 18–20 kHz near-ultrasonic tone and asks for microphone permission. Some people or animals can still hear it. Stop if it causes discomfort. Detection is experimental and must not control safety-critical clinical actions.
    </div>

    <div style="margin-top:12px;color:rgba(238,247,255,.60);font-size:11px">Microphone analysis stays in this browser session; this module does not upload microphone audio. Desktop/laptop hardware is recommended.</div>

    <div style="display:flex;gap:9px;justify-content:flex-end;margin-top:18px">
      <button data-sonar-cancel type="button" style="min-height:44px;padding:0 15px;border:1px solid rgba(255,255,255,.12);border-radius:13px;background:rgba(255,255,255,.05);color:inherit;font:inherit;font-weight:750;cursor:pointer">Cancel</button>
      <button data-sonar-start type="button" style="min-height:44px;padding:0 17px;border:0;border-radius:13px;background:linear-gradient(135deg,#4de7ff,#9c7cff);color:#07101d;font:inherit;font-weight:850;cursor:pointer">Start & calibrate</button>
    </div>
  `
  overlay.appendChild(panel)
  document.body.appendChild(overlay)
  return overlay
}

export function installSonarAirGestureBootstrap() {
  if (typeof document === 'undefined' || document.getElementById(ROOT_ID)) return

  const root = document.createElement('div')
  root.id = ROOT_ID
  const launcher = document.createElement('button')
  launcher.type = 'button'
  launcher.setAttribute('aria-label', 'Open touchless Air Gestures')
  buttonStyle(launcher)
  root.appendChild(launcher)
  document.body.appendChild(root)

  const overlay = createOverlay()
  const close = () => { overlay.hidden = true }
  const open = () => {
    const state = sonarAirGestures.getSnapshot()
    const sensitivity = overlay.querySelector<HTMLInputElement>('[data-sonar-sensitivity]')
    const sensitivityLabel = overlay.querySelector<HTMLElement>('[data-sonar-sensitivity-label]')
    const inverted = overlay.querySelector<HTMLInputElement>('[data-sonar-invert]')
    const doubleTap = overlay.querySelector<HTMLInputElement>('[data-sonar-double]')
    if (sensitivity) sensitivity.value = String(Math.round(state.sensitivity * 100))
    if (sensitivityLabel) sensitivityLabel.textContent = `${Math.round(state.sensitivity * 100)}%`
    if (inverted) inverted.checked = state.inverted
    if (doubleTap) doubleTap.checked = state.doubleTapInvert
    overlay.hidden = false
  }

  overlay.querySelector('[data-sonar-close]')?.addEventListener('click', close)
  overlay.querySelector('[data-sonar-cancel]')?.addEventListener('click', close)
  overlay.addEventListener('click', (event) => { if (event.target === overlay) close() })
  overlay.querySelector<HTMLInputElement>('[data-sonar-sensitivity]')?.addEventListener('input', (event) => {
    const value = Number((event.currentTarget as HTMLInputElement).value)
    sonarAirGestures.setSensitivity(value / 100)
    const label = overlay.querySelector<HTMLElement>('[data-sonar-sensitivity-label]')
    if (label) label.textContent = `${value}%`
  })
  overlay.querySelector<HTMLInputElement>('[data-sonar-invert]')?.addEventListener('change', (event) => {
    sonarAirGestures.setInverted((event.currentTarget as HTMLInputElement).checked)
  })
  overlay.querySelector<HTMLInputElement>('[data-sonar-double]')?.addEventListener('change', (event) => {
    sonarAirGestures.setDoubleTapInvert((event.currentTarget as HTMLInputElement).checked)
  })
  overlay.querySelector('[data-sonar-start]')?.addEventListener('click', () => {
    close()
    void sonarAirGestures.start()
  })

  launcher.addEventListener('click', () => {
    const state = sonarAirGestures.getSnapshot()
    if (state.phase === 'active' || state.phase === 'calibrating' || state.phase === 'requesting') void sonarAirGestures.stop()
    else open()
  })

  const sync = () => {
    const state = sonarAirGestures.getSnapshot()
    const running = state.phase === 'active' || state.phase === 'calibrating' || state.phase === 'requesting'
    launcher.hidden = !onSettingsRoute()
    launcher.textContent = running ? '◉ Air Gestures · ON' : '◉ Air Gestures'
    launcher.style.borderColor = running ? 'rgba(77,231,255,.72)' : 'rgba(77,231,255,.28)'
    launcher.style.boxShadow = running
      ? '0 12px 34px rgba(0,0,0,.34), 0 0 28px rgba(77,231,255,.18), inset 0 1px rgba(255,255,255,.08)'
      : '0 12px 34px rgba(0,0,0,.34), inset 0 1px rgba(255,255,255,.08)'
  }

  sonarAirGestures.subscribe(sync)
  window.addEventListener('hashchange', sync)
  sync()
}
