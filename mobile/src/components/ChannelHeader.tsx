import React, { useState } from 'react'
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet } from 'react-native'
import { Channel, Message } from '../lib/api'
import { getUserName } from '../lib/users'
import { colors } from '../theme'

interface Props {
  channel: Channel
  onBack?: () => void
  onToggleMembers: () => void
  showingMembers: boolean
  searchQuery: string
  onSearchChange: (q: string) => void
  pinnedMessages: Message[]
}

export function ChannelHeader({ channel, onBack, onToggleMembers, showingMembers, searchQuery, onSearchChange, pinnedMessages }: Props) {
  const [showSearch, setShowSearch] = useState(false)
  const [showPinned, setShowPinned] = useState(false)

  return (
    <View style={s.container}>
      <View style={s.row}>
        {onBack && (
          <TouchableOpacity style={s.backBtn} onPress={onBack}>
            <Text style={s.backText}>←</Text>
          </TouchableOpacity>
        )}
        <View style={s.titleWrap}>
          <Text style={s.prefix}>{channel.type === 'direct' ? '@' : '#'}</Text>
          <Text style={s.title} numberOfLines={1}>{channel.name || 'Direct'}</Text>
        </View>
        <View style={s.actions}>
          <TouchableOpacity
            style={[s.iconBtn, showSearch && s.iconBtnActive]}
            onPress={() => { setShowSearch(!showSearch); if (showSearch) onSearchChange('') }}
          >
            <Text>🔍</Text>
          </TouchableOpacity>
          <View>
            <TouchableOpacity
              style={[s.iconBtn, showPinned && s.iconBtnActive]}
              onPress={() => setShowPinned(!showPinned)}
            >
              <Text>📌</Text>
            </TouchableOpacity>
            {pinnedMessages.length > 0 && (
              <View style={s.badge}>
                <Text style={s.badgeText}>{pinnedMessages.length}</Text>
              </View>
            )}
          </View>
          <Text style={s.memberCount}>{channel.member_count}</Text>
          <TouchableOpacity
            style={[s.membersBtn, showingMembers && s.membersBtnActive]}
            onPress={onToggleMembers}
          >
            <Text style={[s.membersBtnText, showingMembers && s.membersBtnTextActive]}>Members</Text>
          </TouchableOpacity>
        </View>
      </View>

      {showSearch && (
        <View style={s.searchWrap}>
          <TextInput
            style={s.searchInput}
            value={searchQuery}
            onChangeText={onSearchChange}
            placeholder="Search messages…"
            placeholderTextColor={colors.text.gray500}
          />
        </View>
      )}

      {showPinned && pinnedMessages.length > 0 && (
        <ScrollView style={s.pinnedList} nestedScrollEnabled>
          {pinnedMessages.map(m => (
            <View key={m.message_id} style={s.pinnedItem}>
              <View style={s.pinnedRow}>
                <Text style={s.pinnedSender}>{getUserName(m.sender_id)}</Text>
                <Text style={s.pinnedDate}>{new Date(m.created_at).toLocaleDateString()}</Text>
              </View>
              <Text style={s.pinnedContent} numberOfLines={1}>{m.content}</Text>
            </View>
          ))}
        </ScrollView>
      )}
      {showPinned && pinnedMessages.length === 0 && (
        <Text style={s.noPinned}>No pinned messages</Text>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.gray800,
    backgroundColor: 'rgba(17,24,39,0.5)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: 16,
  },
  backBtn: { padding: 8, marginRight: 8 },
  backText: { fontSize: 24, color: colors.text.gray400 },
  titleWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', minWidth: 0 },
  prefix: { fontSize: 18, color: colors.text.gray400 },
  title: { fontSize: 16, fontWeight: '600', color: colors.text.white },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: { padding: 6 },
  iconBtnActive: { backgroundColor: 'rgba(131,24,67,0.4)' },
  badge: {
    position: 'absolute' as const,
    top: -2,
    right: -2,
    backgroundColor: colors.accent.pink600,
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 9, fontWeight: 'bold', color: colors.text.white },
  memberCount: { fontSize: 12, color: colors.text.gray500 },
  membersBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: colors.bg.gray800,
  },
  membersBtnActive: { backgroundColor: colors.accent.pink600 },
  membersBtnText: { fontSize: 12, fontWeight: '500', color: colors.text.gray400 },
  membersBtnTextActive: { color: colors.text.white },
  searchWrap: { paddingHorizontal: 16, paddingBottom: 8 },
  searchInput: {
    backgroundColor: colors.bg.gray800,
    borderWidth: 1,
    borderColor: colors.border.gray700,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 14,
    color: colors.text.white,
  },
  pinnedList: { maxHeight: 120, paddingHorizontal: 16, paddingBottom: 8 },
  pinnedItem: {
    padding: 12,
    backgroundColor: 'rgba(31,41,55,0.6)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.gray700,
    marginBottom: 4,
  },
  pinnedRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pinnedSender: { fontSize: 12, fontWeight: '600', color: colors.text.pink400 },
  pinnedDate: { fontSize: 10, color: colors.text.gray600 },
  pinnedContent: { fontSize: 12, color: colors.text.gray300, marginTop: 4 },
  noPinned: { fontSize: 12, color: colors.text.gray500, textAlign: 'center', padding: 12 },
})
