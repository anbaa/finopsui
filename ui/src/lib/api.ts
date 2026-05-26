import { FilterState, GoNoGo, Recommendation } from './types'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL

const SCRIPT_VOL_027531 = `"""
Auto-generated cost optimization script.
Review carefully before executing.
Resource: vol-027531ba20c2b0f9d (EbsVolume)
Action: Delete
Estimated savings: $0.50/month
"""

import boto3
import time

def delete_ebs_volume(volume_id: str, region: str = "ap-southeast-2"):
    """Delete unattached EBS volume. Creates safety snapshot first."""
    ec2 = boto3.client("ec2", region_name=region)

    # Step 1: Verify volume is unattached
    print(f"Verifying volume {volume_id} is unattached...")
    response = ec2.describe_volumes(VolumeIds=[volume_id])
    volume = response["Volumes"][0]
    if volume["State"] != "available":
        raise ValueError(f"Volume {volume_id} is not in 'available' state. Current state: {volume['State']}")
    print(f"  Volume state: {volume['State']} — safe to proceed.")

    # Step 2: Create safety snapshot
    print(f"Creating snapshot for {volume_id}...")
    snapshot = ec2.create_snapshot(
        VolumeId=volume_id,
        Description=f"Pre-delete backup - FinOps Hub automated cleanup",
        TagSpecifications=[{
            "ResourceType": "snapshot",
            "Tags": [
                {"Key": "CreatedBy", "Value": "FinOpsHub"},
                {"Key": "OriginalVolume", "Value": volume_id},
                {"Key": "Purpose", "Value": "PreDeleteBackup"},
            ]
        }]
    )
    snapshot_id = snapshot["SnapshotId"]
    print(f"  Snapshot created: {snapshot_id}")

    # Step 3: Wait for snapshot completion
    print(f"  Waiting for snapshot {snapshot_id} to complete...")
    waiter = ec2.get_waiter("snapshot_completed")
    waiter.wait(SnapshotIds=[snapshot_id], WaiterConfig={"Delay": 15, "MaxAttempts": 40})
    print(f"  Snapshot completed: {snapshot_id}")

    # Step 4: Delete the volume
    ec2.delete_volume(VolumeId=volume_id)
    print(f"Volume {volume_id} deleted successfully.")
    print(f"Monthly savings: $0.50")
    print(f"Safety snapshot retained: {snapshot_id}")

if __name__ == "__main__":
    delete_ebs_volume("vol-027531ba20c2b0f9d")
`

const SCRIPT_VOL_09C6D3 = `"""
Auto-generated cost optimization script.
Review carefully before executing.
Resource: vol-09c6d3c8d48312910 (EbsVolume)
Action: Delete
Estimated savings: $0.50/month
"""

import boto3

def delete_ebs_volume(volume_id: str, region: str = "ap-southeast-2"):
    """Delete unattached EBS volume. Creates safety snapshot first."""
    ec2 = boto3.client("ec2", region_name=region)

    # Step 1: Create safety snapshot
    print(f"Creating snapshot for {volume_id}...")
    snapshot = ec2.create_snapshot(
        VolumeId=volume_id,
        Description=f"Pre-delete backup - FinOps Hub"
    )
    snapshot_id = snapshot["SnapshotId"]
    print(f"  Snapshot created: {snapshot_id}")

    # Step 2: Wait for snapshot completion
    waiter = ec2.get_waiter("snapshot_completed")
    waiter.wait(SnapshotIds=[snapshot_id])
    print(f"  Snapshot completed: {snapshot_id}")

    # Step 3: Delete the volume
    ec2.delete_volume(VolumeId=volume_id)
    print(f"Volume {volume_id} deleted successfully.")
    print(f"Monthly savings: $0.50")

if __name__ == "__main__":
    delete_ebs_volume("vol-09c6d3c8d48312910")
`

