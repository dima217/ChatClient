import { useState } from 'react'
import { AuthUser } from '../lib/auth'
import { useChat } from '../hooks/useChat'
import { useWebSocket } from '../hooks/useWebSocket'
import { ChannelList } from '../components/ChannelList'
import { MessageList } from '../components/MessageList'
import { MessageInput } from '../components/MessageInput'
import { ChannelHeader } from '../components/ChannelHeader'
import { CreateChannelDialog } from '../components/CreateChannelDialog'
import { MembersPanel } from '../components/MembersPanel'

interface Props {
  user: AuthUser
  onLogout: () => void
}

export function ChatPage({ user, onLogout }: Props) {
  const { status } = useWebSocket(true)
  const chat = useChat(user.sub)
  const [showCreateChannel, setShowCreateChannel] = useState(false)
  const [showMembers, setShowMembers] = useState(false)

  return (
    <div className="h-screen flex bg-gray-950">
      {/* Sidebar */}
      <div className="w-72 flex-shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col">
        {/* User header */}
        <div className="p-3 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-pink-600 flex items-center justify-center text-sm font-medium flex-shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{user.name}</div>
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${status === 'connected' ? 'bg-green-500' : status === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                <span className="text-[10px] text-gray-500">{status}</span>
              </div>
            </div>
          </div>
          <button onClick={onLogout} className="text-xs text-gray-500 hover:text-gray-300 flex-shrink-0">
            Logout
          </button>
        </div>

        <ChannelList
          channels={chat.channels}
          activeChannelId={chat.activeChannelId}
          onSelect={chat.setActiveChannelId}
          onCreateNew={() => setShowCreateChannel(true)}
          loading={chat.loadingChannels}
          currentUserId={user.sub}
          unreadCounts={chat.unreadCounts}
        />
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {chat.activeChannel ? (
          <>
            <ChannelHeader
              channel={chat.activeChannel}
              onToggleMembers={() => setShowMembers(!showMembers)}
              showingMembers={showMembers}
              searchQuery={chat.searchQuery}
              onSearchChange={chat.setSearchQuery}
              pinnedMessages={chat.pinnedMessages}
            />
            <div className="flex-1 flex min-h-0">
              <div className="flex-1 flex flex-col min-w-0">
                <MessageList
                  messages={chat.messages}
                  currentUserId={user.sub}
                  loading={chat.loadingMessages}
                  onReaction={chat.toggleReaction}
                  onRead={chat.sendRead}
                  typingUserIds={chat.typingUserIds}
                  readReceipts={chat.readReceipts}
                  onReply={chat.setReplyTo}
                  onEdit={chat.editMessage}
                  onDelete={chat.deleteMessage}
                  onPin={chat.togglePin}
                />
                <MessageInput
                  onSend={chat.sendMessage}
                  onTyping={chat.sendTyping}
                  currentUserId={user.sub}
                  replyTo={chat.replyTo}
                  onCancelReply={() => chat.setReplyTo(null)}
                />
              </div>
              {showMembers && chat.activeChannel && (
                <MembersPanel
                  channelId={chat.activeChannel.channel_id}
                  currentUserId={user.sub}
                  onClose={() => setShowMembers(false)}
                  onRefresh={chat.refreshChannels}
                />
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="text-4xl mb-3">💬</div>
              <div className="text-lg font-medium">Select a channel</div>
              <div className="text-sm mt-1">or create a new one to start chatting</div>
            </div>
          </div>
        )}
      </div>

      {showCreateChannel && (
        <CreateChannelDialog
          currentUserId={user.sub}
          onClose={() => setShowCreateChannel(false)}
          onCreated={(channelId) => {
            setShowCreateChannel(false)
            chat.refreshChannels()
            chat.setActiveChannelId(channelId)
          }}
        />
      )}
    </div>
  )
}
