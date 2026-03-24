import AsyncStorage from '@react-native-async-storage/async-storage'
import { config } from '../config'

const TOKEN_KEY = 'access_token'
const USER_KEY = 'user'

export interface AuthUser {
  sub: string
  email: string
  name: string
  groups: string[]
}

interface LoginResponse {
  access_token: string
  user: { id: string; email: string; name: string }
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const res = await fetch(`${config.apiUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || data.error || 'Login failed')

  const { access_token, user } = data as LoginResponse
  const authUser: AuthUser = {
    sub: user.id,
    email: user.email,
    name: user.name,
    groups: [],
  }
  await AsyncStorage.setItem(TOKEN_KEY, access_token)
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(authUser))
  return authUser
}

export async function register(
  email: string,
  password: string,
  name: string
): Promise<AuthUser> {
  const res = await fetch(`${config.apiUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || data.error || 'Registration failed')

  const { access_token, user } = data as LoginResponse
  const authUser: AuthUser = {
    sub: user.id,
    email: user.email,
    name: user.name,
    groups: [],
  }
  await AsyncStorage.setItem(TOKEN_KEY, access_token)
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(authUser))
  return authUser
}

export async function logout(): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(TOKEN_KEY),
    AsyncStorage.removeItem(USER_KEY),
  ])
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = await AsyncStorage.getItem(TOKEN_KEY)
  if (!token) return null

  const stored = await AsyncStorage.getItem(USER_KEY)
  if (stored) {
    try {
      return JSON.parse(stored) as AuthUser
    } catch {
      await Promise.all([AsyncStorage.removeItem(TOKEN_KEY), AsyncStorage.removeItem(USER_KEY)])
      return null
    }
  }
  return null
}

export async function getIdToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY)
}
