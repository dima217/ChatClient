import { useState, useRef, useEffect, JSX } from 'react'
import { Message } from '../lib/api'
import { getUserName, USERS } from '../lib/users'
import { ReactionPicker } from './ReactionPicker'

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
  allMessages: Message[]
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch { return '' }
}

/** Render message content with @mention highlights and link detection */
function renderContent(content: string) {
  const mentionNames = USERS.map(u => u.name.split(' ')[0])
  const mentionPattern = `@(${mentionNames.join('|')})\\b`
  const urlPattern = `(https?:\\/\\/[^\\s<]+)`
  const combined = new RegExp(`${urlPattern}|${mentionPattern}`, 'g')

  const parts: JSX.Element[] = []
  let key = 0
  let lastIdx = 0
  let match: RegExpExecArray | null

  while ((match = combined.exec(content)) !== null) {
    if (match.index > lastIdx) parts.push(<span key={key++}>{content.slice(lastIdx, match.index)}</span>)
    if (match[1]) {
      parts.push(
        <a key={key++} href={match[1]} target="_blank" rel="noopener noreferrer"
          className="text-blue-400 hover:underline break-all">{match[1]}</a>
      )
    } else {
      parts.push(
        <span key={key++} className="text-pink-400 bg-pink-900/30 px-0.5 rounded font-medium">{match[0]}</span>
      )
    }
    lastIdx = match.index + match[0].length
  }
  if (lastIdx < content.length) parts.push(<span key={key++}>{content.slice(lastIdx)}</span>)
  return parts.length > 0 ? <>{parts}</> : <span>{content}</span>
}

function isImageUrl(url: string) { return /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?.*)?$/i.test(url) }

function extractImageUrls(content: string): string[] {
  const urls = content.match(/https?:\/\/[^\s<]+/g) || []
  return urls.filter(isImageUrl)
}

function DeliveryStatus({ status, readBy }: { status?: Message['status']; readBy?: Set<string> }) {
  if (!status) return null
  const hasReaders = readBy && readBy.size > 0
  if (status === 'sending') return <span className="text-[10px] text-gray-600 ml-1" title="Sending">○</span>
  if (status === 'sent' && !hasReaders) return <span className="text-[10px] text-gray-500 ml-1" title="Sent">✓</span>
  if (status === 'read' || hasReaders) return <span className="text-[10px] text-blue-400 ml-1" title="Read">✓✓</span>
  return <span className="text-[10px] text-gray-500 ml-1" title="Delivered">✓✓</span>
}

