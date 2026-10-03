'use client'

import {
  useLocalParticipant,
  useRoomContext,
} from '@livekit/components-react'
import { useState, useCallback } from 'react'
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Monitor,
  MonitorOff,
  Settings,
} from 'lucide-react'

interface CallControlsProps {
  onLeave: () => void
}

export function CallControls({ onLeave }: CallControlsProps) {
  const { localParticipant } = useLocalParticipant()
  const room = useRoomContext()
  const [isMicEnabled, setIsMicEnabled] = useState(true)
  const [isCamEnabled, setIsCamEnabled] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [showDeviceSettings, setShowDeviceSettings] = useState(false)

  const toggleMic = useCallback(async () => {
    try {
      await localParticipant.setMicrophoneEnabled(!isMicEnabled)
      setIsMicEnabled(!isMicEnabled)
    } catch (err) {
      console.error('Failed to toggle mic:', err)
    }
  }, [localParticipant, isMicEnabled])

  const toggleCam = useCallback(async () => {
    try {
      await localParticipant.setCameraEnabled(!isCamEnabled)
      setIsCamEnabled(!isCamEnabled)
    } catch (err) {
      console.error('Failed to toggle camera:', err)
    }
  }, [localParticipant, isCamEnabled])

  const toggleScreenShare = useCallback(async () => {
    try {
      if (isScreenSharing) {
        await localParticipant.setScreenShareEnabled(false)
      } else {
        await localParticipant.setScreenShareEnabled(true)
      }
      setIsScreenSharing(!isScreenSharing)
    } catch (err) {
      console.error('Failed to toggle screen share:', err)
      // User may have cancelled the screen share dialog
    }
  }, [localParticipant, isScreenSharing])

  const handleLeave = useCallback(() => {
    room.disconnect()
    onLeave()
  }, [room, onLeave])

  return (
    <div className="border-t border-gray-800/50 bg-gray-900/80 backdrop-blur-sm px-4 py-3">
      <div className="flex items-center justify-center gap-3">
        {/* Mic */}
        <button
          onClick={toggleMic}
          className={`p-3 rounded-full transition-colors ${
            isMicEnabled
              ? 'bg-gray-700 hover:bg-gray-600 text-white'
              : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
          }`}
          title={isMicEnabled ? 'Mute microphone' : 'Unmute microphone'}
        >
          {isMicEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>

        {/* Camera */}
        <button
          onClick={toggleCam}
          className={`p-3 rounded-full transition-colors ${
            isCamEnabled
              ? 'bg-gray-700 hover:bg-gray-600 text-white'
              : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
          }`}
          title={isCamEnabled ? 'Turn off camera' : 'Turn on camera'}
        >
          {isCamEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>

        {/* Screen Share */}
        <button
          onClick={toggleScreenShare}
          className={`p-3 rounded-full transition-colors ${
            isScreenSharing
              ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
              : 'bg-gray-700 hover:bg-gray-600 text-white'
          }`}
          title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
        >
          {isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
        </button>

        {/* Device Settings */}
        <button
          onClick={() => setShowDeviceSettings(!showDeviceSettings)}
          className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-colors"
          title="Device settings"
        >
          <Settings className="w-5 h-5" />
        </button>

        {/* Leave */}
        <button
          onClick={handleLeave}
          className="p-3 rounded-full bg-red-600 hover:bg-red-500 text-white transition-colors"
          title="Leave call"
        >
          <PhoneOff className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
