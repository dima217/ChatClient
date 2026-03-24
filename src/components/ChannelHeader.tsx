import { useState } from 'react'
import { Channel, Message } from '../lib/api'
import { getUserName } from '../lib/users'

interface Props {
  channel: Channel
  onToggleMembers: () => void
  showingMembers: boolean
  searchQuery: string
  onSearchChange: (q: string) => void
  pinnedMessages: Message[]
}

export function ChannelHeader({ channel, onToggleMembers, showingMembers, searchQuery, onSearchChange, pinnedMessages }: Props) {
  const [showSearch, setShowSearch] = useState(false)
  const [showPinned, setShowPinned] = useState(false)

  return (
    <div className="border-b border-gray-800 bg-gray-900/50 flex-shrink-0">
      {/* Main header row */}
      <div className="h-14 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg text-gray-400">{channel.type === 'direct' ? '@' : '#'}</span>
          <h2 className="font-semibold truncate">{channel.name}</h2>
          {channel.description && (
            <span className="text-sm text-gray-500 truncate hidden sm:block">— {channel.description}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Search toggle */}
          <button onClick={() => { setShowSearch(!showSearch); if (showSearch) onSearchChange('') }}
            className={`p-1.5 rounded text-sm transition-colors ${showSearch ? 'bg-pink-900/40 text-pink-400' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
            title="Search messages">🔍</button>

          {/* Pinned messages toggle */}
          <button onClick={() => setShowPinned(!showPinned)}
            className={`p-1.5 rounded text-sm transition-colors relative ${showPinned ? 'bg-pink-900/40 text-pink-400' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
            title="Pinned messages">
            📌
            {pinnedMessages.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-pink-600 text-white text-[9px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
                {pinnedMessages.length}
              </span>
            )}
          </button>

          <span className="text-xs text-gray-500 ml-1">{channel.member_count}</span>
          <button onClick={onToggleMembers}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${showingMembers ? 'bg-pink-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'}`}>
            Members
          </button>
        </div>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div className="px-4 pb-2">
          <div className="relative">
            <input type="text" value={searchQuery} onChange={e => onSearchChange(e.target.value)}
              placeholder="Search messages…" autoFocus
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-pink-500" />
            {searchQuery && (
              <button onClick={() => onSearchChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-xs">✕</button>
            )}
          </div>
        </div>
      )}

      {/* Pinned messages panel */}
      {showPinned && pinnedMessages.length > 0 && (
        <div className="px-4 pb-2 max-h-48 overflow-y-auto">
          <div className="bg-gray-800/60 rounded-lg border border-gray-700 divide-y divide-gray-700/50">
            {pinnedMessages.map(m => (
              <div key={m.message_id} className="px-3 py-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-pink-400">{getUserName(m.sender_id)}</span>
                  <span className="text-[10px] text-gray-600">{new Date(m.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-gray-300 truncate mt-0.5">{m.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {showPinned && pinnedMessages.length === 0 && (
        <div className="px-4 pb-2">
          <p className="text-xs text-gray-500 text-center py-3">No pinned messages</p>
        </div>
      )}
    </div>
  )
}
