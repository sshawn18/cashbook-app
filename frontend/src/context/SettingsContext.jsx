import { createContext, useContext, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useAuth } from './AuthContext'

const SettingsContext = createContext({
  currency: '₹',
  businessName: '',
  fmtMoney: (paise) => `₹${(paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
})

export function SettingsProvider({ children }) {
  const { isLoggedIn } = useAuth()

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get('/settings'),
    enabled: !!isLoggedIn,
  })

  const currency = settings?.currency || '₹'
  const businessName = settings?.businessName || ''

  const fmtMoney = useMemo(() => (paise) =>
    `${currency}${(paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
    [currency]
  )

  return (
    <SettingsContext.Provider value={{ currency, businessName, fmtMoney }}>
      {children}
    </SettingsContext.Provider>
  )
}

export const useSettings = () => useContext(SettingsContext)
