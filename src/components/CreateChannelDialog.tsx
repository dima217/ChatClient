import { useState, FormEvent } from 'react'
import { api } from '../lib/api'
import { USERS } from '../lib/users'

interface Props {
  currentUserId: string
  onClose: () => void
  onCreated: (channelId: string) => void
}

export function CreateChannelDialog({ currentUserId, onClose, onCreated }: Props) {
  const [name, setName] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [type, setType] = useState<'group' | 'direct'>('group')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const otherUsers = USERS.filter(u => u.sub !== currentUserId)

  const toggleUser = (sub: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(sub)) next.delete(sub)
      else {
        if (type === 'direct') next.clear() // direct = only 1
        next.add(sub)
      }
      return next
    })
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    const ids = Array.from(selectedIds)
    if (ids.length === 0) {
      setError('Select at least one member')
      return
    }

    setLoading(true)
    try {
      const res = await api.createChannel({
        name: type === 'group' ? name : '',
        type,
        member_ids: ids,
      })
      onCreated(res.channel_id)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-md">
          <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
            <h3 className="font-semibold text-lg">Create Channel</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">&times;</button>
          </div>

          <form onSubmit={handleSubmit} className="p-5">
            <div className="mb-4 flex gap-2">
              <button
                type="button"
                onClick={() => { setType('group'); setSelectedIds(new Set()) }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  type === 'group' ? 'bg-pink-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >Group</button>
              <button
                type="button"
                onClick={() => { setType('direct'); setSelectedIds(new Set()) }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  type === 'direct' ? 'bg-pink-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >Direct</button>
            </div>

            {type === 'group' && (
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-1.5">Channel Name</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-pink-500"
                  placeholder="e.g. Project Chat"
                  required={type === 'group'}
                  autoFocus
                />
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-1.5">
                {type === 'direct' ? 'Select user' : 'Select members'}
              </label>
              <div className="space-y-1">
                {otherUsers.map(u => (
                  <button
                    key={u.sub}
                    type="button"
                    onClick={() => toggleUser(u.sub)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                      selectedIds.has(u.sub)
                        ? 'bg-pink-900/40 border border-pink-700'
                        : 'bg-gray-800 border border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      selectedIds.has(u.sub) ? 'bg-pink-600' : 'bg-gray-700'
                    }`}>
                      {u.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{u.name}</div>
                      <div className="text-xs text-gray-500 truncate">{u.email}</div>
                    </div>
                    {selectedIds.has(u.sub) && (
                      <span className="ml-auto text-pink-400 text-sm flex-shrink-0">&#10003;</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="mb-4 text-sm text-red-400 bg-red-900/30 border border-red-800 rounded-lg px-3 py-2">{error}</div>
            )}

            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg py-2.5 text-sm font-medium transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={loading || selectedIds.size === 0} className="flex-1 bg-pink-600 hover:bg-pink-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg py-2.5 text-sm font-medium transition-colors">
                {loading ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
