import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import toast from 'react-hot-toast'

export const useBooks = () =>
  useQuery({ queryKey: ['books'], queryFn: () => api.get('/books') })

export const useCreateBook = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => api.post('/books', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['books'] }); toast.success('Book created') },
    onError: (e) => toast.error(e.message),
  })
}

export const useUpdateBook = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }) => api.put(`/books/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['books'] }),
    onError: (e) => toast.error(e.message),
  })
}

export const useDeleteBook = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.delete(`/books/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['books'] }); toast.success('Book deleted') },
    onError: (e) => toast.error(e.message),
  })
}
