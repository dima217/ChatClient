import { getUserName } from '../lib/users'

interface Props {
  userIds: string[]
}

export function TypingIndicator({ userIds }: Props) {
  if (userIds.length === 0) return null

  const names = userIds.map(id => getUserName(id)).join(', ')

  return (
    <div className="flex items-center gap-2 pl-8 py-1 text-xs text-gray-500">
      <div className="flex gap-0.5">
        <span className="typing-dot w-1 h-1 bg-gray-500 rounded-full" />
        <span className="typing-dot w-1 h-1 bg-gray-500 rounded-full" />
        <span className="typing-dot w-1 h-1 bg-gray-500 rounded-full" />
      </div>
      <span>{names} {userIds.length === 1 ? 'is' : 'are'} typing</span>
    </div>
  )
}
