import { useState, useEffect, useCallback } from 'react'
import {
  AuthUser,
  login as authLogin,
  register as authRegister,
  logout as authLogout,
  getCurrentUser,
} from '../lib/auth'

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getCurrentUser().then(u => {
      setUser(u)
      setLoading(false)
    })
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setError('')
    setLoading(true)
    try {
      const u = await authLogin(email, password)
      setUser(u)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Login failed'
      setError(msg)
      throw e
    } finally {
      setLoading(false)
    }
  }, [])

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      setError('')
      setLoading(true)
      try {
        const u = await authRegister(email, password, name)
        setUser(u)
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Registration failed'
        setError(msg)
        throw e
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const logout = useCallback(async () => {
    await authLogout()
    setUser(null)
  }, [])

  const clearError = useCallback(() => setError(''), [])

  return { user, loading, error, login, register, logout, clearError }
}
