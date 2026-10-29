import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import toast from 'react-hot-toast'

const toParams = (obj) =>
  new URLSearchParams(
    Object.fromEntries(
      Object.entries(obj)
        .map(([k, v]) => [k, Array.isArray(v) ? v.join(',') : v])
        .filter(([, v]) => v !== undefined && v !== null && v !== '')
    )
  ).toString()

export const useTransactions = (bookId, filters = {}) =>
  useQuery({
    queryKey: ['transactions', bookId, filters],
    queryFn: async () => {
      const res = await api.get(`/transactions?${toParams({ bookId, ...filters })}`)
      // Normalise: always return { data: [], hasMore: bool }
      return Array.isArray(res) ? { data: res, hasMore: false } : res
    },
    enabled: !!bookId,
    placeholderData: (prev) => prev,
  })

export const useSummary = (bookId, filters = {}) =>
  useQuery({
    queryKey: ['summary', bookId, filters],
    queryFn: () => api.get(`/reports/summary?${toParams({ bookId, ...filters })}`),
    enabled: !!bookId,
    placeholderData: (prev) => prev,
  })

const invalidate = (qc, bookId) => {
  qc.invalidateQueries({ queryKey: ['transactions', bookId] })
  qc.invalidateQueries({ queryKey: ['summary', bookId] })
  qc.invalidateQueries({ queryKey: ['cashflow', bookId] })
  qc.invalidateQueries({ queryKey: ['catreport', bookId] })
  qc.invalidateQueries({ queryKey: ['books'] })
}

export const useCreateTransaction = (bookId) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => api.post('/transactions', { ...data, book_id: Number(bookId) }),
    onSuccess: () => { invalidate(qc, bookId) },
    onError: (e) => toast.error(e.message),
  })
}

export const useUpdateTransaction = (bookId) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }) => api.put(`/transactions/${id}`, data),
    onSuccess: () => { invalidate(qc, bookId); toast.success('Entry updated') },
    onError: (e) => toast.error(e.message),
  })
}

export const useDeleteTransaction = (bookId) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.delete(`/transactions/${id}`),
    onSuccess: () => { invalidate(qc, bookId) },
    onError: (e) => toast.error(e.message),
  })
}
