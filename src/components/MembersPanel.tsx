import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { USERS, getUserName } from '../lib/users'

interface Props {
  channelId: string
  currentUserId: string
  onClose: () => void
  onRefresh: () => void
}

interface MemberInfo {
  user_id: string
  member_type: string
  role: string
}

export function MembersPanel({ channelId, currentUserId, onClose, onRefresh }: Props) {
  const [members, setMembers] = useState<MemberInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddPicker, setShowAddPicker] = useState(false)
  const [message, setMessage] = useState('')

  const fetchMembers = async () => {
    try {
      const res = await api.listMembers(channelId)
      setMembers(res.items)
    } catch (e) {
      console.error('Failed to load members:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchMembers() }, [channelId])

  const handleAdd = async (sub: string) => {
    setMessage('')
    try {
      const res = await api.addMembers(channelId, [sub])
      if (res.added.length > 0) {
        setMessage(`Added ${getUserName(sub)}`)
      } else {
        setMessage('Already a member')
      }
      fetchMembers()
      onRefresh()
    } catch (e: any) {
      setMessage(e.message)
    }
    setShowAddPicker(false)
  }

  const handleLeave = async () => {
    if (!confirm('Leave this channel?')) return
    try {
      await api.removeMember(channelId)
      onRefresh()
      onClose()
    } catch (e: any) {
      setMessage(e.message)
    }
  }

  const memberIds = new Set(members.map(m => m.user_id))
  const nonMembers = USERS.filter(u => !memberIds.has(u.sub))

  return (
    <div className="w-64 border-l border-gray-800 bg-gray-900/50 flex flex-col flex-shrink-0">
      <div className="p-3 border-b border-gray-800 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-300">Members ({members.length})</span>
        <button onClick={onClose} className="text-gray-400 hover:text-white text-lg">&times;</button>
      </div>

      <div className="p-3 border-b border-gray-800">
        <button
          onClick={() => setShowAddPicker(!showAddPicker)}
          className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 rounded-lg py-2 text-xs font-medium transition-colors"
        >
          + Add Member
        </button>
        {showAddPicker && (
          <div className="mt-2 space-y-1">
            {nonMembers.length === 0 ? (
              <div className="text-[11px] text-gray-500 py-1 text-center">Everyone is already a member</div>
            ) : nonMembers.map(u => (
              <button
                key={u.sub}
                onClick={() => handleAdd(u.sub)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded bg-gray-800 hover:bg-gray-700 text-left transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                  {u.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-medium truncate">{u.name}</div>
                  <div className="text-[10px] text-gray-500 truncate">{u.email}</div>
                </div>
              </button>
            ))}
          </div>
        )}
        {message && <div className="text-[11px] text-gray-400 mt-1.5">{message}</div>}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {loading ? (
          <div className="text-xs text-gray-500 text-center py-4">Loading...</div>
        ) : (
          <div className="space-y-1.5">
            {members.map(m => {
              const known = USERS.find(u => u.sub === m.user_id)
              const isMe = m.user_id === currentUserId
              return (
                <div key={m.user_id} className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                    isMe ? 'bg-pink-600' : m.member_type === 'bot' ? 'bg-purple-600' : 'bg-blue-600'
                  }`}>
                    {m.member_type === 'bot' ? '🤖' : (known?.name || m.user_id).charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium truncate">
                      {known?.name || m.user_id.slice(0, 8)}{isMe ? ' (you)' : ''}
                    </div>
                    {known && <div className="text-[10px] text-gray-500 truncate">{known.email}</div>}
                  </div>
                  {m.role === 'owner' && <span className="text-[9px] text-yellow-500 flex-shrink-0">owner</span>}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="p-3 border-t border-gray-800">
        <button
          onClick={handleLeave}
          className="w-full bg-red-900/40 hover:bg-red-900/60 border border-red-800 text-red-400 rounded-lg py-2 text-xs font-medium transition-colors"
        >
          Leave Channel
        </button>
      </div>
    </div>
  )
}
