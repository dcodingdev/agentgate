export type ScreenId =
  | 'setup'
  | 'live-sandbox'
  | 'approval-gate'
  | 'finished'
  | 'policies'

export type TerminologyMode = 'plain' | 'both' | 'tech'

export type NavItemId =
  | 'new-run'
  | 'runs'
  | 'sign-off'
  | 'policies'
  | 'settings'

export interface StageDefinition {
  step: string
  plain: string
  tech: string
  role: string
  category: 'background' | 'foreground' | 'human' | 'delivery'
}

export const STAGES_CATALOG: StageDefinition[] = [
  {
    step: '01',
    plain: 'Security Check',
    tech: 'guardrail',
    role: 'Pre-flight validation, permission scopes, branch protection check',
    category: 'background',
  },
  {
    step: '02',
    plain: 'Planning',
    tech: 'supervisor',
    role: 'Synthesizes plan, dispatches tasks, and handles change requests',
    category: 'background',
  },
  {
    step: '03',
    plain: 'Code Research',
    tech: 'code_search, issue_analysis',
    role: 'Multi-agent codebase reconnaissance and doc lookup',
    category: 'background',
  },
  {
    step: '04',
    plain: 'Patch & Test',
    tech: 'fix_test (sandbox)',
    role: 'Code generation and test runner in isolated sandbox',
    category: 'foreground',
  },
  {
    step: '05',
    plain: 'Verification',
    tech: 'verify',
    role: 'Executes pytest, regression matrix, coverage diff, and static SAST scans',
    category: 'foreground',
  },
  {
    step: '06',
    plain: 'Risk Review',
    tech: 'reviewer',
    role: 'Evaluates modifications against policy score ceilings (e.g. 0.85 vs 0.70 threshold)',
    category: 'foreground',
  },
  {
    step: '07',
    plain: 'Human Sign-Off',
    tech: 'hitl (interrupt)',
    role: 'Mandatory human decision gate pausing autonomous dispatch',
    category: 'human',
  },
  {
    step: '08',
    plain: 'Publish PR',
    tech: 'pr_agent',
    role: 'Creates the upstream Pull Request on GitHub once cleared',
    category: 'delivery',
  },
]

export type StageStatus = 'Done' | 'Running' | 'Waiting' | 'Escalated'

export type GraphNodeId =
  | 'guardrail'
  | 'supervisor'
  | 'issue_analysis'
  | 'code_search'
  | 'docs_lookup'
  | 'aggregate_research'
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
  retry_cap?: number
  policy_threshold?: number
  auto_open_pr?: boolean
  team_lead_guidance?: string
  github_token?: string
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
  pr_url?: string | null
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
