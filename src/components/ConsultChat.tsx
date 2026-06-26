import { useEffect, useRef, useState } from 'react'
import { wsUrl } from '../lib/api'
import { Button } from './ui'
import { IconStethoscope } from './icons'

interface Line { from?: string; text?: string; type: string; at?: string }

// Public STUN server for NAT traversal. For users behind symmetric NAT a TURN
// server is also required — supply it via VITE_TURN_URL / VITE_TURN_USER /
// VITE_TURN_CRED (see DOCS/REALTIME-SETUP.md).
function iceServers(): RTCIceServer[] {
  const list: RTCIceServer[] = [{ urls: 'stun:stun.l.google.com:19302' }]
  const turn = (import.meta.env.VITE_TURN_URL as string | undefined)?.trim()
  if (turn) {
    // VITE_TURN_URL may hold several comma-separated URLs (e.g. Metered gives
    // turn:...:80, turn:...:443, turns:...:443) sharing one username/credential.
    const urls = turn.split(',').map((u) => u.trim()).filter(Boolean)
    list.push({
      urls,
      username: (import.meta.env.VITE_TURN_USER as string) || undefined,
      credential: (import.meta.env.VITE_TURN_CRED as string) || undefined,
    })
  }
  return list
}

// Real-time consultation room over WebSocket (doctor ↔ patient join the same room).
// Text chat + optional WebRTC audio/video call. The WebSocket relays both chat
// messages and WebRTC signaling (offer/answer/ICE) to the other peer in the room.
export function ConsultChat({ room, name }: { room: string; name: string }) {
  const [lines, setLines] = useState<Line[]>([])
  const [input, setInput] = useState('')
  const [connected, setConnected] = useState(false)
  const [count, setCount] = useState(0)
  const [inCall, setInCall] = useState(false)
  const [callError, setCallError] = useState('')
  const [camOn, setCamOn] = useState(true)
  const [micOn, setMicOn] = useState(true)
  const wsRef = useRef<WebSocket | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)

  // Send any payload over the room WebSocket.
  const wsSend = (payload: Record<string, unknown>) => {
    const ws = wsRef.current
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ room, from: name, ...payload }))
  }

  // Create the peer connection, wire ICE/track relays, attach the local stream.
  const ensurePeer = async (): Promise<RTCPeerConnection> => {
    if (pcRef.current) return pcRef.current
    const pc = new RTCPeerConnection({ iceServers: iceServers() })
    pcRef.current = pc
    pc.onicecandidate = (e) => { if (e.candidate) wsSend({ type: 'rtc-ice', candidate: e.candidate }) }
    pc.ontrack = (e) => { if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0] }
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') setCallError('Koneksi panggilan terputus.')
    }
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    localStreamRef.current = stream
    if (localVideoRef.current) localVideoRef.current.srcObject = stream
    stream.getTracks().forEach((t) => pc.addTrack(t, stream))
    return pc
  }

  const startCall = async () => {
    setCallError('')
    try {
      const pc = await ensurePeer()
      setInCall(true)
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      wsSend({ type: 'rtc-offer', sdp: offer })
    } catch {
      setCallError('Tidak bisa mengakses kamera/mikrofon. Periksa izin browser.')
      endCall()
    }
  }

  const endCall = () => {
    pcRef.current?.close()
    pcRef.current = null
    localStreamRef.current?.getTracks().forEach((t) => t.stop())
    localStreamRef.current = null
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null
    setInCall(false)
    wsSend({ type: 'rtc-end' })
  }

  const toggleCam = () => {
    const track = localStreamRef.current?.getVideoTracks()[0]
    if (track) { track.enabled = !track.enabled; setCamOn(track.enabled) }
  }
  const toggleMic = () => {
    const track = localStreamRef.current?.getAudioTracks()[0]
    if (track) { track.enabled = !track.enabled; setMicOn(track.enabled) }
  }

  // Handle incoming WebRTC signaling from the other peer.
  const handleSignal = async (m: Line & { sdp?: RTCSessionDescriptionInit; candidate?: RTCIceCandidateInit }) => {
    try {
      if (m.type === 'rtc-offer' && m.sdp) {
        const pc = await ensurePeer()
        setInCall(true)
        await pc.setRemoteDescription(m.sdp)
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        wsSend({ type: 'rtc-answer', sdp: answer })
      } else if (m.type === 'rtc-answer' && m.sdp && pcRef.current) {
        await pcRef.current.setRemoteDescription(m.sdp)
      } else if (m.type === 'rtc-ice' && m.candidate && pcRef.current) {
        await pcRef.current.addIceCandidate(m.candidate)
      } else if (m.type === 'rtc-end') {
        endCall()
      }
    } catch {
      setCallError('Gagal memproses sinyal panggilan.')
    }
  }

  useEffect(() => {
    const ws = new WebSocket(wsUrl())
    wsRef.current = ws
    ws.onopen = () => {
      setConnected(true)
      ws.send(JSON.stringify({ type: 'join', room, from: name }))
    }
    ws.onmessage = (ev) => {
      try {
        const m = JSON.parse(ev.data) as Line & { count?: number; sdp?: RTCSessionDescriptionInit; candidate?: RTCIceCandidateInit }
        if (m.from === name) return // ignore our own relayed messages
        if (m.type === 'presence') setCount(m.count ?? 0)
        else if (m.type?.startsWith('rtc-')) handleSignal(m)
        else {
          setLines((l) => [...l, m])
          if (m.type === 'msg' && m.from && document.hidden && 'Notification' in window && Notification.permission === 'granted') {
            try { new Notification(`💬 Pesan dari ${m.from}`, { body: m.text, icon: '/icon-192.png', tag: 'consult-' + room }) } catch { /* ignore */ }
          }
        }
      } catch {
        /* ignore */
      }
    }
    ws.onclose = () => setConnected(false)
    return () => {
      ws.close()
      pcRef.current?.close()
      localStreamRef.current?.getTracks().forEach((t) => t.stop())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room, name])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [lines])

  function send() {
    const t = input.trim()
    if (!t || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return
    wsRef.current.send(JSON.stringify({ type: 'msg', room, text: t, from: name }))
    setLines((l) => [...l, { type: 'msg', from: name, text: t }]) // optimistic local echo
    setInput('')
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200">
      <div className="flex items-center gap-2 bg-ink px-4 py-2.5 text-white">
        <IconStethoscope size={18} className="text-brand" />
        <span className="text-sm font-bold">Ruang: {room}</span>
        <span className="ml-auto flex items-center gap-1 text-[11px] text-white/70">
          <span className={`h-2 w-2 rounded-full ${connected ? 'bg-brand vital-dot' : 'bg-neutral-500'}`} />
          {connected ? `${count} online` : 'menyambung…'}
        </span>
      </div>

      {/* Video call surface */}
      {inCall && (
        <div className="relative bg-black">
          <video ref={remoteVideoRef} autoPlay playsInline className="h-64 w-full bg-neutral-900 object-cover" />
          <video ref={localVideoRef} autoPlay playsInline muted className="absolute bottom-2 right-2 h-24 w-20 rounded-lg border border-white/30 object-cover" />
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-2">
            <button onClick={toggleMic} className={`grid h-9 w-9 place-items-center rounded-full text-sm ${micOn ? 'bg-white/20 text-white' : 'bg-red-500 text-white'}`}>{micOn ? '🎙️' : '🔇'}</button>
            <button onClick={toggleCam} className={`grid h-9 w-9 place-items-center rounded-full text-sm ${camOn ? 'bg-white/20 text-white' : 'bg-red-500 text-white'}`}>{camOn ? '📹' : '🚫'}</button>
            <button onClick={endCall} className="grid h-9 w-9 place-items-center rounded-full bg-red-600 text-sm text-white">📞</button>
          </div>
        </div>
      )}

      {callError && <div className="bg-red-50 px-3 py-2 text-[11px] text-red-600">{callError}</div>}

      <div ref={scrollRef} className="h-56 space-y-2 overflow-y-auto bg-neutral-50 p-3">
        {lines.length === 0 && <p className="text-center text-xs text-neutral-400">Mulai percakapan…</p>}
        {lines.map((l, i) =>
          l.type === 'system' ? (
            <div key={i} className="text-center text-[11px] text-neutral-400">{l.text}</div>
          ) : (
            <div key={i} className={`flex ${l.from === name ? 'justify-end' : ''}`}>
              <div className={`max-w-[80%] rounded-2xl px-3 py-1.5 text-sm ${l.from === name ? 'bg-brand text-white' : 'bg-white ring-1 ring-black/5'}`}>
                {l.from !== name && <div className="text-[10px] font-bold text-brand-dark">{l.from}</div>}
                {l.text}
              </div>
            </div>
          ),
        )}
      </div>
      <div className="flex gap-2 border-t border-neutral-100 p-2">
        {!inCall && (
          <Button variant="outline" onClick={startCall} disabled={!connected}>📹</Button>
        )}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Ketik pesan…"
          className="flex-1 rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-brand"
        />
        <Button onClick={send} disabled={!connected}>Kirim</Button>
      </div>
    </div>
  )
}
