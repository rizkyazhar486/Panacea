import { readFile } from 'node:fs/promises'

const shell = await readFile(new URL('../../src/components/Shell.tsx', import.meta.url), 'utf8')
const assistive = await readFile(new URL('../../src/components/FabNavigasi.tsx', import.meta.url), 'utf8')

const chk = (name: string, condition: boolean, detail = '') => {
  console.log(condition ? 'PASS' : 'FAIL', name, detail)
  if (!condition) process.exitCode = 1
}

chk(
  'Assistive Touch is available beyond mobile breakpoints',
  !assistive.includes('fixed z-50 lg:hidden') &&
    !assistive.includes('fixed inset-0 z-40 bg-black/20 lg:hidden'),
)

chk(
  'Assistive Touch availability is independent from scroll-hidden chrome',
  !shell.includes('navHidden') && !shell.includes('setNavHidden'),
)

chk(
  'Assistive Touch remains mounted for supported authenticated roles',
  shell.includes("['pasien', 'dokter', 'owner'].includes(account.role) && (") &&
    shell.includes('<FabNavigasi'),
)

chk(
  'Body Explorer WebGL input-ownership opt-out remains intact',
  assistive.includes("lokasi.pathname.startsWith('/body-explorer')") &&
    assistive.includes('if (sembunyikanDiBodyExplorer) return null'),
)

chk(
  'Assistive Touch retains its stable accessible identity',
  assistive.includes('data-pmd-assistive="true"') &&
    assistive.includes('aria-label="Panacea Assistive Touch"'),
)
