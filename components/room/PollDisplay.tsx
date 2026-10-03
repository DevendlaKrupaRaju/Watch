'use client'

import { useState, useEffect } from 'react'
import { BarChart3, Check } from 'lucide-react'
import type { Socket } from 'socket.io-client'

interface PollOption {
  id: number
  text: string
}

interface PollData {
  id: string
  question: string
  options: PollOption[]
  isActive: boolean
  userId: string
  votes: { optionId: number; userId: string }[]
  createdAt: string
}

interface PollDisplayProps {
  roomCode: string
  socket: Socket | null
  currentUserId: string
  isHost: boolean
}

export function PollDisplay({ roomCode, socket, currentUserId, isHost }: PollDisplayProps) {
  const [polls, setPolls] = useState<PollData[]>([])

  useEffect(() => {
    async function loadPolls() {
      try {
        const res = await fetch(`/api/rooms/${roomCode}/polls`)
        const data = await res.json()
        if (data.success) setPolls(data.data)
      } catch (err) {
        console.error('Failed to load polls:', err)
      }
    }
    loadPolls()
  }, [roomCode])

  useEffect(() => {
    if (!socket) return

    const handleNewPoll = (data: { poll: PollData }) => {
      setPolls((prev) => [data.poll, ...prev])
    }

    const handleVote = (data: { pollId: string; optionId: number; userId: string }) => {
      setPolls((prev) =>
        prev.map((p) =>
          p.id === data.pollId
            ? { ...p, votes: [...p.votes.filter((v) => v.userId !== data.userId), { optionId: data.optionId, userId: data.userId }] }
            : p
        )
      )
    }

    const handlePollClosed = (data: { pollId: string }) => {
      setPolls((prev) => prev.map((p) => p.id === data.pollId ? { ...p, isActive: false } : p))
    }

    socket.on('poll:created', handleNewPoll)
    socket.on('poll:voted', handleVote)
    socket.on('poll:closed', handlePollClosed)

    return () => {
      socket.off('poll:created', handleNewPoll)
      socket.off('poll:voted', handleVote)
      socket.off('poll:closed', handlePollClosed)
    }
  }, [socket])

  const vote = async (pollId: string, optionId: number) => {
    try {
      await fetch(`/api/rooms/${roomCode}/polls`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pollId, optionId }),
      })
    } catch (err) {
      console.error('Vote error:', err)
    }
  }

  const closePoll = async (pollId: string) => {
    try {
      await fetch(`/api/rooms/${roomCode}/polls`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pollId }),
      })
    } catch (err) {
      console.error('Close poll error:', err)
    }
  }

  if (polls.length === 0) return null

  return (
    <div className="space-y-3">
      {polls.filter((p) => p.isActive).map((poll) => {
        const totalVotes = poll.votes.length
        const myVote = poll.votes.find((v) => v.userId === currentUserId)

        return (
          <div key={poll.id} className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-purple-400" />
                <h4 className="text-sm font-semibold text-white">{poll.question}</h4>
              </div>
              {(isHost || poll.userId === currentUserId) && (
                <button onClick={() => closePoll(poll.id)} className="text-xs text-gray-500 hover:text-red-400">Close</button>
              )}
            </div>

            <div className="space-y-2">
              {(poll.options as PollOption[]).map((opt) => {
                const voteCount = poll.votes.filter((v) => v.optionId === opt.id).length
                const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0
                const isVoted = myVote?.optionId === opt.id

                return (
                  <button
                    key={opt.id}
                    onClick={() => !myVote && vote(poll.id, opt.id)}
                    disabled={!!myVote}
                    className={`w-full text-left relative overflow-hidden rounded-lg border p-2.5 transition-colors ${
                      isVoted
                        ? 'border-purple-500/50 bg-purple-500/10'
                        : myVote
                        ? 'border-gray-700 bg-gray-800/30'
                        : 'border-gray-700 bg-gray-800/30 hover:border-gray-600 cursor-pointer'
                    }`}
                  >
                    <div
                      className="absolute inset-0 bg-purple-500/10"
                      style={{ width: `${percentage}%` }}
                    />
                    <div className="relative flex items-center justify-between">
                      <span className="text-sm text-gray-200 flex items-center gap-1.5">
                        {isVoted && <Check className="w-3.5 h-3.5 text-purple-400" />}
                        {opt.text}
                      </span>
                      <span className="text-xs text-gray-500">{voteCount} ({Math.round(percentage)}%)</span>
                    </div>
                  </button>
                )
              })}
            </div>

            <p className="text-xs text-gray-600 mt-2">{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</p>
          </div>
        )
      })}
    </div>
  )
}
