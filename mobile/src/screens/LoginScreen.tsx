import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { colors } from '../theme'

type Mode = 'login' | 'register'

interface Props {
  onLogin: (email: string, password: string) => Promise<void>
  onRegister: (email: string, password: string, name: string) => Promise<void>
  onClearError: () => void
  error: string
  loading: boolean
}

export function LoginScreen({ onLogin, onRegister, onClearError, error, loading }: Props) {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')

  const handleSubmit = () => {
    if (mode === 'login') onLogin(email, password)
    else onRegister(email, password, name)
  }

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={s.form}>
        <Text style={s.title}>LazyFans</Text>
        <Text style={s.subtitle}>Chat Demo</Text>

        <View style={s.tabs}>
          <TouchableOpacity
            style={[s.tab, mode === 'login' && s.tabActive]}
            onPress={() => { setMode('login'); onClearError() }}
          >
            <Text style={[s.tabText, mode === 'login' && s.tabTextActive]}>Sign In</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.tab, mode === 'register' && s.tabActive]}
            onPress={() => { setMode('register'); onClearError() }}
          >
            <Text style={[s.tabText, mode === 'register' && s.tabTextActive]}>Register</Text>
          </TouchableOpacity>
        </View>

        {mode === 'register' && (
          <View style={s.field}>
            <Text style={s.label}>Name</Text>
            <TextInput
              style={s.input}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={colors.text.gray500}
              autoCapitalize="words"
            />
          </View>
        )}

        <View style={s.field}>
          <Text style={s.label}>Email</Text>
          <TextInput
            style={s.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={colors.text.gray500}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={s.field}>
          <Text style={s.label}>Password</Text>
          <TextInput
            style={s.input}
            value={password}
            onChangeText={setPassword}
            placeholder={mode === 'register' ? 'Min 6 characters' : 'Enter password'}
            placeholderTextColor={colors.text.gray500}
            secureTextEntry
          />
        </View>

        {error ? (
          <View style={s.error}>
            <Text style={s.errorText}>{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[s.submit, loading && s.submitDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={[s.submitText, loading && s.submitTextDisabled]}>
            {loading ? (mode === 'login' ? 'Signing in...' : 'Creating account...') : (mode === 'login' ? 'Sign In' : 'Create Account')}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.gray950,
    justifyContent: 'center',
    padding: 16,
  },
  form: {
    backgroundColor: colors.bg.gray900,
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border.gray800,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.accent.pink500,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.text.gray400,
    textAlign: 'center',
    marginTop: 8,
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.bg.gray800,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.accent.pink600,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.gray400,
  },
  tabTextActive: {
    color: colors.text.white,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: colors.text.gray400,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.bg.gray800,
    borderWidth: 1,
    borderColor: colors.border.gray700,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text.white,
  },
  error: {
    backgroundColor: 'rgba(127, 29, 29, 0.3)',
    borderWidth: 1,
    borderColor: '#7f1d1d',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    color: colors.text.red400,
  },
  submit: {
    backgroundColor: colors.accent.pink600,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  submitDisabled: {
    backgroundColor: colors.bg.gray700,
  },
  submitText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.white,
  },
  submitTextDisabled: {
    color: colors.text.gray500,
  },
})
