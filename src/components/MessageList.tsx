import { useEffect, useRef } from 'react'
import { Message } from '../lib/api'
import { MessageItem } from './MessageItem'
import { TypingIndicator } from './TypingIndicator'

interface Props {
  messages: Message[]
  currentUserId: string
  loading: boolean
  onReaction: (messageId: string, emoji: string) => void
  onReply: (message: Message) => void
  onEdit: (messageId: string, content: string) => void
  onDelete: (messageId: string) => void
  onPin: (messageId: string) => void
  onRead: (messageId: string) => void
  typingUserIds: string[]
  readReceipts: Map<string, Set<string>>
}

export function MessageList({ messages, currentUserId, loading, onReaction, onReply, onEdit, onDelete, onPin, onRead, typingUserIds, readReceipts }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, typingUserIds.length])

  // Send read receipt for last message when messages change
  useEffect(() => {
    const last = messages[messages.length - 1]
    if (last && last.sender_id !== currentUserId) {
      onRead(last.message_id)
    }
  }, [messages.length]) // eslint-disable-line react-hooks/exhaustive-deps

  // Group consecutive messages from same sender
  const grouped = messages.reduce<{ msg: Message; showHeader: boolean }[]>((acc, msg, i) => {
    const prev = messages[i - 1]
    const showHeader = !prev ||
      prev.sender_id !== msg.sender_id ||
      (msg.created_at_epoch - prev.created_at_epoch) > 300 ||
      msg.content_type === 'system' ||
      !!msg.reply_to
    acc.push({ msg, showHeader })
    return acc
  }, [])

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-3">
      {loading ? (
        <div className="flex items-center justify-center h-full text-gray-500 text-sm">Loading messages...</div>
      ) : messages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-500 text-sm">
          No messages yet. Say hello! 👋
        </div>
      ) : (
        grouped.map(({ msg, showHeader }) => (
          <MessageItem
            key={msg.message_id}
            message={msg}
            isOwn={msg.sender_id === currentUserId}
            showHeader={showHeader}
            currentUserId={currentUserId}
            onReaction={onReaction}
            onReply={onReply}
            onEdit={onEdit}
            onDelete={onDelete}
            onPin={onPin}
            readBy={readReceipts.get(msg.message_id)}
            allMessages={messages}
          />
        ))
      )}
      {typingUserIds.length > 0 && <TypingIndicator userIds={typingUserIds} />}
      <div ref={bottomRef} />
    </div>
  )
}
