import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import toast from 'react-hot-toast'

export const useParties = (bookId) =>
  useQuery({
    queryKey: ['parties', bookId],
    queryFn: () => api.get(`/parties?bookId=${bookId}`),
    enabled: !!bookId,
  })

export const useCreateParty = (bookId) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => api.post('/parties', { ...data, book_id: Number(bookId) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['parties', bookId] }); toast.success('Party added') },
    onError: (e) => toast.error(e.message),
  })
}

export const useUpdateParty = (bookId) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }) => api.put(`/parties/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['parties', bookId] }),
    onError: (e) => toast.error(e.message),
  })
}

export const useDeleteParty = (bookId) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.delete(`/parties/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['parties', bookId] }),
    onError: (e) => toast.error(e.message),
  })
}
