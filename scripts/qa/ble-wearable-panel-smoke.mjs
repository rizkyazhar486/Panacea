// The Bluetooth heart-rate panel (src/domains/devices/ui/BluetoothWearablePanel.tsx) in a real browser, against a fake
// of the Web Bluetooth API that speaks the standard Heart Rate service byte for byte, under a controlled clock:
// connect, live reading, a 5-minute HRV recording, saving once, interruptions, refusals and the platforms without
// Web Bluetooth. RR intervals are whole wire units (1/1024 s): 1014 and 1034 alternate, so successive differences are
// 20 units = 19.53125 ms and RMSSD is exactly 19.53125 ms. All values are synthetic.
import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { build } from 'esbuild'
const pw = await import(process.env.PLAYWRIGHT_MODULE || '@playwright/test')
const chromium = pw.chromium ?? pw.default.chromium

const panel = resolve('src/domains/devices/ui/BluetoothWearablePanel.tsx')
const bundle = await build({
  stdin: {
    resolveDir: process.cwd(), loader: 'tsx', contents: `
import React from 'react'
import { createRoot } from 'react-dom/client'
import { BluetoothWearablePanel } from ${JSON.stringify(panel)}
window.__saved = []
const onSave = async (patch) => { if (window.__failSave) throw new Error('offline'); window.__saved.push(patch) }
createRoot(document.getElementById('root')).render(React.createElement(BluetoothWearablePanel, { onSave, previousRmssd: window.__previous || [] }))
` },
  bundle: true, write: false, format: 'iife', platform: 'browser', jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"production"' }, logLevel: 'silent',
})
const code = bundle.outputFiles[0].text
const html = `<!doctype html><html><body><div id="root"></div><script>${code.replace(/<\/script/g, '<\\/script')}</script></body></html>`

// Installed before the page's own scripts. `cfg` decides how the fake device behaves.
function fakeBluetooth(cfg) {
  if (cfg.noBluetooth) { Object.defineProperty(navigator, 'bluetooth', { value: undefined, configurable: true }); return }
  const dv = (bytes) => new DataView(Uint8Array.from(bytes).buffer)
  const text = (s) => new DataView(new TextEncoder().encode(s).buffer)
  const state = window.__ble = { contact: 0x06, sendRR: cfg.sendRR !== false, bpm: 60, beat: 0, disconnects: 0 }
  const characteristic = (initial) => Object.assign(new EventTarget(), {
    value: null, async readValue() { return initial }, async startNotifications() {},
  })
  const measurement = characteristic(null)
  const battery = characteristic(dv([80]))
  const device = Object.assign(new EventTarget(), {
    name: 'Strap One',
    gatt: {
      async connect() { return this },
      disconnect() { state.disconnects += 1; device.dispatchEvent(new Event('gattserverdisconnected')) },
      async getPrimaryService(name) {
        const chars = {
          heart_rate: { heart_rate_measurement: measurement, body_sensor_location: characteristic(dv([1])) },
          device_information: { manufacturer_name_string: characteristic(text('Acme')), model_number_string: characteristic(text('Strap One')) },
          battery_service: { battery_level: battery },
        }[name]
        if (!chars) throw Object.assign(new Error('no service'), { name: 'NotFoundError' })
        return { async getCharacteristic(c) { if (!chars[c]) throw Object.assign(new Error('no char'), { name: 'NotFoundError' }); return chars[c] } }
      },
    },
  })
  setInterval(() => {
    const rr = state.beat % 2 === 0 ? 1014 : 1034
    state.beat += 1
    const flags = state.contact | (state.sendRR ? 0x10 : 0)
    measurement.value = dv(state.sendRR ? [flags, state.bpm, rr & 0xff, rr >> 8] : [flags, state.bpm])
    measurement.dispatchEvent(new Event('characteristicvaluechanged'))
  }, 1000)
  Object.defineProperty(navigator, 'bluetooth', {
    configurable: true,
    value: {
      async requestDevice(options) {
        window.__request = options
        if (cfg.refuse) throw Object.assign(new Error(cfg.refuse), { name: cfg.refuse })
        return device
      },
    },
  })
}

