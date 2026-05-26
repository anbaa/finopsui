'use client'

import { useContext } from 'react'
import { AuthContext } from '@/context/AuthContext'

/**
 * Convenience hook — use inside any component to access auth state.
 * Must be rendered inside <AuthProvider>.
 */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
