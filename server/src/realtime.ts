import { WebSocketServer, WebSocket } from 'ws'
import type { Server } from 'node:http'
import { attachGenomicsComputeRoutes } from './genomicsCompute.js'
import { currentUserFromWebSocketRequest } from './auth.js'
import { addAudit, getVisitMembership } from './store.js'
import { moveRealtimeRoomMember, removeRealtimeRoomMember } from './realtimeRoomRegistry.js'
import {
  authorizeVisitRealtimeJoin,
  createVisitRealtimeReplayGuard,
  isReservedVisitRealtimeRoom,
  refreshVisitRealtimeAuthorization,
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
    const replayGuard = createVisitRealtimeReplayGuard()

    const visitError = (code: string) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'visit-error', code, at: new Date().toISOString() }))
      }
    }

    const leaveCurrentRoom = (reason: 'switch' | 'close') => {
      const previousRoom = room
      const previousAuthorization = visitAuthorization
      const result = removeRealtimeRoomMember(rooms, ws, previousRoom)
      if (!previousRoom || !result) {
        room = null
        visitAuthorization = null
        return
      }

      room = null
      visitAuthorization = null

      if (previousRoom.startsWith('visit:')) {
        if (authenticatedUser && previousAuthorization) {
          addAudit(
            authenticatedUser,
            reason === 'close' ? 'visit_realtime_leave' : 'visit_realtime_room_switch',
            previousAuthorization.visitId,
          )
        }
        broadcast(previousRoom, { type: 'presence', room: previousRoom, count: result.count })
      } else {
        broadcast(previousRoom, { type: 'system', text: `${name} keluar`, room: previousRoom })
        broadcast(previousRoom, { type: 'presence', room: previousRoom, count: result.count })
      }
    }

    const enterRoom = (nextRoom: string) => {
      const previousAuthorization = visitAuthorization
      const transition = moveRealtimeRoomMember(rooms, ws, room, nextRoom)

      if (transition.previousRoom) {
        if (transition.previousRoom.startsWith('visit:')) {
          if (authenticatedUser && previousAuthorization) {
            addAudit(
              authenticatedUser,
              'visit_realtime_room_switch',
              previousAuthorization.visitId,
            )
          }
          broadcast(transition.previousRoom, {
            type: 'presence',
            room: transition.previousRoom,
            count: transition.previousCount,
          })
          visitAuthorization = null
        } else {
          broadcast(transition.previousRoom, {
            type: 'system',
            text: `${name} keluar`,
            room: transition.previousRoom,
          })
          broadcast(transition.previousRoom, {
            type: 'presence',
            room: transition.previousRoom,
            count: transition.previousCount,
          })
        }
      }

      room = transition.room
      return transition
    }
    ws.on('message', (raw) => {
      let m: ChatMsg
      try {
        m = JSON.parse(raw.toString())
      } catch {
        return
      }
      if (m.type === 'join' && m.room) {
        const requestedRoom = m.room.trim()
        if (!requestedRoom) return
        if (isReservedVisitRealtimeRoom(requestedRoom)) {
          if (authenticatedUser) {
            addAudit(authenticatedUser, 'visit_realtime_reserved_room_rejected', requestedRoom.slice(0, 160))
          }
          visitError('reserved_visit_room')
          return
        }
        enterRoom(requestedRoom)
        name = m.from || name
        broadcast(requestedRoom, { type: 'system', text: `${name} bergabung`, room: requestedRoom })
        broadcast(requestedRoom, { type: 'presence', room: requestedRoom, count: rooms.get(requestedRoom)!.size })
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

        const secureRoom = `visit:${authorization.visitId}`
        enterRoom(secureRoom)
        visitAuthorization = authorization
        name = authenticatedUser.name
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

        const currentMembership = getVisitMembership(visitAuthorization.visitId)
        const refreshedAuthorization = refreshVisitRealtimeAuthorization(
          { userId: authenticatedUser.id, role: authenticatedUser.role },
          visitAuthorization,
          currentMembership ? {
            visitId: currentMembership.id,
            patientUserId: currentMembership.patientUserId,
            clinicianUserId: currentMembership.clinicianUserId,
            status: currentMembership.status,
            startsAt: currentMembership.startsAt,
            endsAt: currentMembership.endsAt,
          } : undefined,
        )
        if (!refreshedAuthorization.allowed) {
          addAudit(
            authenticatedUser,
            'visit_realtime_authorization_expired',
            `${visitAuthorization.visitId}:${refreshedAuthorization.code}`,
          )
          visitError(refreshedAuthorization.code)
          return
        }
        visitAuthorization = refreshedAuthorization

        try {
          const envelope = validateVisitRealtimeSignalEnvelope({
            type: m.type as VisitRealtimeSignalType,
            visitId: m.visitId ?? '',
            senderUserId: authenticatedUser.id,
            sessionId: m.sessionId ?? '',
            sequence: m.sequence as number,
            sentAt: m.sentAt ?? '',
            payload: m.payload,
          }, visitAuthorization)
          if (!replayGuard.accept(envelope)) {
            addAudit(authenticatedUser, 'visit_realtime_replay_rejected', visitAuthorization.visitId)
            visitError('replayed_or_invalid_sequence')
            return
          }
          relayToOthers(room, ws, JSON.stringify({
            ...envelope,
            from: authenticatedUser.name,
            participant: visitAuthorization.participant,
          }))
        } catch {
          addAudit(authenticatedUser, 'visit_realtime_signal_rejected', visitAuthorization.visitId)
          visitError('invalid_visit_signal')
        }
      }
    })
    ws.on('close', () => {
      leaveCurrentRoom('close')
    })
  })
  console.log('  Realtime:     WebSocket /ws ready')
}
