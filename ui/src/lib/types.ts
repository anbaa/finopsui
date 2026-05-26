export type ProcessingStatus =
  | 'TO_PROCESS'
  | 'TO_MODIFY'
  | 'PENDING_APPROVAL'
  | 'COMPLETED'
  | 'DENIED'
  | 'EXEMPTED'
  | 'DO_NOT_PROCESS'
  | 'NEEDS_DATA'
  | 'THROTTLED'

export type GoNoGo = 'GO' | 'NO_GO' | null

export interface Recommendation {
  recommendation_id: string
  aws_account: string
  resource_arn: string
  resource_type: 'EbsVolume' | 'Ec2Instance' | 'RdsDbInstance' | 'LambdaFunction'
  resource_id: string
  resource_tags: string
  recommended_action: string
  current_config: string
  recommended_config: string
  estimated_savings: number | string
  currency: string
  region: string
  source: string
  processed_env_tag: string
  owner_tag: string
  processing_status: ProcessingStatus
  full_ai_output: string | null
  ai_reasoning?: string | null
  go_nogo: GoNoGo
  submitted_by: string | null
  approved_by: string | null
  generated_script?: string | null
  created_at: string
}

export interface AIReasoning {
  evaluation_days: number
  evidence: string[]
  verdict: 'TO_MODIFY' | 'DO_NOT_MODIFY' | 'NEEDS_DATA'
  confidence: 'High' | 'Medium' | 'Low'
  risk: string
  recommendation: string
}

export interface FilterState {
  environment: string[]
  team: string[]
  resourceType: string[]
  status: string[]
  goNogo: 'all' | 'GO' | 'NO_GO'
  search: string
}

export interface ApprovalSubmission {
  submission_id: string
  submitted_by: string
  submitted_at: string
  recommendations: Recommendation[]
  total_savings: number
}
