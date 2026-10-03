import Link from 'next/link'
import { Footer } from '@/components/layout/footer'
import { Film, Video, MessageCircle, Monitor, Gamepad2, Music, ArrowRight, Users, Zap, Globe } from 'lucide-react'

const features = [
  {
    icon: Film,
    title: 'Watch Together',
    description: 'Synchronize videos and watch movies, shows, or YouTube together in real time.',
    available: false,
  },
  {
    icon: Video,
    title: 'Video Chat',
    description: 'See your friends face-to-face with built-in video and audio calling.',
    available: false,
  },
  {
    icon: MessageCircle,
    title: 'Real-Time Chat',
    description: 'Send messages, reactions, and emojis while watching together.',
    available: false,
  },
  {
    icon: Monitor,
    title: 'Screen Sharing',
    description: 'Share your screen to present, collaborate, or show anything.',
    available: false,
  },
  {
    icon: Gamepad2,
    title: 'Mini Games',
    description: 'Play fun mini games with your friends during watch parties.',
    available: false,
  },
  {
    icon: Music,
    title: 'Shared Experiences',
    description: 'Listen to music, take polls, and create shared playlists together.',
    available: false,
  },
]

const steps = [
  {
    number: '01',
    icon: Zap,
    title: 'Create a Room',
    description: 'Set up your virtual room in seconds. Customize it to your liking.',
  },
  {
    number: '02',
    icon: Users,
    title: 'Invite Your Friends',
    description: 'Share a simple link and your friends can join instantly.',
  },
  {
    number: '03',
    icon: Globe,
    title: 'Connect & Enjoy',
    description: 'Watch, chat, play, and hang out together in real time.',
  },
]

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-gray-950 to-gray-950" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-3xl" />
        
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-300 text-sm font-medium mb-8">
            <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
            Now in Early Access
          </div>
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-white via-purple-200 to-indigo-200 bg-clip-text text-transparent">
              Watch. Talk. Play.
            </span>
            <br />
            <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
              Together.
            </span>
          </h1>
          
          <p className="mt-6 text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Create a virtual space where your friends can watch, chat, play, and hang out together. 
            No matter the distance.
          </p>
          
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 flex items-center justify-center gap-2 text-lg"
            >
              Create a Room
              <ArrowRight size={20} />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 border border-gray-700 hover:border-gray-600 text-gray-300 hover:text-white font-semibold rounded-xl transition-all duration-200 hover:bg-gray-800/50 flex items-center justify-center gap-2 text-lg"
            >
              Join a Room
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Everything you need to hang out</h2>
            <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
              A complete platform for watching, chatting, and playing together with friends.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group relative bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 hover:border-purple-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/5"
              >
                {!feature.available && (
                  <span className="absolute top-4 right-4 px-2 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-300 text-xs font-medium">
                    Coming Soon
                  </span>
                )}
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:from-purple-500/30 group-hover:to-indigo-500/30 transition-colors">
                  <feature.icon className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-900/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">How it works</h2>
            <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
              Get started in three simple steps.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step) => (
              <div key={step.number} className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/20">
                  <step.icon className="w-8 h-8 text-white" />
                </div>
                <span className="text-sm font-bold text-purple-400 uppercase tracking-wider">Step {step.number}</span>
                <h3 className="text-xl font-semibold text-white mt-2 mb-3">{step.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-purple-500/25"
            >
              Get Started Free
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
