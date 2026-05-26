'use client'

import { useState, FormEvent } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Code2, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

export function ChangePasswordPage() {
  const { completeNewPassword, signOut } = useAuth()
  const [name, setName]                     = useState('')
  const [newPassword, setNewPassword]       = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError]                   = useState<string | null>(null)
  const [loading, setLoading]               = useState(false)

  // Password rules matching the Cognito pool policy
  function validate(): string | null {
    if (!name.trim())                         return 'Please enter your full name.'
    if (newPassword.length < 8)               return 'Password must be at least 8 characters.'
    if (!/[A-Z]/.test(newPassword))           return 'Password must contain at least one uppercase letter.'
    if (!/[a-z]/.test(newPassword))           return 'Password must contain at least one lowercase letter.'
    if (!/[0-9]/.test(newPassword))           return 'Password must contain at least one number.'
    if (newPassword !== confirmPassword)       return 'Passwords do not match.'
    return null
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const validationError = validate()
    if (validationError) { setError(validationError); return }

    setLoading(true)
    try {
      await completeNewPassword(newPassword, name.trim())
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('Password does not conform')) {
        setError('Password does not meet requirements. Try a stronger password.')
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  // Strength indicator
  const strength = [
    newPassword.length >= 8,
    /[A-Z]/.test(newPassword),
    /[a-z]/.test(newPassword),
    /[0-9]/.test(newPassword),
  ]
  const strengthCount = strength.filter(Boolean).length

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-200 flex items-center justify-center">
            <Code2 size={26} className="text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-slate-900">Set New Password</h1>
            <p className="text-sm text-slate-500 mt-0.5">Choose a permanent password to continue</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-8">
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                placeholder="Jane Smith"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />

              {/* Strength indicator */}
              {newPassword && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[0,1,2,3].map(i => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          i < strengthCount
                            ? strengthCount <= 1 ? 'bg-red-400'
                            : strengthCount <= 2 ? 'bg-yellow-400'
                            : strengthCount <= 3 ? 'bg-blue-400'
                            : 'bg-green-400'
                            : 'bg-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="space-y-0.5">
                    {([
                      [strength[0], '8+ characters'],
                      [strength[1], 'Uppercase letter'],
                      [strength[2], 'Lowercase letter'],
                      [strength[3], 'Number'],
                    ] as [boolean, string][]).map(([met, label]) => (
                      <div key={label} className="flex items-center gap-1.5 text-xs">
                        <CheckCircle2 size={11} className={met ? 'text-green-500' : 'text-slate-300'} />
                        <span className={met ? 'text-green-700' : 'text-slate-400'}>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="mt-1 text-xs text-red-500">Passwords do not match</p>
              )}
              {confirmPassword && newPassword === confirmPassword && (
                <p className="mt-1 text-xs text-green-600">Passwords match ✓</p>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
                <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !name.trim() || strengthCount < 4 || newPassword !== confirmPassword}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 size={15} className="animate-spin" />Setting password…</>
              ) : (
                'Set Password & Sign In'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          <button onClick={signOut} className="text-indigo-500 hover:underline">
            Back to sign in
          </button>
        </p>

      </div>
    </div>
  )
}
