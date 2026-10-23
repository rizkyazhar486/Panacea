// Printed failures must reach jalankan.mjs, which judges child exit status.
// Keep collecting diagnostics; a later PASS must never clear an earlier FAIL.
export function chk(name, condition, detail = '') {
  const passed = condition === true
  console.log(passed ? 'PASS' : 'FAIL', name, detail)
  if (!passed && !process.exitCode) process.exitCode = 1
}
