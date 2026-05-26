'use client'

import React, { createContext, useState, useEffect, useCallback, useRef } from 'react'
import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserSession,
} from 'amazon-cognito-identity-js'

// ── Cognito pool config (injected at build time via Amplify env vars) ──────────
const POOL_ID     = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID ?? ''
const CLIENT_ID   = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID    ?? ''

const userPool = POOL_ID && CLIENT_ID
  ? new CognitoUserPool({ UserPoolId: POOL_ID, ClientId: CLIENT_ID })
  : null

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  email: string
  sub: string
}

export interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => void
  /** Returns a fresh id_token, refreshing silently if needed. */
  getIdToken: () => Promise<string>
}

// ── Context ───────────────────────────────────────────────────────────────────

export const AuthContext = createContext<AuthContextValue | null>(null)

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  // Cache the last good session so getIdToken is cheap
  const sessionRef = useRef<CognitoUserSession | null>(null)

  // ── Restore session on mount ─────────────────────────────────────────────
  useEffect(() => {
    if (!userPool) {
      setLoading(false)
      return
    }
    const cognitoUser = userPool.getCurrentUser()
    if (!cognitoUser) {
      setLoading(false)
      return
    }
    cognitoUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
      if (err || !session?.isValid()) {
        setLoading(false)
        return
      }
      sessionRef.current = session
      setUser(extractUser(session))
      setLoading(false)
    })
  }, [])

  // ── signIn ───────────────────────────────────────────────────────────────
  const signIn = useCallback(async (email: string, password: string): Promise<void> => {
    if (!userPool) throw new Error('Cognito is not configured')

    return new Promise((resolve, reject) => {
      const cognitoUser = new CognitoUser({ Username: email, Pool: userPool })
      const authDetails = new AuthenticationDetails({ Username: email, Password: password })

      cognitoUser.authenticateUser(authDetails, {
        onSuccess(session) {
          sessionRef.current = session
          setUser(extractUser(session))
          resolve()
        },
        onFailure(err) {
          reject(new Error(err.message ?? String(err)))
        },
        // If the pool requires a password change on first login
        newPasswordRequired(_userAttributes, _requiredAttributes) {
          reject(new Error('NEW_PASSWORD_REQUIRED'))
        },
      })
    })
  }, [])

  // ── signOut ──────────────────────────────────────────────────────────────
  const signOut = useCallback(() => {
    if (!userPool) return
    const cognitoUser = userPool.getCurrentUser()
    cognitoUser?.signOut()
    sessionRef.current = null
    setUser(null)
  }, [])

  // ── getIdToken ───────────────────────────────────────────────────────────
  const getIdToken = useCallback(async (): Promise<string> => {
    if (!userPool) throw new Error('Cognito is not configured')

    const cognitoUser = userPool.getCurrentUser()
    if (!cognitoUser) throw new Error('Not authenticated')

    return new Promise((resolve, reject) => {
      cognitoUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
        if (err || !session?.isValid()) {
          reject(new Error('Session invalid or expired — please sign in again'))
          return
        }
        sessionRef.current = session
        resolve(session.getIdToken().getJwtToken())
      })
    })
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, getIdToken }}>
      {children}
    </AuthContext.Provider>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractUser(session: CognitoUserSession): AuthUser {
  const payload = session.getIdToken().decodePayload()
  return {
    email: payload['email'] ?? '',
    sub:   payload['sub']   ?? '',
  }
}
