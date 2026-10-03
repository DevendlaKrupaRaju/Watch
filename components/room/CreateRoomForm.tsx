'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Tv, Lock, Users } from 'lucide-react'
import { FormField } from '@/components/ui/form-field'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { createRoomSchema, type CreateRoomInput } from '@/lib/validation/room-schemas'

export function CreateRoomForm() {
  const router = useRouter()
  const [formData, setFormData] = useState<CreateRoomInput>({
    name: '',
    description: '',
    isPrivate: false,
    password: '',
    maxParticipants: 10,
    theme: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [globalError, setGlobalError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value) || 2 : value,
    }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
    if (globalError) setGlobalError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setGlobalError('')

    const parsed = createRoomSchema.safeParse(formData)
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {}
      parsed.error.issues.forEach((err) => {
        const field = String(err.path[0])
        if (!fieldErrors[field]) fieldErrors[field] = err.message
      })
      setErrors(fieldErrors)
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        setGlobalError(data.error || 'Failed to create room')
        return
      }

      router.push(`/room/${data.data.roomCode}`)
    } catch {
      setGlobalError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/20">
            <Tv className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
            Create a Room
          </h1>
          <p className="text-gray-400 mt-2">Set up your virtual hangout space</p>
        </div>

        {globalError && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
            {globalError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <FormField
            label="Room Name"
            name="name"
            placeholder="Movie Night 🎬"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            icon={<Tv size={18} />}
            disabled={isLoading}
          />

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-200">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="What's this room about?"
              rows={3}
              className="flex w-full rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-3 text-sm text-gray-100 placeholder:text-gray-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-colors resize-none"
              disabled={isLoading}
            />
            {errors.description && <p className="text-sm text-red-400">{errors.description}</p>}
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg border border-gray-700">
            <div className="flex items-center gap-3">
              <Lock size={18} className="text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-200">Private Room</p>
                <p className="text-xs text-gray-500">Require a password to join</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="isPrivate"
                checked={formData.isPrivate}
                onChange={handleChange}
                className="sr-only peer"
                disabled={isLoading}
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:ring-2 peer-focus:ring-purple-500/20 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600" />
            </label>
          </div>

          {formData.isPrivate && (
            <FormField
              label="Room Password"
              name="password"
              type="password"
              placeholder="Enter room password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              icon={<Lock size={18} />}
              disabled={isLoading}
            />
          )}

          <FormField
            label="Max Participants"
            name="maxParticipants"
            type="number"
            placeholder="10"
            value={String(formData.maxParticipants)}
            onChange={handleChange}
            error={errors.maxParticipants}
            icon={<Users size={18} />}
            disabled={isLoading}
            min={2}
            max={50}
          />

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/25"
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" />
                Creating Room...
              </>
            ) : (
              'Create Room'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
