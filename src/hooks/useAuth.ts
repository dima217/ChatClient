import { useState, useCallback } from 'react'
import { useLoginMutation, useRegisterMutation, api } from '../lib/api'
import { clearCredentials } from '../store/authSlice'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { rtkErrorMessage } from '../lib/rtkError'

export function useAuth() {
  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.auth.user)
  const [error, setError] = useState('')
  const [loginMut, { isLoading: loginLoading, reset: resetLogin }] =
    useLoginMutation()
  const [regMut, { isLoading: regLoading, reset: resetReg }] =
    useRegisterMutation()

  const login = useCallback(
    async (email: string, password: string) => {
      setError('')
      try {
        await loginMut({ email, password }).unwrap()
      } catch (e: unknown) {
        const msg = rtkErrorMessage(e)
        setError(msg)
        throw e
      }
    },
    [loginMut]
  )

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      setError('')
      try {
        await regMut({ email, password, name }).unwrap()
      } catch (e: unknown) {
        const msg = rtkErrorMessage(e)
        setError(msg)
        throw e
      }
    },
    [regMut]
  )

  const logout = useCallback(() => {
    dispatch(clearCredentials())
    dispatch(api.util.resetApiState())
  }, [dispatch])

  const clearError = useCallback(() => {
    setError('')
    resetLogin()
    resetReg()
  }, [resetLogin, resetReg])

  const loading = loginLoading || regLoading

  return { user, loading, error, login, register, logout, clearError }
}
