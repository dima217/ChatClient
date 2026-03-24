import React, { useEffect, useRef } from 'react'
import { View, Text, FlatList, StyleSheet, Keyboard, Platform } from 'react-native'
import { Message } from '../lib/api'
import { MessageItem } from './MessageItem'
import { TypingIndicator } from './TypingIndicator'
import { colors } from '../theme'

interface Props {
  channelId: string | null
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

export function MessageList({
  channelId,
  messages,
  currentUserId,
  loading,
  onReaction,
  onReply,
  onEdit,
  onDelete,
  onPin,
  onRead,
  typingUserIds,
  readReceipts,
}: Props) {
  const flatRef = useRef<FlatList>(null)
  const initialScrollForChannelRef = useRef(true)

  useEffect(() => {
    initialScrollForChannelRef.current = true
  }, [channelId])

  useEffect(() => {
    const event = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow'
    const sub = Keyboard.addListener(event, () => {
      const scroll = () => flatRef.current?.scrollToEnd({ animated: true })
      requestAnimationFrame(scroll)
      setTimeout(scroll, 100)
    })
    return () => sub.remove()
  }, [channelId])

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

  const onContentSizeChange = () => {
    if (grouped.length === 0) return
    const animated = !initialScrollForChannelRef.current
    flatRef.current?.scrollToEnd({ animated })
    if (initialScrollForChannelRef.current) {
      initialScrollForChannelRef.current = false
    }
  }

  useEffect(() => {
    const last = messages[messages.length - 1]
    if (last && last.sender_id !== currentUserId) onRead(last.message_id)
  }, [messages.length])

  if (loading) {
    return (
      <View style={s.center}>
        <Text style={s.empty}>Loading messages...</Text>
      </View>
    )
  }

  if (messages.length === 0) {
    return (
      <View style={s.center}>
        <Text style={s.empty}>No messages yet. Say hello! 👋</Text>
      </View>
    )
  }

  return (
    <View style={s.container}>
      <FlatList
        ref={flatRef}
        data={grouped}
        keyExtractor={item => item.msg.message_id}
        renderItem={({ item: { msg, showHeader } }) => (
          <MessageItem
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
            replyMsg={msg.reply_to ? messages.find(m => m.message_id === msg.reply_to) : null}
          />
        )}
        contentContainerStyle={s.listContent}
        onContentSizeChange={onContentSizeChange}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      />
      {typingUserIds.length > 0 && <TypingIndicator userIds={typingUserIds} />}
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 8 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { color: colors.text.gray500, fontSize: 14 },
})
