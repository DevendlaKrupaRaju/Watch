'use client'

import { useState } from 'react'
import { Plus, X, BarChart3 } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface PollCreatorProps {
  roomCode: string
  onClose: () => void
}

export function PollCreator({ roomCode, onClose }: PollCreatorProps) {
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', ''])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const addOption = () => {
    if (options.length < 6) setOptions([...options, ''])
  }

  const removeOption = (index: number) => {
    if (options.length > 2) setOptions(options.filter((_, i) => i !== index))
  }

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const trimmedQuestion = question.trim()
    const trimmedOptions = options.map((o) => o.trim()).filter((o) => o.length > 0)

    if (!trimmedQuestion) {
      setError('Please enter a question')
      return
    }
    if (trimmedOptions.length < 2) {
      setError('At least 2 options are required')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/rooms/${roomCode}/polls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: trimmedQuestion,
          options: trimmedOptions.map((text, i) => ({ id: i, text })),
        }),
      })
      const data = await res.json()
      if (!data.success) {
        setError(data.error || 'Failed to create poll')
        return
      }
      onClose()
    } catch {
      setError('Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/80 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Create Poll</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-200 mb-1 block">Question</label>
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What should we watch next?"
              className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder:text-gray-500 focus:border-purple-500 focus:outline-none"
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-200">Options</label>
            {options.map((opt, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={opt}
                  onChange={(e) => updateOption(i, e.target.value)}
                  placeholder={`Option ${i + 1}`}
                  className="flex-1 bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder:text-gray-500 focus:border-purple-500 focus:outline-none"
                  maxLength={100}
                />
                {options.length > 2 && (
                  <button type="button" onClick={() => removeOption(i)} className="p-2 text-gray-500 hover:text-red-400">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            {options.length < 6 && (
              <button type="button" onClick={addOption} className="flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300">
                <Plus className="w-4 h-4" /> Add option
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting ? <><LoadingSpinner size="sm" /> Creating...</> : 'Create Poll'}
          </button>
        </form>
      </div>
    </div>
  )
}
