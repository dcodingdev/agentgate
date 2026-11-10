export type ScreenId =
  | 'setup'
  | 'live-sandbox'
  | 'every-stage'
  | 'approval-gate'
  | 'clarification'
  | 'blocked'
  | 'finished'

export type StageStatus = 'Done' | 'Running' | 'Waiting' | 'Escalated'

export type GraphNodeId =
  | 'guardrail'
  | 'supervisor'
  | 'research'
  | 'fix_test'
  | 'verify'
  | 'reviewer'
  | 'hitl'
  | 'pr_agent'

export interface GraphNodeMeta {
  id: GraphNodeId
  title: string
  role: string
  description: string
}

export interface CreateRunRequest {
  issue_url: string
  repo: string
  issue_title?: string
  issue_description?: string
}

export interface CreateRunResponse {
  thread_id: string
  status: string
  stream_url: string
}

export interface ResumeBody {
  approved: boolean
  feedback?: string | null
}

export interface ResumeRunResponse {
  thread_id: string
  status: string
  message: string
}

export interface RunStateResponse {
  thread_id: string
  status: string
  risk_score: number
  pr_url?: string | null
  next_steps: string[]
  metadata?: {
    thread_id?: string
    issue_url?: string
    repo?: string
    status?: string
    risk_score?: number
    pr_url?: string | null
    error_message?: string | null
    created_at?: string
    updated_at?: string
  }
  values: Record<string, any>
}

export interface StreamEventPayload {
  event: 'status' | 'node_update' | 'hitl_paused' | 'completed' | 'rejected' | 'error' | 'done' | string
  data: {
    node?: string
    thread_id?: string
    status?: string
    risk_score?: number
    pr_url?: string | null
    message?: string
    reason?: string
    error?: string
    [key: string]: any
  }
  timestamp: string
}

export interface RepoOption {
  name: string
  status: 'test-allowed' | 'allowed' | 'not-allowed'
  statusLabel: string
  defaultIssueUrl?: string
  defaultIssueTitle?: string
}

export interface ClarificationData {
  question: string
  options: string[]
  selectedOption?: string
  customNotes?: string
}
