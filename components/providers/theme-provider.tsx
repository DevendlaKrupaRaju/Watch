'use client'

import { createContext, useContext, useEffect, useMemo, useRef, useSyncExternalStore } from 'react'

type Theme = 'dark' | 'light' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: 'dark' | 'light'
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'dark'
  return (localStorage.getItem('watchhub-theme') as Theme) || 'dark'
}

function resolveTheme(theme: Theme): 'dark' | 'light' {
  if (theme === 'system') {
    if (typeof window === 'undefined') return 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return theme
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const themeRef = useRef<Theme>(getStoredTheme())
  const listenersRef = useRef(new Set<() => void>())

  const store = useMemo(() => ({
    getSnapshot: () => themeRef.current,
    subscribe: (listener: () => void) => {
      listenersRef.current.add(listener)
      return () => { listenersRef.current.delete(listener) }
    },
  }), [])

  const theme = useSyncExternalStore(store.subscribe, store.getSnapshot, () => 'dark' as Theme)
  const resolved = resolveTheme(theme)

  const setTheme = useMemo(() => (newTheme: Theme) => {
    themeRef.current = newTheme
    localStorage.setItem('watchhub-theme', newTheme)
    listenersRef.current.forEach((l) => l())
  }, [])

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', resolved === 'dark')
    root.classList.toggle('light', resolved === 'light')
  }, [resolved])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme: resolved }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within a ThemeProvider')
  return context
}
