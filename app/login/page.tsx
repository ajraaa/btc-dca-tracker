'use client'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '@/lib/supabase' // Sesuaikan path dengan file lib kamu
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/components/ThemeProvider'

export default function LoginPage() {
  const router = useRouter()
  const { theme } = useTheme()

  useEffect(() => {
    // Cek jika user sudah login, langsung lempar ke Dashboard
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        router.push('/')
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  return (
    <div 
      className="flex justify-center items-center min-h-screen p-4"
      style={{ background: 'var(--bg)' }}
    >
      <div 
        className="w-full max-w-md p-8 rounded-2xl"
        style={{ 
          background: 'var(--bg-card)', 
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-xl)',
        }}
      >
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black tracking-tighter italic uppercase" style={{ color: 'var(--accent)' }}>
            BTC Tracker
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Sign in to track your DCA
          </p>
        </div>
        <Auth
          supabaseClient={supabase}
          appearance={{ 
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#f97316',
                  brandAccent: '#ea580c',
                  inputBackground: 'var(--bg-input)',
                  inputBorder: 'var(--border)',
                  inputText: 'var(--text-primary)',
                  inputPlaceholder: 'var(--text-muted)',
                },
                borderWidths: {
                  buttonBorderWidth: '1px',
                  inputBorderWidth: '1px',
                },
                radii: {
                  borderRadiusButton: '12px',
                  buttonBorderRadius: '12px',
                  inputBorderRadius: '12px',
                },
              },
            },
          }}
          providers={['google']} // Tambahkan provider lain jika mau
          theme={theme === 'dark' ? 'dark' : 'light'}
        />
      </div>
    </div>
  )
}