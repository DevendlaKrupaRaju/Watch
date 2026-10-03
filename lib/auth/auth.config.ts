import type { NextAuthConfig } from 'next-auth'

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const protectedPaths = ['/dashboard', '/profile', '/settings', '/create-room', '/join', '/room']
      const authPaths = ['/login', '/register']
      const isProtected = protectedPaths.some(path => nextUrl.pathname.startsWith(path))
      const isAuthPage = authPaths.some(path => nextUrl.pathname.startsWith(path))

      if (isProtected) {
        if (!isLoggedIn) return false
        return true
      }

      if (isAuthPage && isLoggedIn) {
        return Response.redirect(new URL('/dashboard', nextUrl))
      }

      return true
    },
  },
  providers: [],
} satisfies NextAuthConfig
