export interface RealtimeRoomTransition {
  room: string
  count: number
  previousRoom: string | null
  previousCount: number
}

function normalizedRoom(value: string): string {
  const room = value.trim()
  if (!room) throw new Error('room must not be blank')
  return room
}

/**
 * Move one connection between realtime rooms atomically at the registry level.
 *
 * A connection may belong to at most one room. Switching removes it from the
 * previous Set before adding it to the new Set, and empty Sets are deleted so
 * stale room membership cannot survive a switch or later socket close.
 */
export function moveRealtimeRoomMember<T>(
  rooms: Map<string, Set<T>>,
  member: T,
  currentRoom: string | null,
  nextRoom: string,
): RealtimeRoomTransition {
  const room = normalizedRoom(nextRoom)
  const previous = currentRoom?.trim() || null

  if (previous === room) {
    let currentSet = rooms.get(room)
    if (!currentSet) {
      currentSet = new Set<T>()
      rooms.set(room, currentSet)
    }
    currentSet.add(member)
    return {
      room,
      count: currentSet.size,
      previousRoom: null,
      previousCount: currentSet.size,
    }
  }

  let previousCount = 0
  if (previous) {
    const previousSet = rooms.get(previous)
    if (previousSet) {
      previousSet.delete(member)
      previousCount = previousSet.size
      if (previousSet.size === 0) rooms.delete(previous)
    }
  }

  let nextSet = rooms.get(room)
  if (!nextSet) {
    nextSet = new Set<T>()
    rooms.set(room, nextSet)
  }
  nextSet.add(member)

  return {
    room,
    count: nextSet.size,
    previousRoom: previous,
    previousCount,
  }
}

export function removeRealtimeRoomMember<T>(
  rooms: Map<string, Set<T>>,
  member: T,
  currentRoom: string | null,
): { room: string; count: number } | null {
  const room = currentRoom?.trim()
  if (!room) return null

  const set = rooms.get(room)
  if (!set) return { room, count: 0 }

  set.delete(member)
  const count = set.size
  if (count === 0) rooms.delete(room)
  return { room, count }
}
