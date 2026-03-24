interface Props {
  onSelect: (emoji: string) => void
  onClose: () => void
}

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '🎉', '👀']

export function ReactionPicker({ onSelect, onClose }: Props) {
  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} />
      <div className="absolute left-8 -top-1 z-20 bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-1.5 flex gap-0.5">
        {EMOJIS.map(emoji => (
          <button
            key={emoji}
            onClick={() => onSelect(emoji)}
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-700 text-base transition-colors"
          >
            {emoji}
          </button>
        ))}
      </div>
    </>
  )
}
