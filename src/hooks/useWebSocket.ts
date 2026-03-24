import { useState, useEffect, useCallback } from 'react'
import { chatWs, WsStatus } from '../lib/websocket'

export function useWebSocket(connected: boolean) {
  const [status, setStatus] = useState<WsStatus>('disconnected')

  useEffect(() => {
    const unsub = chatWs.onStatus(setStatus)
    return unsub
  }, [])

  useEffect(() => {
    if (connected) {
      chatWs.connect()
    } else {
      chatWs.disconnect()
    }
    return () => { chatWs.disconnect() }
  }, [connected])

  const send = useCallback((data: Record<string, unknown>) => chatWs.send(data), [])

  return { status, send }
}
