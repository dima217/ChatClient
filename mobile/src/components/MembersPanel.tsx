import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native'
import { api } from '../lib/api'
import { USERS, getUserName } from '../lib/users'
import { colors } from '../theme'

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
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : 'Failed')
    }
    setShowAddPicker(false)
  }

  const handleLeave = () => {
    Alert.alert('Leave Channel', 'Leave this channel?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.removeMember(channelId)
            onRefresh()
            onClose()
          } catch (e: unknown) {
            setMessage(e instanceof Error ? e.message : 'Failed')
          }
        },
      },
    ])
  }

  const memberIds = new Set(members.map(m => m.user_id))
  const nonMembers = USERS.filter(u => !memberIds.has(u.sub))

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Members ({members.length})</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.close}>×</Text>
        </TouchableOpacity>
      </View>

      <View style={s.section}>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowAddPicker(!showAddPicker)}>
          <Text style={s.addBtnText}>+ Add Member</Text>
        </TouchableOpacity>
        {showAddPicker && (
          <ScrollView style={s.picker}>
            {nonMembers.length === 0 ? (
              <Text style={s.empty}>Everyone is already a member</Text>
            ) : (
              nonMembers.map(u => (
                <TouchableOpacity key={u.sub} style={s.pickerItem} onPress={() => handleAdd(u.sub)}>
                  <View style={s.pickerAvatar}>
                    <Text style={s.pickerAvatarText}>{u.name.charAt(0)}</Text>
                  </View>
                  <View>
                    <Text style={s.pickerName}>{u.name}</Text>
                    <Text style={s.pickerEmail} numberOfLines={1}>{u.email}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        )}
        {message ? <Text style={s.message}>{message}</Text> : null}
      </View>

      <ScrollView style={s.list}>
        {loading ? (
          <Text style={s.loading}>Loading...</Text>
        ) : (
          members.map(m => {
            const known = USERS.find(u => u.sub === m.user_id)
            const isMe = m.user_id === currentUserId
            return (
              <View key={m.user_id} style={s.member}>
                <View style={[s.memberAvatar, isMe && s.memberAvatarMe]}>
                  <Text style={s.memberAvatarText}>
                    {m.member_type === 'bot' ? '🤖' : (known?.name || m.user_id).charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={s.memberInfo}>
                  <Text style={s.memberName}>{known?.name || m.user_id.slice(0, 8)}{isMe ? ' (you)' : ''}</Text>
                  {known ? <Text style={s.memberEmail} numberOfLines={1}>{known.email}</Text> : null}
                </View>
                {m.role === 'owner' ? <Text style={s.owner}>owner</Text> : null}
              </View>
            )
          })
        )}
      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity style={s.leaveBtn} onPress={handleLeave}>
          <Text style={s.leaveText}>Leave Channel</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    width: 260,
    borderLeftWidth: 1,
    borderLeftColor: colors.border.gray800,
    backgroundColor: 'rgba(17,24,39,0.5)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.gray800,
  },
  title: { fontSize: 14, fontWeight: '600', color: colors.text.gray300 },
  close: { fontSize: 24, color: colors.text.gray400 },
  section: { padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border.gray800 },
  addBtn: {
    paddingVertical: 8,
    backgroundColor: colors.bg.gray800,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.gray700,
    alignItems: 'center',
  },
  addBtnText: { fontSize: 12, fontWeight: '500', color: colors.text.gray300 },
  picker: { marginTop: 8, maxHeight: 120 },
  pickerItem: { flexDirection: 'row', alignItems: 'center', padding: 6, borderRadius: 4 },
  pickerAvatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.accent.blue600, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  pickerAvatarText: { fontSize: 10, fontWeight: 'bold', color: colors.text.white },
  pickerName: { fontSize: 12, fontWeight: '500', color: colors.text.white },
  pickerEmail: { fontSize: 10, color: colors.text.gray500 },
  empty: { fontSize: 11, color: colors.text.gray500, padding: 4, textAlign: 'center' },
  message: { fontSize: 11, color: colors.text.gray400, marginTop: 6 },
  list: { flex: 1, padding: 12 },
  loading: { fontSize: 12, color: colors.text.gray500, textAlign: 'center', padding: 16 },
  member: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  memberAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.accent.blue600, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  memberAvatarMe: { backgroundColor: colors.accent.pink600 },
  memberAvatarText: { fontSize: 10, fontWeight: 'bold', color: colors.text.white },
  memberInfo: { flex: 1, minWidth: 0 },
  memberName: { fontSize: 12, fontWeight: '500', color: colors.text.white },
  memberEmail: { fontSize: 10, color: colors.text.gray500 },
  owner: { fontSize: 9, color: colors.text.yellow500 },
  footer: { padding: 12, borderTopWidth: 1, borderTopColor: colors.border.gray800 },
  leaveBtn: {
    paddingVertical: 8,
    backgroundColor: 'rgba(127,29,29,0.4)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#7f1d1d',
    alignItems: 'center',
  },
  leaveText: { fontSize: 12, fontWeight: '500', color: colors.text.red400 },
})
