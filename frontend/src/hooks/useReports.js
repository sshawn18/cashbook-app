import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

export const useCashflow = (bookId, from, to) =>
  useQuery({
    queryKey: ['cashflow', bookId, from, to],
    queryFn: () => {
      const p = new URLSearchParams({
        bookId,
        ...(from && { from }),
        ...(to && { to }),
      }).toString()
      return api.get(`/reports/cashflow?${p}`)
    },
    enabled: !!bookId,
  })

export const useCategoryReport = (bookId, from, to) =>
  useQuery({
    queryKey: ['catreport', bookId, from, to],
    queryFn: () => {
      const p = new URLSearchParams({
        bookId,
        ...(from && { from }),
        ...(to && { to }),
      }).toString()
      return api.get(`/reports/categories?${p}`)
    },
    enabled: !!bookId,
  })
