'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  toggleTheme: (e?: React.MouseEvent) => void
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  toggleTheme: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Read from localStorage or system preference
    const stored = localStorage.getItem('theme') as Theme | null
    if (stored) {
      setTheme(stored)
      document.documentElement.classList.toggle('dark', stored === 'dark')
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const initial = prefersDark ? 'dark' : 'light'
      setTheme(initial)
      document.documentElement.classList.toggle('dark', initial === 'dark')
    }
    setMounted(true)
  }, [])

  const toggleTheme = useCallback((e?: React.MouseEvent) => {
    const newTheme: Theme = theme === 'dark' ? 'light' : 'dark'

    // Get click coordinates for the circular reveal
    const x = e ? e.clientX : window.innerWidth / 2
    const y = e ? e.clientY : 0

    // Calculate the max radius to cover the entire viewport
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    )

    // Check if View Transition API is supported
    if (document.startViewTransition) {
      const transition = document.startViewTransition(() => {
        document.documentElement.classList.toggle('dark', newTheme === 'dark')
        setTheme(newTheme)
        localStorage.setItem('theme', newTheme)
      })

      transition.ready.then(() => {
        const clipPath = [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${endRadius}px at ${x}px ${y}px)`,
        ]

        document.documentElement.animate(
          {
            clipPath: theme === 'dark' ? clipPath : [...clipPath].reverse(),
          },
          {
            duration: 500,
            easing: 'ease-in-out',
            pseudoElement: theme === 'dark'
              ? '::view-transition-new(root)'
              : '::view-transition-old(root)',
          }
        )
      })
    } else {
      // Fallback: just toggle without animation
      document.documentElement.classList.toggle('dark', newTheme === 'dark')
      setTheme(newTheme)
      localStorage.setItem('theme', newTheme)
    }
  }, [theme])

  // Prevent hydration mismatch flash
  if (!mounted) {
    return <>{children}</>
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