const SCRIPT_VOL_02EE99 = `"""
Auto-generated cost optimization script.
Review carefully before executing.
Resource: vol-02ee993163f0bcfb0 (EbsVolume)
Action: Delete
Estimated savings: $0.50/month
"""

import boto3

def delete_ebs_volume(volume_id: str, region: str = "ap-southeast-2"):
    """Delete unattached EBS volume. Creates safety snapshot first."""
    ec2 = boto3.client("ec2", region_name=region)

    # Step 1: Create safety snapshot
    print(f"Creating snapshot for {volume_id}...")
    snapshot = ec2.create_snapshot(
        VolumeId=volume_id,
        Description=f"Pre-delete backup - FinOps Hub"
    )
    snapshot_id = snapshot["SnapshotId"]
    print(f"  Snapshot created: {snapshot_id}")

    # Step 2: Wait for snapshot completion
    waiter = ec2.get_waiter("snapshot_completed")
    waiter.wait(SnapshotIds=[snapshot_id])
    print(f"  Snapshot completed: {snapshot_id}")

    # Step 3: Delete the volume
    ec2.delete_volume(VolumeId=volume_id)
    print(f"Volume {volume_id} deleted successfully.")
    print(f"Monthly savings: $0.50")

if __name__ == "__main__":
    delete_ebs_volume("vol-02ee993163f0bcfb0")
`

