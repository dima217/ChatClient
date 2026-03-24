import { useState, useRef, KeyboardEvent } from 'react'
import { Message } from '../lib/api'
import { USERS, KnownUser } from '../lib/users'
import { getUserName } from '../lib/users'

const EMOJI_GROUPS: Record<string, string[]> = {
  'Smileys': ['😀', '😂', '🥲', '😊', '😍', '🤔', '😤', '🥺', '😱', '🤯', '😴', '🤮'],
  'Gestures': ['👍', '👎', '👏', '🙌', '🤝', '✌️', '🤞', '💪', '🫡', '🫶'],
  'Hearts': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '💔', '❤️‍🔥', '💯'],
  'Objects': ['🔥', '⭐', '🎉', '🎊', '💡', '📌', '🏆', '🎯', '🚀', '💎'],
  'Animals': ['🐱', '🐶', '🦊', '🐻', '🐼', '🦁', '🐸', '🦄', '🐝', '🦋'],
}

interface Props {
  onSend: (content: string, mentions?: string[]) => void
  onTyping: (isTyping: boolean) => void
  currentUserId: string
  replyTo: Message | null
  onCancelReply: () => void
}

export function MessageInput({ onSend, onTyping, currentUserId, replyTo, onCancelReply }: Props) {
  const [text, setText] = useState('')
  const typingRef = useRef(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const [mentionIndex, setMentionIndex] = useState(0)
  const [mentionStartPos, setMentionStartPos] = useState(0)
  const [showEmoji, setShowEmoji] = useState(false)

  const otherUsers = USERS.filter(u => u.sub !== currentUserId)
  const filteredUsers = mentionQuery !== null
    ? otherUsers.filter(u =>
        u.name.toLowerCase().includes(mentionQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(mentionQuery.toLowerCase())
      )
    : []

  const parseMentions = (content: string): string[] => {
    const mentioned: string[] = []
    for (const user of USERS) {
      const firstName = user.name.split(' ')[0]
      if (content.includes(`@${user.name}`) || content.includes(`@${firstName}`)) {
        mentioned.push(user.sub)
      }
    }
    return mentioned
  }

  const handleSend = () => {
    if (!text.trim()) return
    const mentions = parseMentions(text)
    onSend(text, mentions.length > 0 ? mentions : undefined)
    setText('')
    setMentionQuery(null)
    setShowEmoji(false)
    onTyping(false)
    typingRef.current = false
  }

  const insertMention = (user: KnownUser) => {
    const before = text.slice(0, mentionStartPos)
    const after = text.slice(textareaRef.current?.selectionStart || mentionStartPos)
    const firstName = user.name.split(' ')[0]
    const newText = `${before}@${firstName} ${after}`
    setText(newText)
    setMentionQuery(null)
    setTimeout(() => {
      const pos = before.length + firstName.length + 2
      textareaRef.current?.setSelectionRange(pos, pos)
      textareaRef.current?.focus()
    }, 0)
  }

  const insertEmoji = (emoji: string) => {
    const pos = textareaRef.current?.selectionStart || text.length
    const newText = text.slice(0, pos) + emoji + text.slice(pos)
    setText(newText)
    setTimeout(() => {
      const newPos = pos + emoji.length
      textareaRef.current?.setSelectionRange(newPos, newPos)
      textareaRef.current?.focus()
    }, 0)
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (mentionQuery !== null && filteredUsers.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setMentionIndex(i => Math.min(i + 1, filteredUsers.length - 1)); return }
      if (e.key === 'ArrowUp') { e.preventDefault(); setMentionIndex(i => Math.max(i - 1, 0)); return }
      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); insertMention(filteredUsers[mentionIndex]); return }
      if (e.key === 'Escape') { e.preventDefault(); setMentionQuery(null); return }
    }
    if (e.key === 'Escape' && replyTo) { e.preventDefault(); onCancelReply(); return }
    if (e.key === 'Escape' && showEmoji) { e.preventDefault(); setShowEmoji(false); return }
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const handleChange = (value: string) => {
    setText(value)
    if (value && !typingRef.current) { typingRef.current = true; onTyping(true) }
    else if (!value && typingRef.current) { typingRef.current = false; onTyping(false) }

    const pos = textareaRef.current?.selectionStart || value.length
    const textBefore = value.slice(0, pos)
    const atMatch = textBefore.match(/@(\w*)$/)
    if (atMatch) { setMentionQuery(atMatch[1]); setMentionStartPos(pos - atMatch[0].length); setMentionIndex(0) }
    else { setMentionQuery(null) }
  }

  return (
    <div className="border-t border-gray-800 p-3 bg-gray-900/30 flex-shrink-0 relative">
      {/* Reply bar */}
      {replyTo && (
        <div className="flex items-center gap-2 mb-2 px-1 py-1.5 bg-gray-800/60 rounded-lg border-l-2 border-pink-500">
          <span className="text-[11px] text-gray-400 flex-1 truncate">
            Replying to <span className="font-medium text-gray-300">{getUserName(replyTo.sender_id)}</span>
            <span className="text-gray-500 ml-1">{replyTo.content.slice(0, 80)}{replyTo.content.length > 80 ? '…' : ''}</span>
          </span>
          <button onClick={onCancelReply} className="text-gray-500 hover:text-gray-300 text-xs px-1">✕</button>
        </div>
      )}

      {/* @mention dropdown */}
      {mentionQuery !== null && filteredUsers.length > 0 && (
        <div className="absolute bottom-full left-3 right-3 mb-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden z-30">
          {filteredUsers.map((u, i) => (
            <button key={u.sub} onClick={() => insertMention(u)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${i === mentionIndex ? 'bg-pink-900/40' : 'hover:bg-gray-700'}`}>
              <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0">{u.name.charAt(0)}</div>
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{u.name}</div>
                <div className="text-[10px] text-gray-500 truncate">{u.email}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Emoji picker */}
      {showEmoji && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setShowEmoji(false)} />
          <div className="absolute bottom-full right-3 mb-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-30 p-2 w-72 max-h-64 overflow-y-auto">
            {Object.entries(EMOJI_GROUPS).map(([group, emojis]) => (
              <div key={group} className="mb-2">
                <div className="text-[10px] text-gray-500 font-medium mb-1 uppercase tracking-wider">{group}</div>
                <div className="flex flex-wrap gap-0.5">
                  {emojis.map(emoji => (
                    <button key={emoji} onClick={() => insertEmoji(emoji)}
                      className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-700 text-base transition-colors">{emoji}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="flex items-end gap-2">
        <button onClick={() => setShowEmoji(!showEmoji)}
          className={`h-[42px] w-[42px] flex items-center justify-center rounded-lg text-lg transition-colors flex-shrink-0 ${showEmoji ? 'bg-pink-900/40 text-pink-400' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'}`}
          title="Emoji">😊</button>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={replyTo ? 'Type your reply…' : 'Type a message… @ to mention'}
          rows={1}
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 max-h-32"
          style={{ minHeight: '42px' }}
          onInput={(e) => {
            const el = e.target as HTMLTextAreaElement
            el.style.height = 'auto'
            el.style.height = Math.min(el.scrollHeight, 128) + 'px'
          }}
        />
        <button onClick={handleSend} disabled={!text.trim()}
          className="h-[42px] px-4 bg-pink-600 hover:bg-pink-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium rounded-lg text-sm transition-colors flex-shrink-0">
          Send
        </button>
      </div>
    </div>
  )
}
