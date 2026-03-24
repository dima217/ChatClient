import { io, Socket } from 'socket.io-client'
import { config } from '../config'
import { getIdToken } from './auth'

export type WsStatus = 'disconnected' | 'connecting' | 'connected'
export type WsEventType =
  | 'chat.send.ack' | 'chat.message' | 'chat.typing'
  | 'chat.read' | 'chat.react' | 'chat.error'
  | 'chat.edit' | 'chat.delete' | 'chat.pin' | 'chat.system'

type Listener = (data: Record<string, unknown>) => void

class ChatSocket {
  private socket: Socket | null = null
  private listeners = new Map<string, Set<Listener>>()
  private statusListeners = new Set<(status: WsStatus) => void>()
  private _status: WsStatus = 'disconnected'

  get status() {
    return this._status
  }

  private setStatus(s: WsStatus) {
    this._status = s
    this.statusListeners.forEach(fn => fn(s))
  }

  async connect() {
    if (this.socket?.connected) return
    this.setStatus('connecting')

    const token = await getIdToken()
    if (!token) {
      this.setStatus('disconnected')
      return
    }

    try {
      this.socket = io(config.wsUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 30000,
        reconnectionAttempts: Infinity,
      })

      this.socket.on('connect', () => {
        this.setStatus('connected')
      })

      this.socket.on('disconnect', () => {
        this.setStatus('disconnected')
      })

      this.socket.on('connect_error', () => {
        this.setStatus('disconnected')
      })

      // Forward server events to our listeners
      const eventTypes: WsEventType[] = [
        'chat.send.ack', 'chat.message', 'chat.typing',
        'chat.read', 'chat.react', 'chat.error',
        'chat.edit', 'chat.delete', 'chat.pin', 'chat.system',
      ]
      for (const type of eventTypes) {
        this.socket.on(type, (payload: Record<string, unknown>) => {
          const data = typeof payload === 'object' && payload !== null
            ? { ...payload, type }
            : { type, ...(typeof payload !== 'undefined' ? { data: payload } : {}) }
          this.listeners.get(type)?.forEach(fn => fn(data))
          this.listeners.get('*')?.forEach(fn => fn(data))
        })
      }
    } catch {
      this.setStatus('disconnected')
    }
  }

  disconnect() {
    this.socket?.disconnect()
    this.socket?.removeAllListeners()
    this.socket = null
    this.setStatus('disconnected')
  }

  send(data: Record<string, unknown>) {
    const action = data.action as string
    if (!action || !this.socket?.connected) return false
    this.socket.emit(action, data)
    return true
  }

  on(type: string, fn: Listener) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set())
    this.listeners.get(type)!.add(fn)
    return () => {
      this.listeners.get(type)?.delete(fn)
    }
  }

  onStatus(fn: (status: WsStatus) => void) {
    this.statusListeners.add(fn)
    return () => {
      this.statusListeners.delete(fn)
    }
  }
}

export const chatWs = new ChatSocket()