const MOCK_RECOMMENDATIONS: Recommendation[] = [
  {
    recommendation_id: 'rec-001',
    aws_account: '123456789012',
    resource_arn: 'arn:aws:ec2:ap-southeast-2:123456789012:volume/vol-027531ba20c2b0f9d',
    resource_type: 'EbsVolume',
    resource_id: 'vol-027531ba20c2b0f9d',
    resource_tags: '{"Environment":"Mekong","Team":"Platform/Digital","CostCenter":"CC-001"}',
    recommended_action: 'Delete',
    current_config: '5 GB gp2 unattached',
    recommended_config: 'Delete volume',
    estimated_savings: 0.5,
    currency: 'USD',
    region: 'ap-southeast-2',
    source: 'AWS Compute Optimizer',
    processed_env_tag: 'Mekong',
    owner_tag: 'Platform/Digital',
    processing_status: 'TO_MODIFY',
    full_ai_output: 'This EBS volume has been unattached for 30+ days with no read/write activity. Safe to delete after creating a snapshot.',
    ai_reasoning: JSON.stringify({ evaluation_days: 30, evidence: ['State: available (unattached)', 'attachment_count: 0', 'Total read ops (30d): 0', 'Total write ops (30d): 0', 'No I/O activity detected'], verdict: 'TO_MODIFY', confidence: 'High', risk: 'Deletion is irreversible — confirm no backup needed before executing', recommendation: 'Delete — $0.50/mo' }),
    go_nogo: 'GO',
    submitted_by: null,
    approved_by: null,
    generated_script: SCRIPT_VOL_027531,
    created_at: '2024-01-15T08:30:00Z',
  },
  {
    recommendation_id: 'rec-002',
    aws_account: '123456789012',
    resource_arn: 'arn:aws:ec2:ap-southeast-2:123456789012:volume/vol-09c6d3c8d48312910',
    resource_type: 'EbsVolume',
    resource_id: 'vol-09c6d3c8d48312910',
    resource_tags: '{"Environment":"Yarra","Team":"Retail","CostCenter":"CC-002"}',
    recommended_action: 'Delete',
    current_config: '5 GB gp2 unattached',
    recommended_config: 'Delete volume',
    estimated_savings: 0.5,
    currency: 'USD',
    region: 'ap-southeast-2',
    source: 'AWS Compute Optimizer',
    processed_env_tag: 'Yarra',
    owner_tag: 'Retail',
    processing_status: 'TO_MODIFY',
    full_ai_output: 'This EBS volume has been unattached for 45 days. No snapshots exist. Recommend creating a final snapshot before deletion.',
    ai_reasoning: JSON.stringify({ evaluation_days: 30, evidence: ['State: available (unattached)', 'attachment_count: 0', 'Total read ops (30d): 0', 'Total write ops (30d): 0', 'No snapshots exist'], verdict: 'TO_MODIFY', confidence: 'High', risk: 'No existing snapshot — create one before deleting', recommendation: 'Delete — $0.50/mo' }),
    go_nogo: 'GO',
    submitted_by: null,
    approved_by: null,
    generated_script: SCRIPT_VOL_09C6D3,
    created_at: '2024-01-15T09:00:00Z',
  },
  {
    recommendation_id: 'rec-003',
    aws_account: '234567890123',
    resource_arn: 'arn:aws:ec2:ap-southeast-2:234567890123:volume/vol-02ee993163f0bcfb0',
    resource_type: 'EbsVolume',
    resource_id: 'vol-02ee993163f0bcfb0',
    resource_tags: '{"Environment":"Congo","Team":"Core Wagering","CostCenter":"CC-003"}',
    recommended_action: 'Delete',
    current_config: '5 GB gp2 unattached',
    recommended_config: 'Delete volume',
    estimated_savings: 0.5,
    currency: 'USD',
    region: 'ap-southeast-2',
    source: 'AWS Compute Optimizer',
    processed_env_tag: 'Congo',
    owner_tag: 'Core Wagering',
    processing_status: 'TO_MODIFY',
    full_ai_output: 'Volume unattached since provisioning. Never used. Safe to delete.',
    ai_reasoning: JSON.stringify({ evaluation_days: 30, evidence: ['State: available (unattached)', 'attachment_count: 0', 'Total read ops (30d): 0', 'Total write ops (30d): 0', 'Never attached since provisioning'], verdict: 'TO_MODIFY', confidence: 'High', risk: 'Deletion is irreversible — low risk as volume was never used', recommendation: 'Delete — $0.50/mo' }),
    go_nogo: 'GO',
    submitted_by: null,
    approved_by: null,
    generated_script: SCRIPT_VOL_02EE99,
    created_at: '2024-01-15T09:30:00Z',
  },
  {
    recommendation_id: 'rec-004',
    aws_account: '345678901234',
    resource_arn: 'arn:aws:ec2:ap-southeast-2:345678901234:volume/vol-0eec2bf11912a0667',
    resource_type: 'EbsVolume',
    resource_id: 'vol-0eec2bf11912a0667',
    resource_tags: '{"Environment":"Non-Production","Team":"Platform/Digital","CostCenter":"CC-001"}',
    recommended_action: 'Delete',
    current_config: '5 GB gp2 unattached',
    recommended_config: 'Delete volume',
    estimated_savings: 0.5,
    currency: 'USD',
    region: 'ap-southeast-2',
    source: 'AWS Cost Explorer',
    processed_env_tag: 'Non-Production',
    owner_tag: 'Platform/Digital',
    processing_status: 'TO_MODIFY',
    full_ai_output: null,
    go_nogo: null,
    submitted_by: null,
    approved_by: null,
    generated_script: null,
    created_at: '2024-01-16T10:00:00Z',
  },
  {
    recommendation_id: 'rec-005',
    aws_account: '123456789012',
    resource_arn: 'arn:aws:ec2:ap-southeast-2:123456789012:volume/vol-003409606e7f2426f',
    resource_type: 'EbsVolume',
    resource_id: 'vol-003409606e7f2426f',
    resource_tags: '{"Environment":"Mekong","Team":"Platform/Digital","CostCenter":"CC-001"}',
    recommended_action: 'Delete',
    current_config: '5 GB gp2 unattached',
    recommended_config: 'Delete volume',
    estimated_savings: 0.5,
    currency: 'USD',
    region: 'ap-southeast-2',
    source: 'AWS Compute Optimizer',
    processed_env_tag: 'Mekong',
    owner_tag: 'Platform/Digital',
    processing_status: 'TO_MODIFY',
    full_ai_output: null,
    go_nogo: null,
    submitted_by: null,
    approved_by: null,
    generated_script: null,
    created_at: '2024-01-16T11:00:00Z',
  },
  {
    recommendation_id: 'rec-006',
    aws_account: '123456789012',
    resource_arn: 'arn:aws:ec2:ap-southeast-2:123456789012:volume/vol-08ba0d4113ceabc75',
    resource_type: 'EbsVolume',
    resource_id: 'vol-08ba0d4113ceabc75',
    resource_tags: '{"Environment":"Mekong","Team":"Platform/Digital","CostCenter":"CC-001","Exempt":"true"}',
    recommended_action: 'Delete',
    current_config: '5 GB gp2 unattached',
    recommended_config: 'Delete volume',
    estimated_savings: 0.5,
    currency: 'USD',
    region: 'ap-southeast-2',
    source: 'AWS Compute Optimizer',
    processed_env_tag: 'Mekong',
    owner_tag: 'Platform/Digital',
    processing_status: 'EXEMPTED',
    full_ai_output: 'Exempt — retained for disaster recovery testing.',
    go_nogo: null,
    submitted_by: null,
    approved_by: null,
    generated_script: null,
    created_at: '2024-01-10T08:00:00Z',
  },
  {
    recommendation_id: 'rec-007',
    aws_account: '234567890123',
    resource_arn: 'arn:aws:ec2:ap-southeast-2:234567890123:volume/vol-0d14c6b3f7a8e2b91',
    resource_type: 'EbsVolume',
    resource_id: 'vol-0d14c6b3f7a8e2b91',
    resource_tags: '{"Environment":"Yarra","Team":"Retail","CostCenter":"CC-002","Exempt":"true"}',
    recommended_action: 'Delete',
    current_config: '5 GB gp2 unattached',
    recommended_config: 'Delete volume',
    estimated_savings: 0.5,
    currency: 'USD',
    region: 'ap-southeast-2',
    source: 'AWS Cost Explorer',
    processed_env_tag: 'Yarra',
    owner_tag: 'Retail',
    processing_status: 'EXEMPTED',
    full_ai_output: 'Exempt — compliance hold until audit completion.',
    go_nogo: null,
    submitted_by: null,
    approved_by: null,
    generated_script: null,
    created_at: '2024-01-10T09:00:00Z',
  },
  {
    recommendation_id: 'rec-008',
    aws_account: '345678901234',
    resource_arn: 'arn:aws:ec2:ap-southeast-2:345678901234:volume/vol-0f92c4a5d6b7e1f83',
    resource_type: 'EbsVolume',
    resource_id: 'vol-0f92c4a5d6b7e1f83',
    resource_tags: '{"Environment":"Congo","Team":"Core Wagering","CostCenter":"CC-003","Exempt":"true"}',
    recommended_action: 'Delete',
    current_config: '5 GB gp2 unattached',
    recommended_config: 'Delete volume',
    estimated_savings: 0.5,
    currency: 'USD',
    region: 'ap-southeast-2',
    source: 'AWS Compute Optimizer',
    processed_env_tag: 'Congo',
    owner_tag: 'Core Wagering',
    processing_status: 'EXEMPTED',
    full_ai_output: 'Exempt — pending team review.',
    go_nogo: null,
    submitted_by: null,
    approved_by: null,
    generated_script: null,
    created_at: '2024-01-10T10:00:00Z',
  },
  {
    recommendation_id: 'rec-009',
    aws_account: '456789012345',
    resource_arn: 'arn:aws:ec2:ap-southeast-2:456789012345:volume/vol-0e23b7f9a4c5d6781',
    resource_type: 'EbsVolume',
    resource_id: 'vol-0e23b7f9a4c5d6781',
    resource_tags: '{"Environment":"Non-Production","Team":"Retail","CostCenter":"CC-002","Exempt":"true"}',
    recommended_action: 'Delete',
    current_config: '5 GB gp2 unattached',
    recommended_config: 'Delete volume',
    estimated_savings: 0.5,
    currency: 'USD',
    region: 'ap-southeast-2',
    source: 'AWS Cost Explorer',
    processed_env_tag: 'Non-Production',
    owner_tag: 'Retail',
    processing_status: 'EXEMPTED',
    full_ai_output: 'Exempt — used for load testing.',
    go_nogo: null,
    submitted_by: null,
    approved_by: null,
    generated_script: null,
    created_at: '2024-01-10T11:00:00Z',
  },
  {
    recommendation_id: 'rec-010',
    aws_account: '567890123456',
    resource_arn: 'arn:aws:ec2:ap-southeast-2:567890123456:volume/vol-0ac88635b2d11e576',
    resource_type: 'EbsVolume',
    resource_id: 'vol-0ac88635b2d11e576',
    resource_tags: '{"Environment":"Mekong","Team":"Core Wagering","CostCenter":"CC-003","Exempt":"true"}',
    recommended_action: 'Delete',
    current_config: '5 GB gp2 unattached',
    recommended_config: 'Delete volume',
    estimated_savings: 0.5,
    currency: 'USD',
    region: 'ap-southeast-2',
    source: 'AWS Compute Optimizer',
    processed_env_tag: 'Mekong',
    owner_tag: 'Core Wagering',
    processing_status: 'EXEMPTED',
    full_ai_output: 'Exempt — scheduled for migration next quarter.',
    go_nogo: null,
    submitted_by: null,
    approved_by: null,
    generated_script: null,
    created_at: '2024-01-10T12:00:00Z',
  },
]