export function MessageItem({ message, isOwn, showHeader, currentUserId, onReaction, onReply, onEdit, onDelete, onPin, readBy, allMessages }: Props) {
  const [showReactions, setShowReactions] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState('')
  const editRef = useRef<HTMLTextAreaElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const reactions = message.reactions || {}
  const hasReactions = Object.keys(reactions).length > 0
  const senderName = message.sender_type === 'system' ? 'System' : (isOwn ? 'You' : getUserName(message.sender_id))
  const isDeleted = !!message.deleted_at
  const isSystem = message.content_type === 'system' || message.sender_type === 'system'
  const imageUrls = isDeleted ? [] : extractImageUrls(message.content)
  const replyMsg = message.reply_to ? allMessages.find(m => m.message_id === message.reply_to) : null
  const threadCount = allMessages.filter(m => m.reply_to === message.message_id).length

  useEffect(() => {
    if (editing && editRef.current) {
      editRef.current.focus()
      editRef.current.selectionStart = editRef.current.value.length
    }
  }, [editing])

  useEffect(() => {
    if (!showMenu) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showMenu])

  const startEdit = () => { setEditText(message.content); setEditing(true); setShowMenu(false) }
  const saveEdit = () => {
    if (editText.trim() && editText.trim() !== message.content) onEdit(message.message_id, editText.trim())
    setEditing(false)
  }
  const cancelEdit = () => { setEditing(false); setEditText('') }

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <span className="text-xs text-gray-500 bg-gray-800/50 px-3 py-1 rounded-full">{message.content}</span>
      </div>
    )
  }

  return (
    <div className={`group ${showHeader ? 'mt-3' : 'mt-0.5'} relative`}
      onMouseLeave={() => { setShowReactions(false); setShowMenu(false) }}>
      {/* Reply context */}
      {replyMsg && !isDeleted && (
        <div className="pl-8 mb-0.5 flex items-center gap-1.5">
          <div className="w-4 border-l-2 border-t-2 border-gray-600 h-3 rounded-tl ml-2" />
          <span className="text-[11px] text-gray-500 truncate max-w-xs">
            <span className="font-medium text-gray-400">{getUserName(replyMsg.sender_id)}</span>
            {' '}{replyMsg.deleted_at ? '(deleted)' : replyMsg.content.slice(0, 60)}{!replyMsg.deleted_at && replyMsg.content.length > 60 ? '…' : ''}
          </span>
        </div>
      )}

      {showHeader && (
        <div className="flex items-center gap-2 mb-0.5">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${isOwn ? 'bg-pink-600' : 'bg-blue-600'}`}>
            {senderName.charAt(0).toUpperCase()}
          </div>
          <span className={`text-sm font-semibold ${isOwn ? 'text-pink-400' : 'text-blue-400'}`}>{senderName}</span>
          <span className="text-[10px] text-gray-600">{formatTime(message.created_at)}</span>
          {isOwn && <DeliveryStatus status={message.status} readBy={readBy} />}
          {message.pinned_at && <span className="text-[10px] text-yellow-500" title="Pinned">📌</span>}
        </div>
      )}

      <div className="pl-8 relative group">
        {isDeleted ? (
          <p className="text-sm text-gray-600 italic">Message deleted</p>
        ) : editing ? (
          <div className="flex flex-col gap-1">
            <textarea ref={editRef} value={editText} onChange={e => setEditText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEdit() } if (e.key === 'Escape') cancelEdit() }}
              className="bg-gray-800 border border-pink-600 rounded px-2 py-1.5 text-sm text-white resize-none focus:outline-none" rows={2} />
            <div className="flex gap-2 text-[10px]">
              <button onClick={saveEdit} className="text-pink-400 hover:text-pink-300">Save</button>
              <button onClick={cancelEdit} className="text-gray-500 hover:text-gray-400">Cancel</button>
              <span className="text-gray-600">Esc to cancel · Enter to save</span>
            </div>
          </div>
        ) : (
          <div className="flex items-baseline gap-1">
            <p className="text-sm text-gray-200 break-words whitespace-pre-wrap">{renderContent(message.content)}</p>
            {message.edited_at && <span className="text-[10px] text-gray-600" title={`Edited ${new Date(message.edited_at).toLocaleString()}`}>(edited)</span>}
            {isOwn && !showHeader && <DeliveryStatus status={message.status} readBy={readBy} />}
            {!showHeader && message.pinned_at && <span className="text-[10px] text-yellow-500">📌</span>}
          </div>
        )}

        {/* Inline image preview from URLs */}
        {imageUrls.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-1.5">
            {imageUrls.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                <img src={url} alt="" className="max-w-xs max-h-48 rounded-lg border border-gray-700 object-cover" loading="lazy"
                  onError={e => (e.currentTarget.style.display = 'none')} />
              </a>
            ))}
          </div>
        )}

        {/* Thread reply count */}
        {threadCount > 0 && (
          <div className="mt-1">
            <span className="text-[11px] text-blue-400">💬 {threadCount} {threadCount === 1 ? 'reply' : 'replies'}</span>
          </div>
        )}

        {hasReactions && !isDeleted && (
          <div className="flex flex-wrap gap-1 mt-1">
            {Object.entries(reactions).map(([emoji, users]) => (
              <button key={emoji} onClick={() => onReaction(message.message_id, emoji)}
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs border transition-colors ${
                  users.includes(currentUserId) ? 'bg-pink-900/40 border-pink-700 text-pink-300' : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                }`} title={users.map(u => getUserName(u)).join(', ')}>
                <span>{emoji}</span><span>{users.length}</span>
              </button>
            ))}
          </div>
        )}

        {/* Action toolbar on hover */}
        {!isDeleted && !editing && (
          <div className="absolute -top-2 right-0 hidden group-hover:flex items-center gap-0.5 bg-gray-800 border border-gray-700 rounded-md shadow-lg px-0.5 py-0.5 z-10">
            <button onClick={() => setShowReactions(!showReactions)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-700 text-gray-400 text-xs" title="React">😊</button>
            <button onClick={() => onReply(message)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-700 text-gray-400 text-xs" title="Reply">↩</button>
            <button onClick={() => onPin(message.message_id)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-700 text-gray-400 text-xs" title={message.pinned_at ? 'Unpin' : 'Pin'}>{message.pinned_at ? '📌' : '📍'}</button>
            <button onClick={() => setShowMenu(!showMenu)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-700 text-gray-400 text-xs" title="More">⋯</button>
          </div>
        )}

        {/* Context menu */}
        {showMenu && (
          <div ref={menuRef} className="absolute right-0 top-5 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-1 z-20 min-w-[140px]">
            {isOwn && <button onClick={startEdit} className="w-full text-left px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2">✏️ Edit</button>}
            {isOwn && <button onClick={() => { onDelete(message.message_id); setShowMenu(false) }} className="w-full text-left px-3 py-1.5 text-sm text-red-400 hover:bg-gray-700 flex items-center gap-2">🗑 Delete</button>}
            <button onClick={() => { navigator.clipboard.writeText(message.content); setShowMenu(false) }} className="w-full text-left px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2">📋 Copy text</button>
          </div>
        )}

        {showReactions && (
          <ReactionPicker onSelect={(emoji) => { onReaction(message.message_id, emoji); setShowReactions(false) }} onClose={() => setShowReactions(false)} />
        )}
      </div>
    </div>
  )
}
