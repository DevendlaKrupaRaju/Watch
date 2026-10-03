'use client'

import { useState } from 'react'
import { User, Lock, Palette, Shield, Sun, Moon, Monitor, Eye, UserPlus, DoorOpen } from 'lucide-react'
import { FormField } from '@/components/ui/form-field'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useTheme } from '@/components/providers/theme-provider'
import { changePasswordSchema } from '@/lib/validation/schemas'

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({})
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  const handleChangePassword = async () => {
    setPasswordErrors({})
    setPasswordError('')
    setPasswordSuccess('')

    const parsed = changePasswordSchema.safeParse({
      currentPassword,
      newPassword,
      confirmNewPassword,
    })

    if (!parsed.success) {
      const errors: Record<string, string> = {}
      parsed.error.issues.forEach((err) => {
        const field = String(err.path[0])
        if (!errors[field]) errors[field] = err.message
      })
      setPasswordErrors(errors)
      return
    }

    setIsChangingPassword(true)

    try {
      const res = await fetch('/api/user/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmNewPassword }),
      })

      const data = await res.json()

      if (!res.ok) {
        setPasswordError(data.error || 'Failed to change password')
        return
      }

      setPasswordSuccess('Password changed successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmNewPassword('')
      setTimeout(() => setPasswordSuccess(''), 3000)
    } catch {
      setPasswordError('Something went wrong. Please try again.')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const themeOptions = [
    { value: 'dark' as const, label: 'Dark', icon: Moon, description: 'Easy on the eyes' },
    { value: 'light' as const, label: 'Light', icon: Sun, description: 'Classic bright look' },
    { value: 'system' as const, label: 'System', icon: Monitor, description: 'Match your device' },
  ]

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-white mb-8">Settings</h1>

      <div className="space-y-6">
        {/* Account Section */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <User className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-semibold text-white">Account</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-800">
              <div>
                <p className="text-sm font-medium text-gray-200">Username</p>
                <p className="text-sm text-gray-500">Change your display name</p>
              </div>
              <a href="/profile" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">
                Edit in Profile
              </a>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-gray-200">Email</p>
                <p className="text-sm text-gray-500">Email changes require verification</p>
              </div>
              <span className="text-sm text-gray-600">Coming Soon</span>
            </div>
          </div>
        </div>

        {/* Change Password Section */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Lock className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-semibold text-white">Change Password</h2>
          </div>

          {passwordError && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {passwordError}
            </div>
          )}

          {passwordSuccess && (
            <div className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm">
              {passwordSuccess}
            </div>
          )}

          <div className="space-y-4">
            <FormField
              label="Current Password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              error={passwordErrors.currentPassword}
              icon={<Lock size={18} />}
              placeholder="Enter current password"
            />
            <FormField
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              error={passwordErrors.newPassword}
              icon={<Lock size={18} />}
              placeholder="Enter new password"
            />
            <FormField
              label="Confirm New Password"
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              error={passwordErrors.confirmNewPassword}
              icon={<Lock size={18} />}
              placeholder="Re-enter new password"
            />
            <button
              onClick={handleChangePassword}
              disabled={isChangingPassword}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isChangingPassword ? (
                <>
                  <LoadingSpinner size="sm" />
                  Changing...
                </>
              ) : (
                'Update Password'
              )}
            </button>
          </div>
        </div>

        {/* Appearance Section */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Palette className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-semibold text-white">Appearance</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {themeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setTheme(option.value)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 ${
                  theme === option.value
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-gray-700 bg-gray-800/30 hover:border-gray-600'
                }`}
              >
                <option.icon className={`w-6 h-6 ${theme === option.value ? 'text-purple-400' : 'text-gray-400'}`} />
                <span className={`text-sm font-medium ${theme === option.value ? 'text-purple-300' : 'text-gray-300'}`}>
                  {option.label}
                </span>
                <span className="text-xs text-gray-500">{option.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Privacy Section */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-semibold text-white">Privacy</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <Eye className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-200">Profile Visibility</p>
                  <p className="text-xs text-gray-500">Control who can see your profile</p>
                </div>
              </div>
              <span className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-gray-500">Coming Soon</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <UserPlus className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-200">Friend Requests</p>
                  <p className="text-xs text-gray-500">Manage who can send you friend requests</p>
                </div>
              </div>
              <span className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-gray-500">Coming Soon</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <DoorOpen className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-200">Room Invitations</p>
                  <p className="text-xs text-gray-500">Control who can invite you to rooms</p>
                </div>
              </div>
              <span className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-gray-500">Coming Soon</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
