import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { AuthUser } from '../lib/types'

const TOKEN_KEY = 'access_token'
const USER_KEY = 'user'

function readPersisted(): { accessToken: string | null; user: AuthUser | null } {
  try {
    const token = localStorage.getItem(TOKEN_KEY)
    const raw = localStorage.getItem(USER_KEY)
    if (!token || !raw) return { accessToken: null, user: null }
    const user = JSON.parse(raw) as AuthUser
    return { accessToken: token, user }
  } catch {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    return { accessToken: null, user: null }
  }
}

export type AuthState = {
  accessToken: string | null
  user: AuthUser | null
}

const authSlice = createSlice({
  name: 'auth',
  initialState: readPersisted() as AuthState,
  reducers: {
    setCredentials(
      state,
      action: PayloadAction<{ accessToken: string; user: AuthUser }>
    ) {
      state.accessToken = action.payload.accessToken
      state.user = action.payload.user
      localStorage.setItem(TOKEN_KEY, action.payload.accessToken)
      localStorage.setItem(USER_KEY, JSON.stringify(action.payload.user))
    },
    clearCredentials(state) {
      state.accessToken = null
      state.user = null
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
    },
  },
})

export const { setCredentials, clearCredentials } = authSlice.actions
export default authSlice.reducer
