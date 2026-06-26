import { WebSocketServer, WebSocket } from 'ws'
import type { Server } from 'node:http'

interface ChatMsg {
  // 'rtc-*' = WebRTC signaling for video/audio calls (relayed to the other peer).
  type: 'join' | 'msg' | 'system' | 'presence' | 'rtc-offer' | 'rtc-answer' | 'rtc-ice' | 'rtc-end'
  room?: string
  text?: string
  from?: string
  at?: string
  count?: number
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
export function attachRealtime(server: Server) {
  const wss = new WebSocketServer({ server, path: '/ws' })
  wss.on('connection', (ws) => {
    let room: string | null = null
    let name = 'Anonim'
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
        if (!rooms.has(room)) rooms.set(room, new Set())
        rooms.get(room)!.add(ws)
        broadcast(room, { type: 'system', text: `${name} bergabung`, room })
        broadcast(room, { type: 'presence', room, count: rooms.get(room)!.size })
      } else if (m.type === 'msg' && room) {
        broadcast(room, { type: 'msg', text: m.text, from: m.from || name, room })
      } else if (m.type?.startsWith('rtc-') && room) {
        // Video/audio call signaling — forward untouched to the other peer only.
        relayToOthers(room, ws, raw.toString())
      }
    })
    ws.on('close', () => {
      if (room && rooms.has(room)) {
        rooms.get(room)!.delete(ws)
        broadcast(room, { type: 'system', text: `${name} keluar`, room })
        broadcast(room, { type: 'presence', room, count: rooms.get(room)!.size })
      }
    })
  })
  console.log('  Realtime:     WebSocket /ws ready')
}
