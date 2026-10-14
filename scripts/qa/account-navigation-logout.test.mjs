import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')
const shell = read('src/components/layout/Shell.tsx')
const app = read('src/main.tsx')
const logout = read('src/pages/Logout.tsx')

function parse(path, source) {
  const ast = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  assert.deepEqual(ast.parseDiagnostics.map((diagnostic) => diagnostic.messageText), [], `${path} must parse as TSX`)
  return ast
}

test('sign-out is a real route and requires user confirmation', () => {
  parse('main.tsx', app)
  parse('Logout.tsx', logout)
  assert.match(app, /<Route path="\/logout" element=\{<Logout \/>\}/)
  assert.match(shell, /to="\/logout"/)
  assert.match(shell, /if \(!account && loc.pathname === '\/logout'\) return <Navigate to="\/" replace \/>/)
  assert.match(logout, /onClick=\{confirmLogout\}/)
  assert.match(logout, /logout\(\)/)
  assert.match(logout, /navigate\('\/', \{ replace: true \}\)/)
})

test('account menu must not be a descendant of the horizontal-scrolling header controls', () => {
  const ast = parse('Shell.tsx', shell)
  let foundAccount = false
  let accountClipped = false

  function attrText(opening, name) {
    const attr = opening.attributes.properties.find((property) =>
      ts.isJsxAttribute(property) && property.name.text === name)
    return attr?.getText(ast) ?? ''
  }

  function visit(node, insideOverflow = false) {
    if (ts.isJsxElement(node)) {
      const opening = node.openingElement
      const withinOverflow = insideOverflow || /overflow-x-auto/.test(attrText(opening, 'className'))
      if (/userMenuRef/.test(attrText(opening, 'ref'))) {
        foundAccount = true
        if (withinOverflow) accountClipped = true
      }
      for (const child of node.children) visit(child, withinOverflow)
      return
    }
    ts.forEachChild(node, (child) => visit(child, insideOverflow))
  }

  visit(ast)
  assert.ok(foundAccount, 'account menu anchor should remain available on all authenticated pages')
  assert.equal(accountClipped, false, 'account dropdown cannot be nested beneath an overflow-x-auto ancestor')
  assert.match(shell, /spacesOpen \|\| userMenuBuka \? 'shown' : keadaanBilah/)
  assert.match(shell, /aria-controls="panacea-account-menu"/)
})

test('role switching stays an owner-only action in the account dropdown', () => {
  const rolePanel = shell.slice(shell.indexOf('Switching role is an owner-only action'), shell.indexOf('Pasang Aplikasi (PWA)'))
  assert.match(rolePanel, /account\.isOwner &&/)
})
