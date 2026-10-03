'use client'

import { useState } from 'react'
import { Users, MessageCircle, X, ChevronRight, ChevronLeft } from 'lucide-react'

interface RoomLayoutProps {
  header: React.ReactNode
  mainContent: React.ReactNode
  sidebar: React.ReactNode
  chat?: React.ReactNode
  controls?: React.ReactNode
}

export function RoomLayout({ header, mainContent, sidebar, chat, controls }: RoomLayoutProps) {
  const [activeTab, setActiveTab] = useState<'chat' | 'participants' | 'none'>('chat')
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-gray-950 overflow-hidden">
      {/* Header */}
      {header}

      {/* Main body area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Main Media/Player Area */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <div className="flex-1 overflow-hidden relative bg-black">
            {mainContent}
          </div>

          {/* Bottom Controls Bar */}
          {controls && (
            <div className="border-t border-gray-800/60 bg-gray-900/90 backdrop-blur-md px-4 py-2.5 z-20 shrink-0">
              {controls}
            </div>
          )}
        </div>

        {/* ── DESKTOP SIDEBAR (Tabbed: Chat or Participants) ── */}
        <div className="hidden md:flex flex-col border-l border-gray-800/70 bg-gray-900/95 shrink-0 transition-all duration-300"
          style={{ width: activeTab === 'none' ? '48px' : '340px' }}
        >
          {/* Top tab selector */}
          <div className="flex items-center justify-between border-b border-gray-800/80 px-2 py-2 bg-gray-900 shrink-0">
            {activeTab !== 'none' ? (
              <>
                <div className="flex items-center gap-1 bg-gray-800/80 p-0.5 rounded-lg">
                  {chat && (
                    <button
                      onClick={() => setActiveTab('chat')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                        activeTab === 'chat'
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      Chat
                    </button>
                  )}
                  <button
                    onClick={() => setActiveTab('participants')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                      activeTab === 'participants'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    People
                  </button>
                </div>
                {/* Collapse button */}
                <button
                  onClick={() => setActiveTab('none')}
                  title="Collapse sidebar"
                  className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            ) : (
              /* Collapsed strip icons */
              <div className="flex flex-col items-center gap-2 w-full py-1">
                <button
                  onClick={() => setActiveTab('chat')}
                  title="Open Chat"
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setActiveTab('participants')}
                  title="Open Participants"
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <Users className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Panel content */}
          {activeTab !== 'none' && (
            <div className="flex-1 overflow-hidden flex flex-col">
              {activeTab === 'chat' && chat && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  {chat}
                </div>
              )}
              {activeTab === 'participants' && (
                <div className="flex-1 overflow-y-auto p-3">
                  {sidebar}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── MOBILE FLOATING BUTTONS ── */}
      <div className="md:hidden fixed bottom-16 right-4 flex gap-2 z-40">
        <button
          onClick={() => { setActiveTab('participants'); setMobileOpen(true) }}
          className="p-3 bg-gray-800 text-gray-300 hover:text-white rounded-full shadow-2xl border border-gray-700"
        >
          <Users className="w-5 h-5" />
        </button>
        {chat && (
          <button
            onClick={() => { setActiveTab('chat'); setMobileOpen(true) }}
            className="p-3 bg-purple-600 text-white rounded-full shadow-2xl shadow-purple-900/50"
          >
            <MessageCircle className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* ── MOBILE OVERLAY DRAWER ── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-gray-900 flex flex-col border-l border-gray-800" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-3 border-b border-gray-800">
              <div className="flex gap-1 bg-gray-800 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`px-3 py-1 text-xs font-medium rounded ${activeTab === 'chat' ? 'bg-purple-600 text-white' : 'text-gray-400'}`}
                >
                  Chat
                </button>
                <button
                  onClick={() => setActiveTab('participants')}
                  className={`px-3 py-1 text-xs font-medium rounded ${activeTab === 'participants' ? 'bg-purple-600 text-white' : 'text-gray-400'}`}
                >
                  People
                </button>
              </div>
              <button onClick={() => setMobileOpen(false)} className="p-1 text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden flex flex-col">
              {activeTab === 'chat' && chat && <div className="flex-1 flex flex-col overflow-hidden">{chat}</div>}
              {activeTab === 'participants' && <div className="flex-1 overflow-y-auto p-3">{sidebar}</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