// In-memory store for mutations
let mockData: Recommendation[] = [...MOCK_RECOMMENDATIONS]

function applyFilters(data: Recommendation[], filters?: Partial<FilterState>): Recommendation[] {
  if (!filters) return data

  return data.filter((rec) => {
    if (filters.search) {
      const search = filters.search.toLowerCase()
      if (
        !rec.resource_id.toLowerCase().includes(search) &&
        !rec.resource_arn.toLowerCase().includes(search)
      ) {
        return false
      }
    }
    if (filters.environment && filters.environment.length > 0) {
      if (!filters.environment.includes(rec.processed_env_tag)) return false
    }
    if (filters.team && filters.team.length > 0) {
      if (!filters.team.includes(rec.owner_tag)) return false
    }
    if (filters.resourceType && filters.resourceType.length > 0) {
      if (!filters.resourceType.includes(rec.resource_type)) return false
    }
    if (filters.status && filters.status.length > 0) {
      if (!filters.status.includes(rec.processing_status)) return false
    }
    if (filters.goNogo && filters.goNogo !== 'all') {
      if (filters.goNogo === 'GO' && rec.go_nogo !== 'GO') return false
      if (filters.goNogo === 'NO_GO' && rec.go_nogo !== 'NO_GO') return false
    }
    return true
  })
}

