import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import toast from 'react-hot-toast'

export const useTransactions = (bookId, filters = {}) => {
  const cleanFilters = Object.fromEntries(
    Object.entries({ bookId, ...filters }).filter(([, v]) => v !== undefined && v !== null && v !== '')
  )
  const params = new URLSearchParams(cleanFilters).toString()
  return useQuery({
    queryKey: ['transactions', bookId, filters],
    queryFn: () => api.get(`/transactions?${params}`),
    enabled: !!bookId,
  })
}

export const useSummary = (bookId) =>
  useQuery({
    queryKey: ['summary', bookId],
    queryFn: () => api.get(`/reports/summary?bookId=${bookId}`),
    enabled: !!bookId,
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
    onSuccess: () => { invalidate(qc, bookId); toast.success('Entry added') },
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
    onSuccess: () => { invalidate(qc, bookId); toast.success('Entry deleted') },
    onError: (e) => toast.error(e.message),
  })
}
