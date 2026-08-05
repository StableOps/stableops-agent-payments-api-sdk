import { version } from '../package.json'

import { AgentPaymentsApiError } from './errors'

export type AgentPaymentsClientOptions = {
  apiKey?: string
  accessToken?: string
  environment?: 'sandbox' | 'live'
  baseUrl?: string
  fetch?: typeof fetch
  timeoutMs?: number
}

type Request = {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  path: string
  body?: unknown
}

export class AgentPaymentsHttpClient {
  private readonly baseUrl: string
  private readonly fetchImpl: typeof fetch
  private readonly timeoutMs: number
  private readonly headers: Record<string, string>
  private readonly dashboardSession: boolean

  constructor(options: AgentPaymentsClientOptions) {
    if (options.apiKey && options.accessToken) {
      throw new AgentPaymentsApiError(
        0,
        'invalid_configuration',
        'apiKey and accessToken cannot be used together',
      )
    }
    this.baseUrl = (options.baseUrl ?? 'https://api.stableops.dev').replace(/\/+$/u, '')
    this.fetchImpl = options.fetch ?? fetch.bind(globalThis)
    this.timeoutMs = options.timeoutMs ?? 30_000
    this.dashboardSession = Boolean(options.accessToken)
    this.headers = {
      accept: 'application/json',
      'content-type': 'application/json',
      'x-stableops-env': options.environment ?? 'sandbox',
    }
    if (typeof document === 'undefined') {
      this.headers['user-agent'] = `StableOpsAgentPaymentsSDK/${version}`
    }
    if (options.apiKey) this.headers.authorization = `Bearer ${options.apiKey}`
    if (options.accessToken) {
      this.headers['x-stableops-clerk-token'] = options.accessToken
    }
  }

  async request<T>(request: Request): Promise<T> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.timeoutMs)
    try {
      const path = this.dashboardSession
        ? request.path.replace('/v1/agent-payments', '/v1/dashboard/agent-payments')
        : request.path
      const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
        method: request.method,
        headers: this.headers,
        body: request.body === undefined ? undefined : JSON.stringify(request.body),
        signal: controller.signal,
      })
      const text = await response.text()
      const payload = text ? parseJson(text) : null
      if (!response.ok) {
        const error = asErrorPayload(payload)
        throw new AgentPaymentsApiError(
          response.status,
          error.code ?? 'api_error',
          error.message ?? response.statusText,
          payload,
        )
      }
      return payload as T
    } catch (error) {
      if (error instanceof AgentPaymentsApiError) throw error
      throw new AgentPaymentsApiError(
        0,
        error instanceof DOMException && error.name === 'AbortError'
          ? 'request_timeout'
          : 'network_error',
        error instanceof Error ? error.message : String(error),
        error,
      )
    } finally {
      clearTimeout(timer)
    }
  }
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    throw new AgentPaymentsApiError(0, 'invalid_response', 'API returned invalid JSON')
  }
}

function asErrorPayload(value: unknown): { code?: string; message?: string } {
  if (!value || typeof value !== 'object') return {}
  const record = value as Record<string, unknown>
  return {
    code: typeof record.code === 'string' ? record.code : undefined,
    message:
      typeof record.message === 'string'
        ? record.message
        : Array.isArray(record.message)
          ? record.message.join('; ')
          : undefined,
  }
}
