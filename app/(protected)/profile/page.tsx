'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { User, Mail, Calendar, Save, Camera } from 'lucide-react'
import { FormField } from '@/components/ui/form-field'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { updateProfileSchema } from '@/lib/validation/schemas'

interface UserProfile {
  id: string
  username: string
  email: string
  avatarUrl: string | null
  createdAt: string
  updatedAt: string
}

export default function ProfilePage() {
  const { update: updateSession } = useSession()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [username, setUsername] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    let cancelled = false
    async function loadProfile() {
      try {
        const res = await fetch('/api/user/profile')
        const data = await res.json()
        if (!cancelled && data.success) {
          setProfile(data.data)
          setUsername(data.data.username)
          setAvatarUrl(data.data.avatarUrl || '')
        }
      } catch {
        if (!cancelled) setError('Failed to load profile')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    loadProfile()
    return () => { cancelled = true }
  }, [])

  const handleSave = async () => {
    setError('')
    setSuccess('')
    setFieldErrors({})

    const parsed = updateProfileSchema.safeParse({ username, avatarUrl: avatarUrl || undefined })
    if (!parsed.success) {
      const errors: Record<string, string> = {}
      parsed.error.issues.forEach((err) => {
        const field = String(err.path[0])
        if (!errors[field]) errors[field] = err.message
      })
      setFieldErrors(errors)
      return
    }

    setIsSaving(true)

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, avatarUrl: avatarUrl || '' }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to update profile')
        return
      }

      setProfile(data.data)
      setSuccess('Profile updated successfully!')

      // Update session with new data
      await updateSession({
        name: data.data.username,
        image: data.data.avatarUrl,
      })

      setTimeout(() => setSuccess(''), 3000)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-white mb-8">Profile</h1>

      {/* Avatar Section */}
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/20">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={username}
                  width={80}
                  height={80}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-white">
                  {username?.charAt(0).toUpperCase() || 'U'}
                </span>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-gray-800 border-2 border-gray-700 rounded-full flex items-center justify-center">
              <Camera className="w-3.5 h-3.5 text-gray-400" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">{profile?.username}</h2>
            <p className="text-gray-400 text-sm">{profile?.email}</p>
            <p className="text-gray-500 text-xs mt-1 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Joined {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Edit Profile</h3>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm">
            {success}
          </div>
        )}

        <div className="space-y-5">
          <FormField
            label="Username"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value)
              if (fieldErrors.username) setFieldErrors(prev => ({ ...prev, username: '' }))
            }}
            error={fieldErrors.username}
            icon={<User size={18} />}
            placeholder="Your username"
          />

          <FormField
            label="Avatar URL"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            error={fieldErrors.avatarUrl}
            icon={<Camera size={18} />}
            placeholder="https://example.com/avatar.jpg"
          />

          <div>
            <label className="text-sm font-medium text-gray-200">Email</label>
            <div className="mt-2 flex h-11 w-full items-center rounded-lg border border-gray-700 bg-gray-800/30 px-4 text-sm text-gray-500">
              <Mail size={18} className="mr-3 text-gray-600" />
              {profile?.email}
            </div>
            <p className="mt-1 text-xs text-gray-600">Email cannot be changed without verification.</p>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/25"
          >
            {isSaving ? (
              <>
                <LoadingSpinner size="sm" />
                Saving...
              </>
            ) : (
              <>
                <Save size={18} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
