'use client'

import { useState } from 'react'
import { Users, MessageCircle, X } from 'lucide-react'

interface RoomLayoutProps {
  header: React.ReactNode
  mainContent: React.ReactNode
  sidebar: React.ReactNode
  chat?: React.ReactNode
  controls?: React.ReactNode
}

export function RoomLayout({ header, mainContent, sidebar, chat, controls }: RoomLayoutProps) {
  const [showSidebar, setShowSidebar] = useState(false)
  const [showChat, setShowChat] = useState(false)

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      {header}

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 p-4 overflow-auto">
            {mainContent}
          </div>
          {controls && (
            <div className="border-t border-gray-800/50 p-3">
              {controls}
            </div>
          )}
        </div>

        {/* Desktop sidebar */}
        <div className="hidden lg:flex w-72 flex-col border-l border-gray-800/50 bg-gray-900/30">
          <div className="flex-1 overflow-y-auto p-3">
            {sidebar}
          </div>
        </div>

        {/* Desktop chat */}
        {chat && (
          <div className="hidden lg:flex w-80 flex-col border-l border-gray-800/50 bg-gray-900/30">
            {chat}
          </div>
        )}
      </div>

      {/* Mobile toggle buttons */}
      <div className="lg:hidden fixed bottom-4 right-4 flex gap-2 z-50">
        <button
          onClick={() => { setShowSidebar(!showSidebar); setShowChat(false) }}
          className={`p-3 rounded-full shadow-lg transition-colors ${
            showSidebar
              ? 'bg-purple-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          <Users className="w-5 h-5" />
        </button>
        {chat && (
          <button
            onClick={() => { setShowChat(!showChat); setShowSidebar(false) }}
            className={`p-3 rounded-full shadow-lg transition-colors ${
              showChat
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            <MessageCircle className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Mobile panels */}
      {showSidebar && (
        <div className="lg:hidden fixed inset-0 z-40 bg-gray-950/80 backdrop-blur-sm" onClick={() => setShowSidebar(false)}>
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-gray-900 border-l border-gray-800 p-4 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowSidebar(false)} className="absolute top-3 right-3 text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            {sidebar}
          </div>
        </div>
      )}

      {showChat && chat && (
        <div className="lg:hidden fixed inset-0 z-40 bg-gray-950/80 backdrop-blur-sm" onClick={() => setShowChat(false)}>
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-gray-900 border-l border-gray-800 flex flex-col" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowChat(false)} className="absolute top-3 right-3 text-gray-400 hover:text-white z-10">
              <X className="w-5 h-5" />
            </button>
            {chat}
          </div>
        </div>
      )}
    </div>
  )
}
