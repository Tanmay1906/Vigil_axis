import { getAuthPayload } from '../utils/auth'

const runtimeApiBase = (window as { __VIGIL_API_BASE__?: string }).__VIGIL_API_BASE__
const API_BASE = (runtimeApiBase || 'http://127.0.0.1:5000/api').replace(/\/$/, '')

export interface DashboardStats {
  pending: number
  completed: number
  integrity_score: number
  total_cases: number
  total_evidence: number
}

export interface LedgerEntry {
  case_id: string
  evidence_id: string | null
  tx_hash: string
  block_number: number
  block_timestamp: number
}

export interface CaseEvidence {
  case_id: string
  evidence_id: string
  hash: string
  uploaded_at_ist: string | null
  tx_hash: string | null
  investigator: string | null
  collector: string | null
  case_description: string | null
  evidence_description: string | null
}

export interface VerificationSourceResponse {
  status: string
  case_id: string
  source_hash: string
  txid: string | null
  block_timestamp: number | null
  evidence: CaseEvidence[] | CaseEvidence
}

export interface UploadEvidenceResponse {
  status: string
  case_id: string
  evidence_id: string
  hash: string
  txid: string | null
  block_number: number | null
  block_timestamp: number | null
}

export interface CaseRecord {
  case_id: string
  case_txn_hash: string | null
  created_at_ist: string | null
  investigator: string | null
  description: string | null
}

export interface AuditTrailEvent {
  audit_id: number
  action: string
  actor: string
  txid: string | null
  evidence_id: string | null
  details: Record<string, unknown>
  occurred_at_ist: string | null
}

export interface AuditCaseSummary {
  case: {
    case_id: string
    case_txn_hash: string | null
    created_at_ist: string | null
    investigator: string | null
    description: string | null
  }
  evidence: Array<{
    evidence_id: string
    hash: string
    uploaded_at_ist: string | null
    evidence_collector_name: string | null
    description: string | null
  }>
  audit_trail: AuditTrailEvent[]
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController()
  const timeoutMs = 20000
  const timeout = window.setTimeout(() => controller.abort('REQUEST_TIMEOUT'), timeoutMs)

  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      cache: 'no-store',
      signal: controller.signal,
      headers: {
        ...(init?.headers || {}),
      },
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs / 1000}s. Please retry.`)
    }
    throw error
  } finally {
    window.clearTimeout(timeout)
  }

  if (!response.ok) {
    const raw = await response.text()
    let parsedMessage = ''
    try {
      const parsed = JSON.parse(raw) as { message?: string; error?: string; status?: string; existing_case_id?: string; existing_evidence_id?: string }
      if (parsed.message && parsed.status === 'exists') {
        parsedMessage = `${parsed.message} Existing: ${parsed.existing_case_id || 'N/A'} / ${parsed.existing_evidence_id || 'N/A'}`
      } else {
        parsedMessage = parsed.error || parsed.message || ''
      }
    } catch {
      parsedMessage = raw
    }

    throw new Error(parsedMessage || `Request failed with status ${response.status}`)
  }

  return response.json() as Promise<T>
}

export function fetchDashboardStats(): Promise<DashboardStats> {
  return request<{ status: string; stats: DashboardStats }>('/dashboard/stats').then((payload) => payload.stats)
}

export async function fetchLedgerEntries(limit = 50): Promise<LedgerEntry[]> {
  const payload = await request<{ status: string; entries: LedgerEntry[] }>(`/dashboard/ledger?limit=${Math.max(1, limit)}`)
  return payload.entries
}

export async function fetchVerificationCases(limit = 200): Promise<CaseEvidence[]> {
  const payload = await request<{ status: string; cases: CaseEvidence[] }>(`/verification/cases?limit=${Math.max(1, limit)}`)
  return payload.cases
}

export function fetchVerificationSourceByCase(caseId: string): Promise<VerificationSourceResponse> {
  return request<VerificationSourceResponse>(`/verification/source/${encodeURIComponent(caseId)}`)
}

export function fetchVerificationSourceByEvidence(evidenceId: string): Promise<VerificationSourceResponse> {
  return request<VerificationSourceResponse>(`/verification/source/evidence/${encodeURIComponent(evidenceId)}`)
}

export async function uploadEvidenceFile(
  file: File,
  options?: {
    collectorId?: string
    investigator?: string
    caseId?: string
    caseDescription?: string
    evidenceDescription?: string
  },
): Promise<UploadEvidenceResponse> {
  const formData = new FormData()
  formData.append('file', file)
  if (options?.collectorId && options.collectorId.trim()) {
    formData.append('collector_id', options.collectorId.trim())
  }
  if (options?.investigator && options.investigator.trim()) {
    formData.append('investigator', options.investigator.trim())
  }
  if (options?.caseId && options.caseId.trim()) {
    formData.append('case_id', options.caseId.trim())
  }
  if (options?.caseDescription && options.caseDescription.trim()) {
    formData.append('case_description', options.caseDescription.trim())
  }
  if (options?.evidenceDescription && options.evidenceDescription.trim()) {
    formData.append('evidence_description', options.evidenceDescription.trim())
  }

  return request<UploadEvidenceResponse>('/evidence/upload', {
    method: 'POST',
    body: formData,
  })
}

export async function fetchCaseRecords(limit = 200): Promise<CaseRecord[]> {
  const payload = await request<{ status: string; cases: CaseRecord[] }>(`/evidence/cases?limit=${Math.max(1, limit)}`)
  return payload.cases
}

export async function createCaseRecord(input: { investigator: string; case_description: string }): Promise<CaseRecord> {
  const payload = await request<{ status: string; case: CaseRecord }>('/evidence/cases', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })
  return payload.case
}

export function buildCertificateUrl(evidenceId: string): string {
  const auth = getAuthPayload()
  const submitter = auth?.username || 'UNKNOWN_SUBMITTER'
  return `${API_BASE}/reports/evidence/${encodeURIComponent(evidenceId)}?submitter=${encodeURIComponent(submitter)}`
}

export async function fetchAuditSummary(caseId?: string): Promise<AuditCaseSummary> {
  const path = caseId
    ? `/audit/summary/${encodeURIComponent(caseId)}`
    : '/audit/summary'
  const payload = await request<{ status: string; summary: AuditCaseSummary }>(path)
  return payload.summary
}

export function buildAuditReportUrl(caseId?: string): string {
  if (!caseId) {
    return `${API_BASE}/audit/report`
  }
  return `${API_BASE}/audit/report/${encodeURIComponent(caseId)}`
}