export async function getRecommendations(filters?: Partial<FilterState>): Promise<Recommendation[]> {
  if (!BASE_URL) {
    await new Promise((r) => setTimeout(r, 400))
    return applyFilters(mockData, filters)
  }

  const params = new URLSearchParams()
  if (filters?.search) params.set('search', filters.search)
  if (filters?.environment?.length) params.set('env', filters.environment.join(','))
  if (filters?.team?.length) params.set('team', filters.team.join(','))
  if (filters?.resourceType?.length) params.set('resource_type', filters.resourceType.join(','))
  if (filters?.status?.length) params.set('status', filters.status.join(','))
  if (filters?.goNogo && filters.goNogo !== 'all') params.set('go_nogo', filters.goNogo)

  const res = await fetch(`${BASE_URL}/recommendations?${params.toString()}`)
  if (!res.ok) throw new Error('Failed to fetch recommendations')
  const data = await res.json()
  // API returns { items: [...], count: N }
  return Array.isArray(data) ? data : (data.items ?? [])
}

export async function updateGoNogo(id: string, decision: GoNoGo): Promise<Recommendation> {
  if (!BASE_URL) {
    await new Promise((r) => setTimeout(r, 200))
    const index = mockData.findIndex((r) => r.recommendation_id === id)
    if (index !== -1) {
      mockData[index] = { ...mockData[index], go_nogo: decision }
      return mockData[index]
    }
    throw new Error('Recommendation not found')
  }

  const res = await fetch(`${BASE_URL}/recommendations/${id}/decision`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ go_nogo: decision }),
  })
  if (!res.ok) throw new Error('Failed to update GO/NO-GO decision')
  return res.json()
}

