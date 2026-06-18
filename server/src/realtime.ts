import { WebSocketServer, WebSocket } from 'ws'
import type { Server } from 'node:http'

interface ChatMsg {
  type: 'join' | 'msg' | 'system' | 'presence'
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
