import { config } from '../config'
import { getIdToken } from './auth'

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = await getIdToken()
  if (!token) throw new Error('Not authenticated')

  const res = await fetch(`${config.apiUrl}${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.message || data.error || `API error ${res.status}`)
  return data
}

export interface Channel {
  channel_id: string
  name: string
  type: 'direct' | 'group'
  created_by: string
  created_at: string
  member_count: number
  last_message_at: number
  last_message_preview: string
  last_message_by?: string
  muted: boolean
  role: string
  description?: string
}

export interface Message {
  message_id: string
  channel_id: string
  sender_id: string
  sender_type: string
  content: string
  content_type: string
  created_at: string
  created_at_epoch: number
  reply_to?: string
  mentions?: string[]
  attachments?: { url: string; name: string; size: number }[]
  reactions?: Record<string, string[]>
  client_request_id?: string
  edited_at?: string
  deleted_at?: string
  deleted_by?: string
  pinned_at?: string
  pinned_by?: string
  status?: 'sending' | 'sent' | 'delivered' | 'read'
}

export const api = {
  listChannels: () =>
    request<{ items: Channel[]; count: number }>('GET', '/api/chat/channels'),

  createChannel: (data: { name: string; type: string; member_ids: string[]; description?: string }) =>
    request<{ channel_id: string; name: string; type: string; member_count: number; created_at: string }>(
      'POST', '/api/chat/channels', data
    ),

  listMessages: (channelId: string) =>
    request<{ items: Message[]; count: number; read_cursor: Record<string, string> }>(
      'GET', `/api/chat/channels/${channelId}/messages`
    ),

  addMembers: (channelId: string, memberIds: string[]) =>
    request<{ added: { user_id: string; type: string }[]; channel_id: string }>(
      'POST', `/api/chat/channels/${channelId}/members`, { member_ids: memberIds }
    ),

  removeMember: (channelId: string, userId?: string) =>
    request<{ removed: string; channel_id: string }>(
      'DELETE', `/api/chat/channels/${channelId}/members`, userId ? { user_id: userId } : {}
    ),

  listMembers: (channelId: string) =>
    request<{ items: { user_id: string; member_type: string; role: string; joined_at: string }[]; count: number; channel_id: string }>(
      'GET', `/api/chat/channels/${channelId}/members`
    ),
}
