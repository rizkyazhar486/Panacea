import { WebSocketServer, WebSocket } from 'ws'
import type { Server } from 'node:http'
import type { RequestHandler } from 'express'
import { createHash } from 'node:crypto'
import jwt from 'jsonwebtoken'
import { config } from './config.js'
import { cariOrang, getUser, type User } from './store.js'

interface Ticket { uid: string; peer: string; room: string; sv: number; exp: number }

export const realtimeTicket: RequestHandler = (req, res) => {
  const user = (req as typeof req & { user: User }).user
  const name = req.body?.peerName
  if (typeof name !== 'string' || name.trim().length < 2 || name.length > 160) return void res.status(400).json({ error: 'invalid_peer' })
  const matches = cariOrang(name, 100).filter(p => p.name.toLowerCase() === name.trim().toLowerCase() && p.id !== user.id)
  if (matches.length !== 1) return void res.status(404).json({ error: 'peer_not_found_or_ambiguous' })
  const peer = matches[0].id
  const room = createHash('sha256').update(JSON.stringify([user.id, peer].sort())).digest('hex')
  const ticket = jwt.sign({ uid: user.id, peer, room, sv: user.sessionVersion ?? 0 }, config.jwtSecret,
    { algorithm: 'HS256', issuer: 'panaceamed', audience: 'panaceamed-realtime', expiresIn: '2m' })
  res.json({ ticket, room })
}

export function attachRealtime(server: Server) {
  const rooms = new Map<string, Set<WebSocket>>()
  const sessions = new Map<WebSocket, Ticket>()
  const live = (peer: WebSocket) => {
    const session = sessions.get(peer)
    const account = session ? getUser(session.uid) : undefined
    if (!session || !account || (account.sessionVersion ?? 0) !== session.sv) {
      peer.close(1008, 'Session revoked')
      return false
    }
    return peer.readyState === WebSocket.OPEN
  }
  const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 65536,
    verifyClient: ({ origin }: { origin: string }) => !origin || config.corsOrigins.includes(origin),
  })
  wss.on('connection', ws => {
    let claims: Ticket | undefined
    let user: User | undefined
    let windowStart = Date.now()
    let messages = 0
    const deadline = setTimeout(() => ws.close(1008, 'Authentication required'), 5000)
    const sessionDeadline = setTimeout(() => ws.close(1008, 'Session expired'), 8 * 3600_000)
    ws.on('error', () => ws.close())
    ws.on('message', raw => {
      if (Date.now() - windowStart > 60000) { messages = 0; windowStart = Date.now() }
      if (++messages > 120) return ws.close(1008, 'Rate limited')
      let message: Record<string, unknown>
      try { message = JSON.parse(raw.toString()) } catch { return ws.close(1008, 'Invalid message') }
      if (!message || typeof message !== 'object' || Array.isArray(message)) return ws.close(1008, 'Invalid message')
      if (!claims) {
        try {
          if (message.type !== 'auth' || typeof message.ticket !== 'string') throw new Error()
          const verified = jwt.verify(message.ticket, config.jwtSecret, { algorithms: ['HS256'], issuer: 'panaceamed', audience: 'panaceamed-realtime' }) as Ticket
          const authenticated = getUser(verified.uid)
          if (!authenticated || (authenticated.sessionVersion ?? 0) !== verified.sv || !getUser(verified.peer)) throw new Error()
          claims = verified
          user = authenticated
        } catch { return ws.close(1008, 'Unauthorized') }
        clearTimeout(deadline)
        if (!rooms.has(claims.room)) rooms.set(claims.room, new Set())
        const members = rooms.get(claims.room)!
        if (members.size >= 8) return ws.close(1008, 'Room full')
        members.add(ws)
        sessions.set(ws, claims)
        for (const peer of members) if (live(peer)) peer.send(JSON.stringify({ type: 'presence', count: members.size }))
        return
      }
      const account = user ? getUser(user.id) : undefined
      if (!user || !account || (account.sessionVersion ?? 0) !== claims.sv) return ws.close(1008, 'Session revoked')
      const kind = message.type
      if (!['msg', 'rtc-offer', 'rtc-answer', 'rtc-ice', 'rtc-end'].includes(String(kind))) return ws.close(1008, 'Invalid message')
      if (kind === 'msg' && (typeof message.text !== 'string' || message.text.length > 8000)) return ws.close(1008, 'Invalid message')
      const payload = JSON.stringify({ type: kind, text: kind === 'msg' ? message.text : undefined,
        sdp: kind === 'rtc-offer' || kind === 'rtc-answer' ? message.sdp : undefined,
        candidate: kind === 'rtc-ice' ? message.candidate : undefined,
        from: user.name, room: claims.room, at: new Date().toISOString() })
      for (const peer of rooms.get(claims.room) ?? []) if (peer !== ws && live(peer)) peer.send(payload)
    })
    ws.on('close', () => {
      clearTimeout(deadline)
      clearTimeout(sessionDeadline)
      sessions.delete(ws)
      if (!claims) return
      const members = rooms.get(claims.room)
      members?.delete(ws)
      if (!members?.size) rooms.delete(claims.room)
      else for (const peer of members) if (live(peer)) peer.send(JSON.stringify({ type: 'presence', count: members.size }))
    })
  })
  return wss
}
