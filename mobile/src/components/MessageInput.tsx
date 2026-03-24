import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native'
import { Message } from '../lib/api'
import { getUserName } from '../lib/users'
import { colors } from '../theme'

const EMOJI_GROUPS: Record<string, string[]> = {
  Smileys: ['😀', '😂', '🥲', '😊', '😍', '🤔'],
  Gestures: ['👍', '👎', '👏', '🙌', '🤝', '✌️'],
  Hearts: ['❤️', '🧡', '💛', '💚', '💙', '💜'],
}

interface Props {
  onSend: (content: string, mentions?: string[]) => void
  onTyping: (isTyping: boolean) => void
  replyTo: Message | null
  onCancelReply: () => void
}

export function MessageInput({ onSend, onTyping, replyTo, onCancelReply }: Props) {
  const [text, setText] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)

  const handleSend = () => {
    if (!text.trim()) return
    onSend(text.trim())
    setText('')
    setShowEmoji(false)
    onTyping(false)
  }

  const handleChange = (value: string) => {
    setText(value)
    onTyping(!!value.trim())
  }

  const insertEmoji = (emoji: string) => {
    setText(prev => prev + emoji)
  }

  return (
    <View>
      {replyTo && (
        <View style={s.replyBar}>
          <Text style={s.replyText} numberOfLines={1}>
            Replying to <Text style={s.replyName}>{getUserName(replyTo.sender_id)}</Text>
            {' '}{replyTo.content.slice(0, 60)}{replyTo.content.length > 60 ? '…' : ''}
          </Text>
          <TouchableOpacity onPress={onCancelReply} style={s.cancelReply}>
            <Text style={s.cancelReplyText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {showEmoji && (
        <View style={s.emojiPanel}>
          {Object.entries(EMOJI_GROUPS).map(([group, emojis]) => (
            <View key={group} style={s.emojiGroup}>
              <Text style={s.emojiGroupTitle}>{group}</Text>
              <View style={s.emojiRow}>
                {emojis.map(emoji => (
                  <TouchableOpacity key={emoji} style={s.emojiBtn} onPress={() => insertEmoji(emoji)}>
                    <Text style={s.emoji}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={s.row}>
        <TouchableOpacity
          style={[s.emojiToggle, showEmoji && s.emojiToggleActive]}
          onPress={() => setShowEmoji(!showEmoji)}
        >
          <Text style={s.emojiToggleText}>😊</Text>
        </TouchableOpacity>
        <TextInput
          style={s.input}
          value={text}
          onChangeText={handleChange}
          placeholder={replyTo ? 'Type your reply…' : 'Type a message…'}
          placeholderTextColor={colors.text.gray500}
          multiline
          maxLength={2000}
        />
        <TouchableOpacity
          style={[s.sendBtn, !text.trim() && s.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!text.trim()}
        >
          <Text style={[s.sendText, !text.trim() && s.sendTextDisabled]}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginBottom: 8,
    padding: 6,
    backgroundColor: 'rgba(31,41,55,0.6)',
    borderRadius: 8,
    borderLeftWidth: 2,
    borderLeftColor: colors.accent.pink500,
  },
  replyText: { flex: 1, fontSize: 11, color: colors.text.gray400 },
  replyName: { fontWeight: '500', color: colors.text.gray300 },
  cancelReply: { padding: 4 },
  cancelReplyText: { color: colors.text.gray500, fontSize: 12 },
  emojiPanel: {
    maxHeight: 180,
    padding: 8,
    backgroundColor: colors.bg.gray800,
    borderTopWidth: 1,
    borderTopColor: colors.border.gray700,
  },
  emojiGroup: { marginBottom: 8 },
  emojiGroupTitle: { fontSize: 10, color: colors.text.gray500, marginBottom: 4, textTransform: 'uppercase' },
  emojiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  emojiBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 18 },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border.gray800,
    backgroundColor: 'rgba(17,24,39,0.3)',
  },
  emojiToggle: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: colors.bg.gray800,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiToggleActive: { backgroundColor: 'rgba(131,24,67,0.4)' },
  emojiToggleText: { fontSize: 18 },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 120,
    backgroundColor: colors.bg.gray800,
    borderWidth: 1,
    borderColor: colors.border.gray700,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text.white,
  },
  sendBtn: {
    height: 42,
    paddingHorizontal: 16,
    backgroundColor: colors.accent.pink600,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: colors.bg.gray700 },
  sendText: { fontSize: 14, fontWeight: '500', color: colors.text.white },
  sendTextDisabled: { color: colors.text.gray500 },
})
