import { store } from '../store'
import type { AuthUser } from './types'

export type { AuthUser } from './types'

export function getIdToken(): Promise<string | null> {
  return Promise.resolve(store.getState().auth.accessToken)
}

export function getCurrentUser(): AuthUser | null {
  return store.getState().auth.user
}
