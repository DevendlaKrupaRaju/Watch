'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DoorOpen, Lock, Hash } from 'lucide-react'
import { FormField } from '@/components/ui/form-field'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export function JoinRoomForm() {
  const router = useRouter()
  const [roomCode, setRoomCode] = useState('')
  const [password, setPassword] = useState('')
  const [needsPassword, setNeedsPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!roomCode.trim()) {
      setError('Please enter a room code')
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch(`/api/rooms/${roomCode.trim().toUpperCase()}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.requiresPassword) {
          setNeedsPassword(true)
          setError(data.error)
        } else {
          setError(data.error || 'Failed to join room')
        }
        return
      }

      router.push(`/room/${data.data.roomCode}`)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-teal-500/20">
            <DoorOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
            Join a Room
          </h1>
          <p className="text-gray-400 mt-2">Enter a room code to join a watch party</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <FormField
            label="Room Code"
            value={roomCode}
            onChange={(e) => {
              setRoomCode(e.target.value.toUpperCase())
              if (error) setError('')
            }}
            placeholder="Enter room code (e.g. K7X9P2)"
            icon={<Hash size={18} />}
            disabled={isLoading}
          />

          {needsPassword && (
            <FormField
              label="Room Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter room password"
              icon={<Lock size={18} />}
              disabled={isLoading}
            />
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-teal-500/25"
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" />
                Joining...
              </>
            ) : (
              'Join Room'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
