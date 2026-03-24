import { useAuth } from './hooks/useAuth'
import { LoginPage } from './pages/LoginPage'
import { ChatPage } from './pages/ChatPage'

export default function App() {
  const { user, loading, error, login, register, logout, clearError } = useAuth()

  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <LoginPage
        onLogin={login}
        onRegister={register}
        onClearError={clearError}
        error={error}
        loading={loading}
      />
    )
  }

  return <ChatPage user={user} onLogout={logout} />
}
