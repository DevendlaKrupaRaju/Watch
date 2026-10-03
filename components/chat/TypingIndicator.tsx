'use client'

interface TypingIndicatorProps {
  typingUsers: { userId: string; username: string }[]
}

export function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
  if (typingUsers.length === 0) return null

  const names = typingUsers.map((u) => u.username)
  let text: string
  if (names.length === 1) {
    text = `${names[0]} is typing`
  } else if (names.length === 2) {
    text = `${names[0]} and ${names[1]} are typing`
  } else {
    text = `${names[0]} and ${names.length - 1} others are typing`
  }

  return (
    <div className="px-4 py-1 text-xs text-gray-500">
      <span className="inline-flex items-center gap-1">
        <span className="flex gap-0.5">
          <span className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </span>
        {text}
      </span>
    </div>
  )
}