export async function submitForApproval(ids: string[], submittedBy: string): Promise<void> {
  if (!BASE_URL) {
    await new Promise((r) => setTimeout(r, 500))
    mockData = mockData.map((r) =>
      ids.includes(r.recommendation_id)
        ? { ...r, processing_status: 'PENDING_APPROVAL', submitted_by: submittedBy }
        : r
    )
    return
  }

  const res = await fetch(`${BASE_URL}/recommendations/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recommendation_ids: ids, submitted_by: submittedBy }),
  })
  if (!res.ok) throw new Error('Failed to submit for approval')
}

export async function approveRemediation(id: string, approvedBy: string): Promise<void> {
  if (!BASE_URL) {
    await new Promise((r) => setTimeout(r, 500))
    const index = mockData.findIndex((r) => r.recommendation_id === id)
    if (index !== -1) {
      mockData[index] = {
        ...mockData[index],
        processing_status: 'COMPLETED',
        approved_by: approvedBy,
      }
    }
    return
  }

  const res = await fetch(`${BASE_URL}/recommendations/${id}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ approved_by: approvedBy }),
  })
  if (!res.ok) throw new Error('Failed to approve remediation')
}

export async function denyRemediation(id: string, approvedBy: string): Promise<void> {
  if (!BASE_URL) {
    await new Promise((r) => setTimeout(r, 500))
    const index = mockData.findIndex((r) => r.recommendation_id === id)
    if (index !== -1) {
      mockData[index] = {
        ...mockData[index],
        processing_status: 'DENIED',
        approved_by: approvedBy,
      }
    }
    return
  }

  const res = await fetch(`${BASE_URL}/recommendations/${id}/deny`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ approved_by: approvedBy }),
  })
  if (!res.ok) throw new Error('Failed to deny remediation')
}

export async function getApprovals(): Promise<Recommendation[]> {
  if (!BASE_URL) {
    const all = await getRecommendations()
    return all.filter((r) => r.processing_status === 'PENDING_APPROVAL')
  }

  const res = await fetch(`${BASE_URL}/recommendations/pending`)
  if (!res.ok) throw new Error('Failed to fetch pending approvals')
  const data = await res.json()
  return Array.isArray(data) ? data : (data.items ?? [])
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: { text: string }[]
}

export interface ChatResponse {
  response: string
  history: ChatMessage[]
}

export async function sendChatMessage(
  message: string,
  history: ChatMessage[]
): Promise<ChatResponse> {
  if (!BASE_URL) {
    await new Promise((r) => setTimeout(r, 800))
    return {
      response:
        '## Cost Optimization Summary\n\n**Platform/Digital** has the biggest opportunity with $2.50/month in potential savings across 5 unattached EBS volumes.\n\n### Top Actions\n- Delete unattached EBS volumes in Mekong and Yarra environments\n- Review Non-Production instances for right-sizing\n\n| Team | Resources | Savings |\n|------|-----------|--------|\n| Platform/Digital | 5 | $2.50/mo |\n| Core Wagering | 2 | $1.00/mo |\n| Retail | 1 | $0.50/mo |',
      history: [
        ...history,
        { role: 'user', content: [{ text: message }] },
        {
          role: 'assistant',
          content: [
            {
              text: '## Cost Optimization Summary\n\nPlatform/Digital has the biggest opportunity.',
            },
          ],
        },
      ],
    }
  }

  const res = await fetch(`${BASE_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
  })
  if (!res.ok) throw new Error('Chat request failed')
  return res.json()
}
