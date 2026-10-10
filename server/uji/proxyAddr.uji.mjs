import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import test from 'node:test'

// Resolve the dependency Express actually uses, including any nested installation.
const require = createRequire(import.meta.url)
const proxyaddr = createRequire(require.resolve('express'))('proxy-addr')
const request = (remoteAddress) => ({
  socket: { remoteAddress },
  headers: { 'x-forwarded-for': '203.0.113.25' },
})

// GHSA-jqcg-44mw-7w3h: IPv6 prefixes which do not cover the mapped marker
// must never cause an arbitrary IPv4 peer to become a trusted proxy.
test('short mapped IPv6 trust does not accept an arbitrary IPv4 peer', () => {
  const trust = proxyaddr.compile('::ffff:10.0.0.0/8')
  assert.equal(trust('198.51.100.7'), false)
  assert.equal(proxyaddr(request('198.51.100.7'), trust), '198.51.100.7')
})

test('native IPv6 trust does not accept IPv4 peers', () => {
  const trust = proxyaddr.compile('::/1')
  assert.equal(trust('::1'), true)
  assert.equal(trust('198.51.100.7'), false)
  assert.equal(proxyaddr(request('198.51.100.7'), trust), '198.51.100.7')
})

test('mapped marker prefix boundary requires all 96 bits', () => {
  assert.equal(proxyaddr.compile('::ffff:0.0.0.0/95')('198.51.100.7'), false)
  assert.equal(proxyaddr.compile('::ffff:0.0.0.0/96')('198.51.100.7'), true)
})

test('correct mapped IPv6 subnet preserves trusted hops and excludes its neighbours', () => {
  const trust = proxyaddr.compile('::ffff:10.0.0.0/104')
  for (const ip of ['10.0.0.0', '10.255.255.255', '::ffff:10.1.2.3']) {
    assert.equal(trust(ip), true, ip)
  }
  for (const ip of ['9.255.255.255', '11.0.0.0', '198.51.100.7']) {
    assert.equal(trust(ip), false, ip)
    assert.equal(proxyaddr(request(ip), trust), ip)
  }
  assert.equal(proxyaddr(request('10.1.2.3'), trust), '203.0.113.25')
})

test('plain IPv4 trust keeps its existing subnet behaviour', () => {
  const trust = proxyaddr.compile('10.0.0.0/8')
  assert.equal(trust('10.1.2.3'), true)
  assert.equal(trust('198.51.100.7'), false)
  assert.equal(proxyaddr(request('10.1.2.3'), trust), '203.0.113.25')
  assert.equal(proxyaddr(request('198.51.100.7'), trust), '198.51.100.7')
})

test('untrusted lookup is deterministic and leaves the request unchanged', () => {
  const req = request('198.51.100.7')
  const before = structuredClone(req)
  const trust = proxyaddr.compile('::ffff:10.0.0.0/8')
  assert.equal(proxyaddr(req, trust), '198.51.100.7')
  assert.equal(proxyaddr(req, trust), '198.51.100.7')
  assert.deepEqual(req, before)
})
