import { auth } from '@/lib/auth/auth'
import { redirect } from 'next/navigation'
import { Plus, Users, Clock, Tv, UserPlus, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import prisma from '@/lib/db/prisma'

export const metadata = {
  title: 'Dashboard - WatchHub',
  description: 'Your WatchHub dashboard',
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const username = session.user.name || 'User'

  // Fetch user's rooms
  const memberships = await prisma.roomMember.findMany({
    where: { userId: session.user.id },
    include: {
      room: {
        include: {
          host: { select: { id: true, username: true } },
          _count: { select: { members: true } },
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
    take: 10,
  })

  const rooms = memberships.map((m) => ({
    id: m.room.id,
    roomCode: m.room.roomCode,
    name: m.room.name,
    description: m.room.description,
    isPrivate: m.room.isPrivate,
    host: m.room.host,
    memberCount: m.room._count.members,
    role: m.role,
    joinedAt: m.joinedAt,
  }))

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">
          Welcome back, <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">{username}</span>!
        </h1>
        <p className="mt-2 text-gray-400">Ready to watch something together?</p>
      </div>

      {/* Primary Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
        <Link
          href="/create-room"
          className="group relative bg-gradient-to-br from-purple-600/20 to-indigo-600/20 border border-purple-500/20 rounded-2xl p-6 text-left hover:border-purple-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-purple-500/20">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Create Room</h3>
              <p className="text-gray-400 text-sm">Start a new watch party and invite your friends.</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-purple-400 transition-colors mt-2" />
          </div>
        </Link>

        <Link
          href="/join"
          className="group relative bg-gradient-to-br from-teal-600/20 to-cyan-600/20 border border-teal-500/20 rounded-2xl p-6 text-left hover:border-teal-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-teal-500/10"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-teal-500/20">
                <UserPlus className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Join Room</h3>
              <p className="text-gray-400 text-sm">Enter a room code to join an existing watch party.</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-teal-400 transition-colors mt-2" />
          </div>
        </Link>
      </div>

      {/* Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Rooms */}
        <div className="lg:col-span-2 bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Tv className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-semibold text-white">My Rooms</h2>
          </div>

          {rooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <Tv className="w-8 h-8 text-gray-600" />
              </div>
              <p className="text-gray-400 font-medium">No rooms yet</p>
              <p className="text-gray-500 text-sm mt-1">Create or join a room to get started!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rooms.map((room) => (
                <Link
                  key={room.id}
                  href={`/room/${room.roomCode}`}
                  className="flex items-center justify-between p-4 bg-gray-800/30 border border-gray-700/50 rounded-xl hover:border-purple-500/30 hover:bg-gray-800/50 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500/20 to-indigo-600/20 border border-purple-500/30 rounded-lg flex items-center justify-center">
                      <Tv className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white group-hover:text-purple-300 transition-colors">
                        {room.name}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                        <span className="font-mono bg-gray-800 px-1.5 py-0.5 rounded">{room.roomCode}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {room.memberCount}
                        </span>
                        {room.role === 'HOST' && (
                          <>
                            <span>•</span>
                            <span className="text-yellow-400">Host</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-purple-400 transition-colors" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-purple-400" />
              <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
            </div>
            <div className="flex flex-col items-center py-6 text-center">
              <p className="text-gray-500 text-sm">No recent activity</p>
              <p className="text-gray-600 text-xs mt-1">Your watch history will appear here.</p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Quick Links</h2>
            <div className="space-y-2">
              <Link href="/profile" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-400 hover:text-white rounded-lg hover:bg-gray-800/50 transition-colors">
                <Users className="w-4 h-4" />
                Edit Profile
              </Link>
              <Link href="/settings" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-400 hover:text-white rounded-lg hover:bg-gray-800/50 transition-colors">
                <Tv className="w-4 h-4" />
                Settings
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
