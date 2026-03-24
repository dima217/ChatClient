import { useState, FormEvent } from 'react'

type Mode = 'login' | 'register'

interface Props {
  onLogin: (email: string, password: string) => Promise<void>
  onRegister: (email: string, password: string, name: string) => Promise<void>
  onClearError: () => void
  error: string
  loading: boolean
}

export function LoginPage({ onLogin, onRegister, onClearError, error, loading }: Props) {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (mode === 'login') {
      onLogin(email, password)
    } else {
      onRegister(email, password, name)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-pink-500">LazyFans</h1>
          <p className="text-gray-400 mt-2">Chat Demo</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-900 rounded-xl p-6 shadow-2xl border border-gray-800">
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => { setMode('login'); onClearError() }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === 'login'
                  ? 'bg-pink-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); onClearError() }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === 'register'
                  ? 'bg-pink-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              Register
            </button>
          </div>

          {mode === 'register' && (
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-1.5">Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                placeholder="Your name"
                required={mode === 'register'}
              />
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
              placeholder="you@example.com"
              required
              autoFocus={mode === 'login'}
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
              placeholder={mode === 'register' ? 'Min 6 characters' : 'Enter password'}
              required
              minLength={mode === 'register' ? 6 : undefined}
            />
          </div>

          {error && (
            <div className="mb-4 text-sm text-red-400 bg-red-900/30 border border-red-800 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-pink-600 hover:bg-pink-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium rounded-lg px-4 py-2.5 transition-colors"
          >
            {loading
              ? (mode === 'login' ? 'Signing in...' : 'Creating account...')
              : (mode === 'login' ? 'Sign In' : 'Create Account')}
          </button>
        </form>
      </div>
    </div>
  )
}
