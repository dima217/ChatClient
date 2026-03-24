import React, { useState } from 'react'
import { View, Text, TouchableOpacity, Pressable, StyleSheet } from 'react-native'
import { Message } from '../lib/api'
import { getUserName } from '../lib/users'
import { colors } from '../theme'

interface Props {
  message: Message
  isOwn: boolean
  showHeader: boolean
  currentUserId: string
  onReaction: (messageId: string, emoji: string) => void
  onReply: (message: Message) => void
  onEdit: (messageId: string, content: string) => void
  onDelete: (messageId: string) => void
  onPin: (messageId: string) => void
  readBy?: Set<string>
  replyMsg?: Message | null
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch { return '' }
}

function DeliveryStatus({ status, readBy }: { status?: Message['status']; readBy?: Set<string> }) {
  if (!status) return null
  const hasReaders = readBy && readBy.size > 0
  if (status === 'sending') return <Text style={s.status}>○</Text>
  if (status === 'sent' && !hasReaders) return <Text style={s.status}>✓</Text>
  if (status === 'read' || hasReaders) return <Text style={[s.status, s.statusRead]}>✓✓</Text>
  return <Text style={s.status}>✓✓</Text>
}

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '🎉', '👀']

export function MessageItem({ message, isOwn, showHeader, currentUserId, onReaction, onReply, onEdit, onDelete, onPin, readBy, replyMsg }: Props) {
  const [showActions, setShowActions] = useState(false)
  const [showReactionPicker, setShowReactionPicker] = useState(false)

  const isDeleted = !!message.deleted_at
  const isSystem = message.content_type === 'system' || message.sender_type === 'system'
  const reactions = message.reactions || {}
  const hasReactions = Object.keys(reactions).length > 0
  const senderName = message.sender_type === 'system' ? 'System' : (isOwn ? 'You' : getUserName(message.sender_id))

  if (isSystem) {
    return (
      <View style={s.systemWrap}>
        <Text style={s.systemText}>{message.content}</Text>
      </View>
    )
  }

  return (
    <Pressable style={[s.wrap, showHeader && s.wrapHeader]} onPress={() => setShowActions(!showActions)}>
      {replyMsg && !isDeleted && (
        <View style={s.replyCtx}>
          <Text style={s.replyCtxText} numberOfLines={1}>
            <Text style={s.replyCtxName}>{getUserName(replyMsg.sender_id)}</Text>
            {' '}{replyMsg.deleted_at ? '(deleted)' : replyMsg.content.slice(0, 50)}{!replyMsg.deleted_at && replyMsg.content.length > 50 ? '…' : ''}
          </Text>
        </View>
      )}

      {showHeader && (
        <View style={s.header}>
          <View style={[s.avatar, isOwn ? s.avatarOwn : s.avatarOther]}>
            <Text style={s.avatarText}>{senderName.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={[s.sender, isOwn ? s.senderOwn : s.senderOther]}>{senderName}</Text>
          <Text style={s.time}>{formatTime(message.created_at)}</Text>
          {isOwn && <DeliveryStatus status={message.status} readBy={readBy} />}
          {message.pinned_at && <Text style={s.pin}>📌</Text>}
        </View>
      )}

      <View style={s.body}>
        {isDeleted ? (
          <Text style={s.deleted}>Message deleted</Text>
        ) : (
          <>
            <Text style={s.content}>{message.content}</Text>
            {message.edited_at && <Text style={s.edited}> (edited)</Text>}
            {isOwn && !showHeader && <DeliveryStatus status={message.status} readBy={readBy} />}
            {!showHeader && message.pinned_at && <Text style={s.pin}> 📌</Text>}
          </>
        )}

        {hasReactions && !isDeleted && (
          <View style={s.reactions}>
            {Object.entries(reactions).map(([emoji, users]) => (
              <TouchableOpacity
                key={emoji}
                style={[s.reaction, users.includes(currentUserId) && s.reactionActive]}
                onPress={() => onReaction(message.message_id, emoji)}
              >
                <Text style={s.reactionEmoji}>{emoji}</Text>
                <Text style={s.reactionCount}>{users.length}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {showActions && !isDeleted && (
          <View style={s.actions}>
            <TouchableOpacity style={s.actionBtn} onPress={() => setShowReactionPicker(!showReactionPicker)}>
              <Text>😊</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.actionBtn} onPress={() => onReply(message)}>
              <Text>↩</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.actionBtn} onPress={() => onPin(message.message_id)}>
              <Text>{message.pinned_at ? '📌' : '📍'}</Text>
            </TouchableOpacity>
            {isOwn && (
              <TouchableOpacity style={s.actionBtn} onPress={() => onDelete(message.message_id)}>
                <Text style={s.deleteText}>🗑</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {showReactionPicker && (
          <View style={s.reactionPicker}>
            {EMOJIS.map(emoji => (
              <TouchableOpacity
                key={emoji}
                style={s.reactionPickBtn}
                onPress={() => { onReaction(message.message_id, emoji); setShowReactionPicker(false) }}
              >
                <Text style={s.reactionPickEmoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setShowReactionPicker(false)}>
              <Text style={s.closePick}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Pressable>
  )
}

const s = StyleSheet.create({
  wrap: { marginTop: 2 },
  wrapHeader: { marginTop: 12 },
  systemWrap: { alignItems: 'center', marginVertical: 8 },
  systemText: { fontSize: 12, color: colors.text.gray500, backgroundColor: 'rgba(31,41,55,0.5)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16 },
  replyCtx: { paddingLeft: 32, marginBottom: 2 },
  replyCtxText: { fontSize: 11, color: colors.text.gray500 },
  replyCtxName: { fontWeight: '500', color: colors.text.gray400 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  avatar: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  avatarOwn: { backgroundColor: colors.accent.pink600 },
  avatarOther: { backgroundColor: colors.accent.blue600 },
  avatarText: { fontSize: 10, fontWeight: 'bold', color: colors.text.white },
  sender: { fontSize: 14, fontWeight: '600' },
  senderOwn: { color: colors.text.pink400 },
  senderOther: { color: colors.text.blue400 },
  time: { fontSize: 10, color: colors.text.gray600 },
  status: { fontSize: 10, color: colors.text.gray500, marginLeft: 4 },
  statusRead: { color: colors.text.blue400 },
  pin: { fontSize: 10, color: colors.text.yellow500 },
  body: { paddingLeft: 32 },
  content: { fontSize: 14, color: colors.text.gray300 },
  deleted: { fontSize: 14, color: colors.text.gray600, fontStyle: 'italic' },
  edited: { fontSize: 10, color: colors.text.gray600 },
  reactions: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  reaction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: colors.bg.gray800,
    borderWidth: 1,
    borderColor: colors.border.gray700,
  },
  reactionActive: { backgroundColor: 'rgba(131,24,67,0.4)', borderColor: colors.accent.pink700 },
  reactionEmoji: { fontSize: 12 },
  reactionCount: { fontSize: 12, color: colors.text.gray400 },
  actions: { flexDirection: 'row', gap: 4, marginTop: 4 },
  actionBtn: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg.gray800, borderRadius: 4 },
  deleteText: { fontSize: 12 },
  reactionPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4, alignItems: 'center' },
  reactionPickBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  reactionPickEmoji: { fontSize: 18 },
  closePick: { color: colors.text.gray500, fontSize: 12, marginLeft: 8 },
})
