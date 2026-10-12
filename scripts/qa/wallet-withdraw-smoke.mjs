import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || '@playwright/test')
const origin = process.env.WALLET_QA_ORIGIN || 'http://127.0.0.1:4173'
const output = process.env.WALLET_QA_OUTPUT || 'artifacts/wallet-withdraw'
const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) })
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
  const errors = []; page.on('pageerror', e => errors.push(e.message))
  await page.goto(origin, { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => {
    localStorage.clear()
    localStorage.setItem('panaceamed.session.v1', JSON.stringify({ account: { id: 'wallet-test', patientId: 'self-wallet-test', email: 'wallet@localhost.test', name: 'Synthetic Wallet', role: 'pasien', isSubscriber: false }, loginAt: Date.now() }))
    localStorage.setItem('panaceamed.state.v3', JSON.stringify({ wallet: { balance: 100, transactions: [] } }))
    localStorage.setItem('panacea_onboarded_v1', '1')
    localStorage.setItem('panacea_assessment_prompt_v1', '1')
  })
  await page.goto(`${origin}/#/billing`, { waitUntil: 'domcontentloaded' })
  await page.reload({ waitUntil: 'domcontentloaded' })
  const box = page.getByText('Withdraw Remaining Deposit to Bank', { exact: true }).locator('..')
  const input = box.locator('input[type=number]')
  await input.waitFor()
  assert.equal(await input.inputValue(), '', 'missing withdrawal remains blank, never a default ten or zero')
  const button = box.getByRole('button', { name: 'Withdraw to BCA', exact: true })
  const wallet = () => page.evaluate(() => JSON.parse(localStorage.getItem('panaceamed.state.v3')).wallet)
  for (const amount of ['', '0', '-1', '0.5', '1e309', '9007199254740992']) {
    await input.fill(amount); await button.click()
    await page.getByText('Enter a whole number of PNC, 1 or more.', { exact: true }).waitFor()
    assert.deepEqual(await wallet(), { balance: 100, transactions: [] }, `refused ${amount} cannot mutate the demo ledger`)
  }
  await input.fill('101'); await button.click()
  await page.getByText('Not enough balance.', { exact: true }).waitFor()
  assert.deepEqual(await wallet(), { balance: 100, transactions: [] })
  await input.fill('25'); await button.click()
  await page.getByText('Withdrawal of Rp25,000 to BCA is being processed.', { exact: true }).waitFor()
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('panaceamed.state.v3')).wallet.balance === 75)
  const result = await wallet()
  assert.equal(result.transactions.length, 1)
  assert.equal(result.transactions[0].amount, -25)
  assert.deepEqual(errors, [])
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
  assert.ok(overflow <= 1)
  const evidence = { ok: true, synthetic: true, clientDemoOnly: true, actualBankTransfer: false, missingNotZero: true, invalidLeavesLedgerUnchanged: true, insufficientLeavesLedgerUnchanged: true, validDebit: 25, horizontalOverflowPx: overflow }
  await mkdir(output, { recursive: true }); await writeFile(`${output}/evidence.json`, JSON.stringify(evidence, null, 2)); console.log(JSON.stringify(evidence))
} finally { await browser.close() }
