import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-gray-950 border-t border-gray-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">W</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                WatchHub
              </span>
            </div>
            <p className="text-gray-400 text-sm max-w-sm">
              Create virtual spaces where friends can watch, chat, play, and hang out together. 
              The ultimate social watch-together platform.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider mb-4">Platform</h3>
            <ul className="space-y-3">
              <li><Link href="/#features" className="text-sm text-gray-400 hover:text-purple-400 transition-colors">Features</Link></li>
              <li><Link href="/#how-it-works" className="text-sm text-gray-400 hover:text-purple-400 transition-colors">How It Works</Link></li>
              <li><Link href="/register" className="text-sm text-gray-400 hover:text-purple-400 transition-colors">Get Started</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider mb-4">Legal</h3>
            <ul className="space-y-3">
              <li><Link href="/about" className="text-sm text-gray-400 hover:text-purple-400 transition-colors">About</Link></li>
              <li><Link href="/privacy" className="text-sm text-gray-400 hover:text-purple-400 transition-colors">Privacy</Link></li>
              <li><Link href="/terms" className="text-sm text-gray-400 hover:text-purple-400 transition-colors">Terms</Link></li>
              <li><Link href="/contact" className="text-sm text-gray-400 hover:text-purple-400 transition-colors">Contact</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800/50">
          <p className="text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} WatchHub. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
