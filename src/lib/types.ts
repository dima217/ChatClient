export interface AuthUser {
  sub: string
  email: string
  name: string
  groups: string[]
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
