import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('cb_token'))
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cb_user')) } catch { return null }
  })

  const login = (token, user) => {
    localStorage.setItem('cb_token', token)
    localStorage.setItem('cb_user', JSON.stringify(user))
    setToken(token)
    setUser(user)
  }

  const logout = () => {
    localStorage.removeItem('cb_token')
    localStorage.removeItem('cb_user')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isLoggedIn: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
