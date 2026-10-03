'use client'

import { useState } from 'react'
import { Settings, X, Lock, Unlock, Users, AlertTriangle, Save } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface RoomSettingsProps {
  roomCode: string
  initialName: string
  initialDescription?: string | null
  initialMaxParticipants: number
  isLocked: boolean
  isOpen: boolean
  onClose: () => void
  onUpdate: (data: { name: string; description: string; maxParticipants: number }) => Promise<void>
  onToggleLock: () => void
  onEndRoom: () => void
}

export function RoomSettings({
  roomCode,
  initialName,
  initialDescription = '',
  initialMaxParticipants,
  isLocked,
  isOpen,
  onClose,
  onUpdate,
  onToggleLock,
  onEndRoom,
}: RoomSettingsProps) {
  const [name, setName] = useState(initialName)
  const [description, setDescription] = useState(initialDescription || '')
  const [maxParticipants, setMaxParticipants] = useState(initialMaxParticipants)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  if (!isOpen) return null

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!name.trim()) {
      setError('Room name is required')
      return
    }
    setIsSaving(true)
    try {
      await onUpdate({ name, description, maxParticipants })
      setSuccess('Settings saved!')
      setTimeout(() => setSuccess(''), 2000)
    } catch {
      setError('Failed to update room settings')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-indigo-500/20 border border-indigo-500/30 rounded-xl flex items-center justify-center text-indigo-400">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Room Settings</h3>
            <p className="text-gray-400 text-xs">Manage host controls and permissions</p>
          </div>
        </div>

        {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">{error}</div>}
        {success && <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-xs">{success}</div>}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-300 block mb-1">Room Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-100 focus:border-purple-500 focus:outline-none"
              placeholder="Room Name"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-300 block mb-1">Description (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-100 focus:border-purple-500 focus:outline-none resize-none"
              placeholder="What are you watching?"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-300 block mb-1">Max Participants (2–50)</label>
            <input
              type="number"
              min={2}
              max={50}
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(Number(e.target.value))}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-100 focus:border-purple-500 focus:outline-none"
            />
          </div>

          {/* Quick Lock Toggle */}
          <div className="flex items-center justify-between p-3 bg-gray-800/50 border border-gray-700/60 rounded-xl">
            <div className="flex items-center gap-3">
              {isLocked ? <Lock className="w-5 h-5 text-yellow-400" /> : <Unlock className="w-5 h-5 text-gray-400" />}
              <div>
                <p className="text-sm font-medium text-white">{isLocked ? 'Room is Locked' : 'Room is Unlocked'}</p>
                <p className="text-xs text-gray-400">{isLocked ? 'New users cannot join' : 'Anyone with the link can join'}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onToggleLock}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isLocked ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
              }`}
            >
              {isLocked ? 'Unlock' : 'Lock Room'}
            </button>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-purple-900/30"
            >
              {isSaving ? <><LoadingSpinner size="sm" /> Saving...</> : <><Save className="w-4 h-4" /> Save Changes</>}
            </button>
          </div>
        </form>

        {/* Danger Zone */}
        <div className="mt-6 pt-4 border-t border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-red-400">End Room</p>
              <p className="text-xs text-gray-500">Close the watch party and disconnect members</p>
            </div>
            <button
              type="button"
              onClick={onEndRoom}
              className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 rounded-lg text-xs font-medium transition-colors"
            >
              End Room
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
