'use client'

import { useEffect, useRef, useMemo, useSyncExternalStore } from 'react'
import { io, Socket } from 'socket.io-client'
import { useCurrentUser } from './use-current-user'

function useSocketStore() {
  const socketRef = useRef<Socket | null>(null)
  const connectedRef = useRef(false)
  const listenersRef = useRef(new Set<() => void>())

  const store = useMemo(() => ({
    getSocketSnapshot: () => socketRef.current,
    getConnectedSnapshot: () => connectedRef.current,
    getServerSocket: () => null as Socket | null,
    getServerConnected: () => false,
    subscribe: (listener: () => void) => {
      listenersRef.current.add(listener)
      return () => { listenersRef.current.delete(listener) }
    },
    setSocket: (s: Socket | null) => {
      socketRef.current = s
      listenersRef.current.forEach((l) => l())
    },
    setConnected: (c: boolean) => {
      connectedRef.current = c
      listenersRef.current.forEach((l) => l())
    },
  }), [])

  return store
}

export function useSocket() {
  const { user, isAuthenticated } = useCurrentUser()
  const store = useSocketStore()

  const socket = useSyncExternalStore(
    store.subscribe,
    store.getSocketSnapshot,
    store.getServerSocket
  )

  const isConnected = useSyncExternalStore(
    store.subscribe,
    store.getConnectedSnapshot,
    store.getServerConnected
  )

  useEffect(() => {
    if (!isAuthenticated || !user) return

    const newSocket = io(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', {
      auth: {
        token: 'session',
        userId: user.id,
        username: user.name,
      },
      transports: ['websocket', 'polling'],
    })

    newSocket.on('connect', () => {
      store.setConnected(true)
    })

    newSocket.on('disconnect', () => {
      store.setConnected(false)
    })

    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message)
      store.setConnected(false)
    })

    store.setSocket(newSocket)

    return () => {
      newSocket.disconnect()
      store.setSocket(null)
      store.setConnected(false)
    }
  }, [isAuthenticated, user, store])

  return { socket, isConnected }
}
