import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AuthUser } from '../lib/auth'
import { useChat } from '../hooks/useChat'
import { useWebSocket } from '../hooks/useWebSocket'
import { ChannelList } from '../components/ChannelList'
import { ChannelHeader } from '../components/ChannelHeader'
import { MessageList } from '../components/MessageList'
import { MessageInput } from '../components/MessageInput'
import { CreateChannelModal } from '../components/CreateChannelModal'
import { MembersPanel } from '../components/MembersPanel'
import { colors } from '../theme'
import { SafeAreaView } from 'react-native-safe-area-context'

interface Props {
  user: AuthUser
  onLogout: () => void
}

export function ChatScreen({ user, onLogout }: Props) {
  const insets = useSafeAreaInsets()
  const { status } = useWebSocket(true)
  const chat = useChat(user.sub)
  const [showCreateChannel, setShowCreateChannel] = useState(false)
  const [showMembers, setShowMembers] = useState(false)

  if (chat.activeChannel && chat.activeChannelId) {
    return (
      <View style={s.container}>
        <SafeAreaView style={s.chatArea} edges={['bottom', 'top']}>
          <ChannelHeader
            channel={chat.activeChannel}
            onBack={() => chat.setActiveChannelId(null)}
            onToggleMembers={() => setShowMembers(!showMembers)}
            showingMembers={showMembers}
            searchQuery={chat.searchQuery}
            onSearchChange={chat.setSearchQuery}
            pinnedMessages={chat.pinnedMessages}
          />
          <View style={s.chatRow}>
            <KeyboardAvoidingView
              style={s.messagesWrap}
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 56 : 0}
            >
              <MessageList
                channelId={chat.activeChannelId}
                messages={chat.messages}
                currentUserId={user.sub}
                loading={chat.loadingMessages}
                onReaction={chat.toggleReaction}
                onReply={chat.setReplyTo}
                onEdit={chat.editMessage}
                onDelete={chat.deleteMessage}
                onPin={chat.togglePin}
                onRead={chat.sendRead}
                typingUserIds={chat.typingUserIds}
                readReceipts={chat.readReceipts}
              />
              <MessageInput
                onSend={chat.sendMessage}
                onTyping={chat.sendTyping}
                replyTo={chat.replyTo}
                onCancelReply={() => chat.setReplyTo(null)}
              />
            </KeyboardAvoidingView>
            {showMembers && (
              <MembersPanel
                channelId={chat.activeChannel.channel_id}
                currentUserId={user.sub}
                onClose={() => setShowMembers(false)}
                onRefresh={chat.refreshChannels}
              />
            )}
          </View>
        </SafeAreaView>
        {showCreateChannel && (
          <CreateChannelModal
            currentUserId={user.sub}
            onClose={() => setShowCreateChannel(false)}
            onCreated={(channelId) => {
              setShowCreateChannel(false)
              chat.refreshChannels()
              chat.setActiveChannelId(channelId)
            }}
          />
        )}
      </View>
    )
  }

  return (
    <View style={s.container}>
      <SafeAreaView style={s.listArea} edges={['top']}>
        <View style={s.userBar}>
          <View style={s.userInfo}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={s.userMeta}>
              <Text style={s.userName} numberOfLines={1}>{user.name}</Text>
              <View style={s.statusRow}>
                <View
                  style={[
                    s.statusDot,
                    status === 'connected' ? s.statusOk : status === 'connecting' ? s.statusWarn : s.statusErr,
                  ]}
                />
                <Text style={s.statusLabel}>{status}</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity onPress={onLogout} style={s.logoutBtn}>
            <Text style={s.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
        <ChannelList
          channels={chat.channels}
          activeChannelId={chat.activeChannelId}
          onSelect={chat.setActiveChannelId}
          onCreateNew={() => setShowCreateChannel(true)}
          loading={chat.loadingChannels}
          unreadCounts={chat.unreadCounts}
        />
      </SafeAreaView>
      {showCreateChannel && (
        <CreateChannelModal
          currentUserId={user.sub}
          onClose={() => setShowCreateChannel(false)}
          onCreated={(channelId) => {
            setShowCreateChannel(false)
            chat.refreshChannels()
            chat.setActiveChannelId(channelId)
          }}
        />
      )}
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.gray950 },
  chatArea: { flex: 1, minHeight: 0 },
  listArea: { flex: 1, minHeight: 0 },
  chatRow: { flex: 1, flexDirection: 'row', minWidth: 0, minHeight: 0 },
  messagesWrap: { flex: 1, minWidth: 0, flexDirection: 'column' },
  userBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.gray800,
    backgroundColor: 'rgba(17,24,39,0.5)',
  },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent.pink600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 14, fontWeight: '600', color: colors.text.white },
  userMeta: { flex: 1, minWidth: 0 },
  userName: { fontSize: 14, fontWeight: '600', color: colors.text.white },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusOk: { backgroundColor: '#22c55e' },
  statusWarn: { backgroundColor: '#eab308' },
  statusErr: { backgroundColor: '#ef4444' },
  statusLabel: { fontSize: 10, color: colors.text.gray500 },
  logoutBtn: { padding: 8 },
  logoutText: { fontSize: 12, color: colors.text.gray500 },
})
