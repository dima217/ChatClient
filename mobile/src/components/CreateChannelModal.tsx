import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, Modal, ScrollView, StyleSheet } from 'react-native'
import { api } from '../lib/api'
import { USERS } from '../lib/users'
import { colors } from '../theme'

interface Props {
  currentUserId: string
  onClose: () => void
  onCreated: (channelId: string) => void
}

export function CreateChannelModal({ currentUserId, onClose, onCreated }: Props) {
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
        if (type === 'direct') next.clear()
        next.add(sub)
      }
      return next
    })
  }

  const handleSubmit = async () => {
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
      onClose()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal visible transparent animationType="fade">
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose} />
      <View style={s.modal}>
        <View style={s.content}>
          <View style={s.header}>
            <Text style={s.title}>Create Channel</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={s.close}>×</Text>
            </TouchableOpacity>
          </View>

          <View style={s.tabs}>
            <TouchableOpacity
              style={[s.tab, type === 'group' && s.tabActive]}
              onPress={() => { setType('group'); setSelectedIds(new Set()) }}
            >
              <Text style={[s.tabText, type === 'group' && s.tabTextActive]}>Group</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.tab, type === 'direct' && s.tabActive]}
              onPress={() => { setType('direct'); setSelectedIds(new Set()) }}
            >
              <Text style={[s.tabText, type === 'direct' && s.tabTextActive]}>Direct</Text>
            </TouchableOpacity>
          </View>

          {type === 'group' && (
            <View style={s.field}>
              <Text style={s.label}>Channel Name</Text>
              <TextInput
                style={s.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Project Chat"
                placeholderTextColor={colors.text.gray500}
              />
            </View>
          )}

          <View style={s.field}>
            <Text style={s.label}>{type === 'direct' ? 'Select user' : 'Select members'}</Text>
            <ScrollView style={s.userList}>
              {otherUsers.map(u => (
                <TouchableOpacity
                  key={u.sub}
                  style={[s.user, selectedIds.has(u.sub) && s.userSelected]}
                  onPress={() => toggleUser(u.sub)}
                >
                  <View style={[s.userAvatar, selectedIds.has(u.sub) && s.userAvatarSelected]}>
                    <Text style={s.userAvatarText}>{u.name.charAt(0)}</Text>
                  </View>
                  <View style={s.userInfo}>
                    <Text style={s.userName}>{u.name}</Text>
                    <Text style={s.userEmail} numberOfLines={1}>{u.email}</Text>
                  </View>
                  {selectedIds.has(u.sub) && <Text style={s.check}>✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {error ? (
            <View style={s.error}>
              <Text style={s.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={s.buttons}>
            <TouchableOpacity style={s.cancelBtn} onPress={onClose}>
              <Text style={s.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.submitBtn, (loading || selectedIds.size === 0) && s.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={loading || selectedIds.size === 0}
            >
              <Text style={[s.submitText, (loading || selectedIds.size === 0) && s.submitTextDisabled]}>
                {loading ? 'Creating...' : 'Create'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  modal: { flex: 1, justifyContent: 'center', padding: 16 },
  content: {
    backgroundColor: colors.bg.gray900,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.gray700,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.gray800,
  },
  title: { fontSize: 18, fontWeight: '600', color: colors.text.white },
  close: { fontSize: 28, color: colors.text.gray400 },
  tabs: { flexDirection: 'row', gap: 8, margin: 20, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.bg.gray800, alignItems: 'center' },
  tabActive: { backgroundColor: colors.accent.pink600 },
  tabText: { fontSize: 14, fontWeight: '500', color: colors.text.gray400 },
  tabTextActive: { color: colors.text.white },
  field: { marginHorizontal: 20, marginBottom: 16 },
  label: { fontSize: 14, color: colors.text.gray400, marginBottom: 8 },
  input: {
    backgroundColor: colors.bg.gray800,
    borderWidth: 1,
    borderColor: colors.border.gray700,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text.white,
  },
  userList: { maxHeight: 200 },
  user: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    backgroundColor: colors.bg.gray800,
    borderWidth: 1,
    borderColor: colors.border.gray700,
    marginBottom: 4,
  },
  userSelected: { backgroundColor: 'rgba(131,24,67,0.4)', borderColor: colors.accent.pink700 },
  userAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.bg.gray700, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  userAvatarSelected: { backgroundColor: colors.accent.pink600 },
  userAvatarText: { fontSize: 12, fontWeight: 'bold', color: colors.text.white },
  userInfo: { flex: 1, minWidth: 0 },
  userName: { fontSize: 14, fontWeight: '500', color: colors.text.white },
  userEmail: { fontSize: 12, color: colors.text.gray500 },
  check: { color: colors.text.pink400, fontSize: 14 },
  error: { marginHorizontal: 20, marginBottom: 16, padding: 12, backgroundColor: 'rgba(127,29,29,0.3)', borderRadius: 8, borderWidth: 1, borderColor: '#7f1d1d' },
  errorText: { fontSize: 14, color: colors.text.red400 },
  buttons: { flexDirection: 'row', gap: 8, margin: 20, marginTop: 0 },
  cancelBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: colors.bg.gray800, alignItems: 'center' },
  cancelText: { fontSize: 14, fontWeight: '500', color: colors.text.gray300 },
  submitBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: colors.accent.pink600, alignItems: 'center' },
  submitBtnDisabled: { backgroundColor: colors.bg.gray700 },
  submitText: { fontSize: 14, fontWeight: '500', color: colors.text.white },
  submitTextDisabled: { color: colors.text.gray500 },
})
