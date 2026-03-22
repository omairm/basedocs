import { useState, useEffect, useCallback } from 'react'
import { User } from '../types'
import { api } from '../lib/api'

interface AuthState {
  user: User | null
  loading: boolean
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refetch: () => Promise<void>
}

export function useAuth(): AuthState & AuthActions {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchMe = useCallback(async () => {
    try {
      const data = await api.get<{ user: User }>('/auth/me')
      setUser(data.user)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMe()
  }, [fetchMe])

  const login = async (email: string, password: string) => {
    const data = await api.post<{ user: User }>('/auth/login', { email, password })
    setUser(data.user)
  }

  const logout = async () => {
    await api.post('/auth/logout', {})
    setUser(null)
  }

  return { user, loading, login, logout, refetch: fetchMe }
}
