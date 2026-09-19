import { WebSocketServer, WebSocket } from 'ws'
import type { Server } from 'node:http'
import { attachGenomicsComputeRoutes } from './genomicsCompute.js'
import { currentUserFromWebSocketRequest } from './auth.js'
import { addAudit, getVisitMembership } from './store.js'
import {
  authorizeVisitRealtimeJoin,
  validateVisitRealtimeSignalEnvelope,
  type VisitRealtimeAuthorization,
  type VisitRealtimeSignalType,
} from './visitRealtimePolicy.js'

interface ChatMsg {
  // 'rtc-*' = WebRTC signaling for video/audio calls (relayed to the other peer).
  type:
    | 'join'
    | 'msg'
    | 'system'
    | 'presence'
    | 'rtc-offer'
    | 'rtc-answer'
    | 'rtc-ice'
    | 'rtc-end'
    | 'visit-join'
    | 'visit-rtc-offer'
    | 'visit-rtc-answer'
    | 'visit-rtc-ice'
    | 'visit-rtc-end'
  room?: string
  text?: string
  from?: string
  at?: string
  count?: number
  visitId?: string
  sessionId?: string
  sequence?: number
  sentAt?: string
  payload?: unknown
}

const rooms = new Map<string, Set<WebSocket>>()

function broadcast(room: string, msg: ChatMsg) {
  const set = rooms.get(room)
  if (!set) return
  const data = JSON.stringify({ ...msg, at: msg.at ?? new Date().toISOString() })
  for (const ws of set) if (ws.readyState === WebSocket.OPEN) ws.send(data)
}

// Relay a raw payload to every peer in the room EXCEPT the sender (used for
// WebRTC signaling, where echoing back to the sender breaks the handshake).
function relayToOthers(room: string, sender: WebSocket, raw: string) {
  const set = rooms.get(room)
  if (!set) return
  for (const ws of set) if (ws !== sender && ws.readyState === WebSocket.OPEN) ws.send(raw)
}

// Real-time consultation rooms over WebSocket (doctor ↔ patient).
// The same HTTP server is also the Render backend entrypoint, so attach the
// genomics control-plane routes here without duplicating an Express server.
export function attachRealtime(server: Server) {
  attachGenomicsComputeRoutes(server)

  const wss = new WebSocketServer({ server, path: '/ws' })
  wss.on('connection', (ws, request) => {
    let room: string | null = null
    let name = 'Anonim'
    const authenticatedUser = currentUserFromWebSocketRequest(request)
    let visitAuthorization: Extract<VisitRealtimeAuthorization, { allowed: true }> | null = null
    let lastVisitSequence = -1

    const visitError = (code: string) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'visit-error', code, at: new Date().toISOString() }))
      }
    }

    const enterRoom = (nextRoom: string) => {
      room = nextRoom
      if (!rooms.has(nextRoom)) rooms.set(nextRoom, new Set())
      rooms.get(nextRoom)!.add(ws)
    }
    ws.on('message', (raw) => {
      let m: ChatMsg
      try {
        m = JSON.parse(raw.toString())
      } catch {
        return
      }
      if (m.type === 'join' && m.room) {
        room = m.room
        name = m.from || name
        enterRoom(room)
        broadcast(room, { type: 'system', text: `${name} bergabung`, room })
        broadcast(room, { type: 'presence', room, count: rooms.get(room)!.size })
      } else if (m.type === 'visit-join' && m.visitId) {
        if (!authenticatedUser) {
          visitError('unauthenticated')
          return
        }
        const membership = getVisitMembership(m.visitId)
        if (!membership) {
          visitError('visit_not_found')
          return
        }
        const authorization = authorizeVisitRealtimeJoin(
          { userId: authenticatedUser.id, role: authenticatedUser.role },
          m.visitId,
          {
            visitId: membership.id,
            patientUserId: membership.patientUserId,
            clinicianUserId: membership.clinicianUserId,
            status: membership.status,
            startsAt: membership.startsAt,
            endsAt: membership.endsAt,
          },
        )
        if (!authorization.allowed) {
          visitError(authorization.code)
          return
        }

        visitAuthorization = authorization
        lastVisitSequence = -1
        name = authenticatedUser.name
        const secureRoom = `visit:${authorization.visitId}`
        enterRoom(secureRoom)
        addAudit(authenticatedUser, 'visit_realtime_join', authorization.visitId)
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'visit-joined',
            visitId: authorization.visitId,
            participant: authorization.participant,
            at: new Date().toISOString(),
          }))
        }
        broadcast(secureRoom, { type: 'presence', room: secureRoom, count: rooms.get(secureRoom)!.size })
      } else if (m.type === 'msg' && room && !room.startsWith('visit:')) {
        broadcast(room, { type: 'msg', text: m.text, from: m.from || name, room })
      } else if (m.type?.startsWith('rtc-') && room && !room.startsWith('visit:')) {
        // Legacy Consult signaling stays untouched for backwards compatibility.
        relayToOthers(room, ws, raw.toString())
      } else if (m.type?.startsWith('visit-rtc-')) {
        if (!authenticatedUser || !visitAuthorization || !room?.startsWith('visit:')) {
          visitError('visit_join_required')
          return
        }
        const sequence = m.sequence
        if (!Number.isSafeInteger(sequence) || (sequence as number) <= lastVisitSequence) {
          visitError('replayed_or_invalid_sequence')
          return
        }
        try {
          const envelope = validateVisitRealtimeSignalEnvelope({
            type: m.type as VisitRealtimeSignalType,
            visitId: m.visitId ?? '',
            senderUserId: authenticatedUser.id,
            sessionId: m.sessionId ?? '',
            sequence: sequence as number,
            sentAt: m.sentAt ?? '',
            payload: m.payload,
          }, visitAuthorization)
          lastVisitSequence = envelope.sequence
          relayToOthers(room, ws, JSON.stringify({
            ...envelope,
            from: authenticatedUser.name,
            participant: visitAuthorization.participant,
          }))
        } catch {
          visitError('invalid_visit_signal')
        }
      }
    })
    ws.on('close', () => {
      if (room && rooms.has(room)) {
        rooms.get(room)!.delete(ws)
        if (room.startsWith('visit:')) {
          if (authenticatedUser && visitAuthorization) {
            addAudit(authenticatedUser, 'visit_realtime_leave', visitAuthorization.visitId)
          }
          broadcast(room, { type: 'presence', room, count: rooms.get(room)!.size })
        } else {
          broadcast(room, { type: 'system', text: `${name} keluar`, room })
          broadcast(room, { type: 'presence', room, count: rooms.get(room)!.size })
        }
      }
    })
  })
  console.log('  Realtime:     WebSocket /ws ready')
}
