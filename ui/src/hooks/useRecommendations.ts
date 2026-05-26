'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getRecommendations, updateGoNogo, submitForApproval } from '@/lib/api'
import { FilterState, GoNoGo } from '@/lib/types'

export function useRecommendations(filters?: Partial<FilterState>) {
  return useQuery({
    queryKey: ['recommendations', filters],
    queryFn: () => getRecommendations(filters),
    refetchInterval: 30000,
    staleTime: 10000,
  })
}

export function useUpdateGoNogo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: GoNoGo }) =>
      updateGoNogo(id, decision),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recommendations'] })
    },
  })
}

export function useSubmitForApproval() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ ids, submittedBy }: { ids: string[]; submittedBy: string }) =>
      submitForApproval(ids, submittedBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recommendations'] })
      queryClient.invalidateQueries({ queryKey: ['approvals'] })
    },
  })
}
