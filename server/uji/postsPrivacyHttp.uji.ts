// Social feed privacy over real HTTP in isolated file mode. The public feed must not hand out the email of everyone who reacted.
// The client counts reactions and checks "did I react" from the same lists, so the shape and counts are preserved:
// the viewer's own email stays real, everyone else becomes a stable opaque token. Synthetic fixtures.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { startIsolatedServer } from './support/isolatedServer.ts'

const running = await startIsolatedServer('posts-privacy', 'posts-owner@localhost.test')
try {
  const { call, dataFile, restart } = running
  const login = async (email: string, role = 'pasien') => {
    const r = await call('POST', '/api/auth/dev-login', undefined, { email, role, name: email })
    assert.equal(r.status, 200)
    return r.body as { token: string; user: { id: string; email: string } }
  }
  const alice = await login('posts-alice@localhost.test')
  const bob = await login('posts-bob@localhost.test')
  const carol = await login('posts-carol@localhost.test')

  // 1. A post is authored from the session; client-supplied identity, role, likes and reactions are ignored.
  const made = await call('POST', '/api/posts', alice.token, { kind: 'image', activity: 'Synthetic activity', caption: 'Synthetic caption', authorEmail: bob.user.email, role: 'owner', likes: 999, reactions: { '🔥': [bob.user.email] } })
  assert.equal(made.status, 200)
  const post = made.body.post
  assert.equal(post.authorEmail, alice.user.email); assert.equal(post.role, 'pasien'); assert.equal(post.likes, 0)
  assert.equal(post.reactions, undefined, 'a client cannot seed reactions')

  // 2. Three accounts react.
  const react = (account: { token: string }, emoji: string) => call('POST', `/api/posts/${post.id}/react`, account.token, { emoji })
  assert.equal((await react(bob, '👍')).status, 200); assert.equal((await react(carol, '👍')).status, 200); assert.equal((await react(alice, '❤️')).status, 200)
  assert.equal((await call('POST', `/api/posts/${post.id}/react`, undefined, { emoji: '👍' })).status, 401, 'reacting needs a session')

  const feed = async (token?: string) => ((await call('GET', '/api/posts', token)).body.posts as any[]).find(p => p.id === post.id)
  const anonymous = await feed()
  // 3. Anonymous callers see counts and structure, and not one email address inside the reactions.
  assert.deepEqual(Object.keys(anonymous.reactions).sort(), ['❤️', '👍'].sort())
  assert.equal(anonymous.reactions['👍'].length, 2); assert.equal(anonymous.reactions['❤️'].length, 1)
  assert.ok(!JSON.stringify(anonymous.reactions).includes('@'), 'no email address appears in the public reactions')
  assert.ok(Object.values(anonymous.reactions).flat().every((t: any) => /^anon:[0-9a-f]{16}$/.test(t)), 'other people are opaque tokens')
  assert.ok(!JSON.stringify(anonymous.reactions).includes('posts-'), 'nothing derived from a name or address is readable')

  // 4. A signed-in viewer sees their OWN email (so "I reacted" still works) and opaque tokens for everyone else, with the same counts.
  const asBob = await feed(bob.token)
  assert.ok(asBob.reactions['👍'].includes(bob.user.email), 'bob sees himself')
  assert.ok(!asBob.reactions['👍'].includes(carol.user.email) && !asBob.reactions['❤️'].includes(alice.user.email), 'bob does not see carol or alice')
  assert.equal(asBob.reactions['👍'].length, 2); assert.equal(asBob.reactions['❤️'].length, 1)
  assert.ok(!JSON.stringify(asBob.reactions).includes(carol.user.email) && !JSON.stringify(asBob.reactions).includes(alice.user.email))
  // The same person is the same token for every viewer (so the client can de-duplicate): what bob sees as "someone else" and what
  // carol sees as "someone else" together are exactly the anonymous view of the thumbs-up list.
  const asCarol = await feed(carol.token)
  assert.ok(asCarol.reactions['👍'].includes(carol.user.email), 'carol sees herself')
  const bobSees = asBob.reactions['👍'].filter((t: string) => t.startsWith('anon:')), carolSees = asCarol.reactions['👍'].filter((t: string) => t.startsWith('anon:'))
  assert.equal(bobSees.length, 1); assert.equal(carolSees.length, 1)
  assert.deepEqual([...bobSees, ...carolSees].sort(), [...anonymous.reactions['👍']].sort(), 'tokens are stable per person across viewers')
  assert.equal(new Set([...anonymous.reactions['👍'], ...anonymous.reactions['❤️']]).size, 3, 'three different people are three different tokens')
  assert.deepEqual(await feed(), anonymous, 'the anonymous view is stable between calls')

  // 5. Toggling still works from the viewer's own entry, and the response redacts others too.
  const toggled = await react(bob, '👍')
  assert.equal(toggled.body.post.reactions['👍'].length, 1, 'bob removed his reaction')
  assert.ok(!JSON.stringify(toggled.body.post.reactions).includes(carol.user.email))
  assert.ok(!(await feed(bob.token)).reactions['👍'].includes(bob.user.email))
  assert.equal((await react(bob, '👍')).body.post.reactions['👍'].length, 2, 'and added it back')

  // 6. Redaction is output-only: after a restart (which flushes the file) the stored data still holds the real emails, and the opaque
  // tokens are unchanged, so a client that cached them is not confused by a deploy.
  const anonymousBefore = await feed()
  await restart()
  assert.deepEqual(await feed(), anonymousBefore, 'tokens are stable across a restart')
  const stored = JSON.parse(readFileSync(dataFile, 'utf8')).posts.find((p: any) => p.id === post.id)
  assert.deepEqual([...stored.reactions['👍']].sort(), [bob.user.email, carol.user.email].sort())

  // 7. Owner-only edits: another account is refused; the author can change only caption, activity and the known flags.
  assert.equal((await call('PATCH', `/api/posts/${post.id}`, bob.token, { caption: 'hijack' })).status, 403)
  assert.equal((await call('DELETE', `/api/posts/${post.id}`, bob.token)).status, 403)
  const patched = await call('PATCH', `/api/posts/${post.id}`, alice.token, { caption: 'Edited', pinned: true, role: 'owner', likes: 9999, authorEmail: bob.user.email, reactions: {} })
  assert.equal(patched.status, 200)
  assert.equal(patched.body.post.caption, 'Edited'); assert.equal(patched.body.post.pinned, true)
  assert.equal(patched.body.post.role, 'pasien'); assert.equal(patched.body.post.likes, 0); assert.equal(patched.body.post.authorEmail, alice.user.email)
  assert.ok(!JSON.stringify(patched.body.post.reactions).includes(carol.user.email), 'the edit response redacts reactions too')

  // 8. KNOWN LIMITS, recorded so they cannot change silently (each needs an owner decision, not a test fix):
  // (a) the feed identifies authors by email and the client's follow graph is keyed by it, so authorEmail is public;
  assert.equal(anonymous.authorEmail, alice.user.email, 'KNOWN LIMIT: the public feed exposes authorEmail')
  // (b) likes need no session and have no per-user limit.
  const like1 = await call('POST', `/api/posts/${post.id}/like`), like2 = await call('POST', `/api/posts/${post.id}/like`)
  assert.equal(like2.body.post.likes, like1.body.post.likes + 1, 'KNOWN LIMIT: an anonymous caller can like repeatedly')
  assert.ok(!JSON.stringify(like2.body.post.reactions).includes(carol.user.email), 'the like response is redacted too')
  // (c) public club and meet lists expose participant emails (the client computes "am I a member" from them).
  assert.equal((await call('POST', '/api/clubs', alice.token, { name: 'Synthetic club', sport: 'Running' })).status, 200)
  const clubs = (await call('GET', '/api/clubs')).body.clubs as any[]
  assert.ok(clubs[0].members.includes(alice.user.email), 'KNOWN LIMIT: the public club list exposes member emails')

  console.log('postsPrivacyHttp: public reactions carry no email (counts and "mine" preserved, others stable opaque tokens), redaction is output-only, owner-only edits whitelisted; KNOWN LIMITS recorded; passed')
} finally {
  await running.stop()
}
