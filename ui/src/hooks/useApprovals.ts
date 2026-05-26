'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getApprovals, approveRemediation, denyRemediation } from '@/lib/api'

export function useApprovals() {
  const query = useQuery({
    queryKey: ['approvals'],
    queryFn: getApprovals,
    refetchInterval: 30000,
    staleTime: 10000,
  })

  return {
    ...query,
    pendingCount: query.data?.length ?? 0,
  }
}

export function useApproveRemediation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, approvedBy }: { id: string; approvedBy: string }) =>
      approveRemediation(id, approvedBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recommendations'] })
      queryClient.invalidateQueries({ queryKey: ['approvals'] })
    },
  })
}

export function useDenyRemediation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, approvedBy }: { id: string; approvedBy: string }) =>
      denyRemediation(id, approvedBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recommendations'] })
      queryClient.invalidateQueries({ queryKey: ['approvals'] })
    },
  })
}