const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) })
async function open(cfg = {}, { userAgent } = {}) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, ...(userAgent ? { userAgent } : {}) })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.clock.install({ time: new Date('2026-11-16T07:00:00Z') })
  await page.addInitScript(fakeBluetooth, cfg)
  // http://localhost is a secure context, as Web Bluetooth requires.
  await page.route('http://localhost/', (route) => route.fulfill({ contentType: 'text/html', body: html }))
  await page.goto('http://localhost/')
  return { page, context, errors }
}
async function until(page, fn, what, ms = 5000) {
  const end = Date.now() + ms
  for (;;) {
    if (await page.evaluate(fn)) return
    if (Date.now() > end) throw new Error(`timed out waiting for ${what}`)
    await new Promise((r) => setTimeout(r, 40))
  }
}
const textOf = (page) => page.evaluate(() => document.body.innerText)
async function connect(page) {
  await page.getByRole('button', { name: 'Connect device' }).click()
  await until(page, () => document.querySelector('[data-ble="connected"]'), 'connected')
}

let failures = 0
async function check(name, fn) {
  try { await fn(); console.log(`ok - ${name}`) } catch (error) { failures += 1; console.log(`not ok - ${name}\n  ${String(error.message).split('\n').join('\n  ')}`) }
}

try {
  await check('connect_shows_device_facts_and_live_reading', async () => {
    const { page, context, errors } = await open()
    await connect(page)
    assert.deepEqual(await page.evaluate(() => window.__request),
      { filters: [{ services: ['heart_rate'] }], optionalServices: ['battery_service', 'device_information'] })
    await page.clock.runFor(3000)
    await until(page, () => document.querySelector('[data-ble-bpm]')?.textContent === '60', 'bpm 60')
    const text = await textOf(page)
    for (const part of ['Strap One', 'Acme Strap One', 'Chest', 'Battery 80%', '● Live']) assert.ok(text.includes(part), `missing ${part}`)
    assert.equal(await page.locator('svg[aria-label="Heart rate over the last minute"]').getAttribute('data-points'), '3')
    assert.deepEqual(errors, [])
    await context.close()
  })

  await check('hrv_records_five_minutes_then_saves_once', async () => {
    const { page, context, errors } = await open()
    await page.evaluate(() => { window.__previous = [] })
    await connect(page)
    await page.clock.runFor(2000)
    await until(page, () => [...document.querySelectorAll('button')].some((b) => b.textContent === 'Measure HRV · 5 min'), 'HRV button')
    await page.getByRole('button', { name: 'Measure HRV · 5 min' }).click()
    await page.clock.runFor(150_000)
    await until(page, () => document.querySelector('[data-ble-hrv="recording"]')?.textContent.includes('left'), 'recording')
    assert.equal(await page.locator('[role=progressbar]').getAttribute('aria-valuenow'), '50')
    await page.clock.runFor(150_000)
    await until(page, () => document.querySelector('[data-ble-rmssd]'), 'RMSSD')
    assert.equal(await page.locator('[data-ble-rmssd]').textContent(), '19.5')
    assert.ok((await textOf(page)).includes('From 300 beats over 5 minutes'))
    const save = page.locator('[data-ble-save]')
    await save.click()
    await until(page, () => document.querySelector('[data-ble-save]')?.textContent === 'Saved ✓', 'saved')
    assert.equal(await save.isDisabled(), true, 'no second save of the same reading')
    const saved = await page.evaluate(() => window.__saved)
    assert.equal(saved.length, 1)
    assert.deepEqual({ ...saved[0], measuredAt: undefined },
      { heartRate: 60, hrvRmssdMs: 19.5, source: 'Bluetooth · Acme Strap One', measuredAt: undefined })
    assert.match(saved[0].measuredAt, /^2026-11-16T07:05:0\d\.\d{3}Z$/)
    assert.equal('hrvMs' in saved[0], false)
    assert.deepEqual(errors, [])
    await context.close()
  })

  await check('lost_contact_interrupts_the_recording', async () => {
    const { page, context } = await open()
    await connect(page)
    await page.clock.runFor(2000)
    await until(page, () => [...document.querySelectorAll('button')].some((b) => b.textContent === 'Measure HRV · 5 min'), 'HRV button')
    await page.getByRole('button', { name: 'Measure HRV · 5 min' }).click()
    await page.clock.runFor(10_000)
    await page.evaluate(() => { window.__ble.contact = 0x04 })
    await page.clock.runFor(2000)
    await until(page, () => document.querySelector('[data-ble-hrv="interrupted"]'), 'interrupted')
    assert.equal(await page.locator('[data-ble-rmssd]').count(), 0)
    assert.ok((await textOf(page)).includes('Off the skin'))
    await context.close()
  })

  await check('device_without_beat_timing_says_hrv_is_unavailable', async () => {
    const { page, context } = await open({ sendRR: false })
    await connect(page)
    await page.clock.runFor(11_000)
    await until(page, () => document.querySelector('[data-ble-hrv="no-intervals"]'), 'no-intervals note')
    assert.equal(await page.getByRole('button', { name: 'Measure HRV · 5 min' }).count(), 0)
    await context.close()
  })

  await check('a_cancelled_chooser_is_not_an_error', async () => {
    const { page, context } = await open({ refuse: 'NotFoundError' })
    await page.getByRole('button', { name: 'Connect device' }).click()
    await until(page, () => [...document.querySelectorAll('button')].some((b) => b.textContent === 'Connect device' && !b.disabled), 'idle again')
    assert.equal(await page.locator('[role=alert]').count(), 0)
    await context.close()
  })

  await check('a_blocked_site_names_the_reason', async () => {
    const { page, context } = await open({ refuse: 'SecurityError' })
    await page.getByRole('button', { name: 'Connect device' }).click()
    await until(page, () => document.querySelector('[data-ble-refusal="blocked"]'), 'blocked reason')
    assert.ok((await page.locator('[role=alert]').textContent()).includes('Bluetooth is blocked for this site'))
    await context.close()
  })

  await check('save_failure_says_so_and_allows_retry', async () => {
    const { page, context } = await open()
    await page.evaluate(() => { window.__failSave = true })
    await connect(page)
    await page.clock.runFor(2000)
    await until(page, () => document.querySelector('[data-ble-save]'), 'save button')
    await page.locator('[data-ble-save]').click()
    await until(page, () => document.querySelector('[role=alert]')?.textContent.includes('Couldn’t save'), 'failure message')
    assert.equal(await page.locator('[data-ble-save]').isDisabled(), false)
    assert.deepEqual(await page.evaluate(() => window.__saved), [])
    await context.close()
  })

  await check('disconnect_keeps_the_last_reading_and_offers_reconnect', async () => {
    const { page, context } = await open()
    await connect(page)
    await page.clock.runFor(2000)
    await until(page, () => document.querySelector('[data-ble-bpm]')?.textContent === '60', 'bpm')
    await page.getByRole('button', { name: 'Disconnect' }).click()
    await until(page, () => document.querySelector('[data-ble="idle"]'), 'idle')
    const text = await textOf(page)
    assert.ok(text.includes('Disconnected') && text.includes('Connect again'))
    assert.equal(await page.locator('[data-ble-bpm]').textContent(), '60')
    assert.equal(await page.evaluate(() => window.__ble.disconnects), 1)
    await context.close()
  })

  await check('iphone_without_web_bluetooth_points_to_apple_health', async () => {
    const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
    const { page, context } = await open({ noBluetooth: true }, { userAgent: ua })
    await until(page, () => document.querySelector('[data-ble="unavailable"]'), 'unavailable')
    assert.ok((await textOf(page)).includes('iPhone and iPad browsers can’t use Bluetooth'))
    assert.equal(await page.getByRole('link', { name: 'Set up Apple Health sync' }).getAttribute('href'), '#/health-data/tutorial')
    assert.equal(await page.getByRole('button', { name: 'Connect device' }).count(), 0)
    await context.close()
  })

  await check('other_browser_without_web_bluetooth_names_where_it_works', async () => {
    const { page, context } = await open({ noBluetooth: true })
    await until(page, () => document.querySelector('[data-ble="unavailable"]'), 'unavailable')
    assert.ok((await textOf(page)).includes('open Panacea in Chrome or Edge'))
    assert.equal(await page.getByRole('link', { name: 'Set up Apple Health sync' }).count(), 0)
    await context.close()
  })
} finally {
  await browser.close()
}

if (failures) { console.error(`ble wearable panel smoke: ${failures} failing`); process.exit(1) }
console.log('ble wearable panel smoke: connect, live reading, 5-minute HRV, one save, interruptions, refusals and platforms without Web Bluetooth behave as stated')
