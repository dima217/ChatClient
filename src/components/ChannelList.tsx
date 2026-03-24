import { Channel } from '../lib/api'

interface Props {
  channels: Channel[]
  activeChannelId: string | null
  onSelect: (id: string) => void
  onCreateNew: () => void
  loading: boolean
  currentUserId: string
  unreadCounts?: Record<string, number>
}

export function ChannelList({ channels, activeChannelId, onSelect, onCreateNew, loading, unreadCounts = {} }: Props) {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="p-3 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Channels</span>
        <button
          onClick={onCreateNew}
          className="w-6 h-6 flex items-center justify-center rounded bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white text-lg leading-none transition-colors"
          title="Create channel"
        >+</button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {loading && channels.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-8">Loading...</div>
        ) : channels.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-8">
            No channels yet<br />
            <button onClick={onCreateNew} className="text-pink-500 hover:text-pink-400 mt-1">Create one</button>
          </div>
        ) : (
          channels.map(ch => {
            const unread = unreadCounts[ch.channel_id] || 0
            return (
              <button
                key={ch.channel_id}
                onClick={() => onSelect(ch.channel_id)}
                className={`w-full text-left rounded-lg px-3 py-2.5 mb-0.5 transition-colors ${
                  ch.channel_id === activeChannelId
                    ? 'bg-gray-800 text-white'
                    : unread > 0
                      ? 'text-white hover:bg-gray-800/50'
                      : 'text-gray-300 hover:bg-gray-800/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-sm truncate ${unread > 0 && ch.channel_id !== activeChannelId ? 'font-bold' : 'font-medium'}`}>
                    {ch.type === 'direct' ? '@ ' : '# '}{ch.name}
                  </span>
                  <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                    {unread > 0 && ch.channel_id !== activeChannelId && (
                      <span className="bg-pink-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                        {unread > 99 ? '99+' : unread}
                      </span>
                    )}
                    <span className="text-[10px] text-gray-500">{ch.member_count}</span>
                  </div>
                </div>
                {ch.last_message_preview && (
                  <div className={`text-xs truncate mt-0.5 ${unread > 0 && ch.channel_id !== activeChannelId ? 'text-gray-300' : 'text-gray-500'}`}>
                    {ch.last_message_preview}
                  </div>
                )}
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
