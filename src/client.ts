import {
  AgentPaymentsHttpClient,
  type AgentPaymentsClientOptions,
} from './http'
import type {
  AgentCredential,
  AgentPayment,
  AgentPaymentApproval,
  AgentPaymentBudget,
  AgentPaymentReceipt,
  AgentPaymentTransition,
  AgentWallet,
  AgentWalletBinding,
  AgentWalletPairingChallenge,
  PaymentAgent,
  SpendingPolicyDocument,
  SpendingPolicyVersion,
} from './types'

const ROOT = '/v1/agent-payments'

export class StableOpsAgentPayments {
  readonly agents: PaymentAgentsApi
  readonly wallets: AgentWalletsApi
  readonly budgets: AgentPaymentBudgetsApi
  readonly approvals: AgentPaymentApprovalsApi
  readonly payments: AgentPaymentQueriesApi

  constructor(options: AgentPaymentsClientOptions = {}) {
    const http = new AgentPaymentsHttpClient(options)
    this.agents = new PaymentAgentsApi(http)
    this.wallets = new AgentWalletsApi(http)
    this.budgets = new AgentPaymentBudgetsApi(http)
    this.approvals = new AgentPaymentApprovalsApi(http)
    this.payments = new AgentPaymentQueriesApi(http)
  }
}

export class PaymentAgentsApi {
  constructor(private readonly http: AgentPaymentsHttpClient) {}

  async create(input: { name: string; description?: string }): Promise<PaymentAgent> {
    return fromWireAgent(
      await this.http.request<WirePaymentAgent>({
        method: 'POST',
        path: `${ROOT}/agents`,
        body: input,
      }),
    )
  }

  async list(): Promise<PaymentAgent[]> {
    const response = await this.http.request<{ data: WirePaymentAgent[] }>({
      method: 'GET',
      path: `${ROOT}/agents`,
    })
    return response.data.map(fromWireAgent)
  }

  async get(agentId: string): Promise<PaymentAgent> {
    return fromWireAgent(
      await this.http.request<WirePaymentAgent>({
        method: 'GET',
        path: `${ROOT}/agents/${segment(agentId)}`,
      }),
    )
  }

  async update(
    agentId: string,
    input: { name?: string; description?: string | null },
  ): Promise<PaymentAgent> {
    return fromWireAgent(
      await this.http.request<WirePaymentAgent>({
        method: 'PATCH',
        path: `${ROOT}/agents/${segment(agentId)}`,
        body: input,
      }),
    )
  }

  async pause(agentId: string): Promise<PaymentAgent> {
    return this.changeStatus(agentId, 'pause')
  }

  async resume(agentId: string): Promise<PaymentAgent> {
    return this.changeStatus(agentId, 'resume')
  }

  async createKey(
    agentId: string,
    input: { name: string; expiresAt?: string },
  ): Promise<AgentCredential> {
    return fromWireCredential(
      await this.http.request<WireAgentCredential>({
        method: 'POST',
        path: `${ROOT}/agents/${segment(agentId)}/keys`,
        body: {
          name: input.name,
          expires_at: input.expiresAt,
        },
      }),
    )
  }

  async listKeys(agentId: string): Promise<AgentCredential[]> {
    const response = await this.http.request<{ data: WireAgentCredential[] }>({
      method: 'GET',
      path: `${ROOT}/agents/${segment(agentId)}/keys`,
    })
    return response.data.map(fromWireCredential)
  }

  revokeKey(agentId: string, keyId: string): Promise<{ success: boolean }> {
    return this.http.request({
      method: 'DELETE',
      path: `${ROOT}/agents/${segment(agentId)}/keys/${segment(keyId)}`,
    })
  }

  async createPolicyVersion(
    agentId: string,
    document: SpendingPolicyDocument,
  ): Promise<SpendingPolicyVersion> {
    return fromWirePolicy(
      await this.http.request<WireSpendingPolicyVersion>({
        method: 'POST',
        path: `${ROOT}/agents/${segment(agentId)}/policy-versions`,
        body: policyToWire(document),
      }),
    )
  }

  async listPolicyVersions(agentId: string): Promise<SpendingPolicyVersion[]> {
    const response = await this.http.request<{ data: WireSpendingPolicyVersion[] }>({
      method: 'GET',
      path: `${ROOT}/agents/${segment(agentId)}/policy-versions`,
    })
    return response.data.map(fromWirePolicy)
  }

  async getPolicyVersion(
    agentId: string,
    versionId: string,
  ): Promise<SpendingPolicyVersion> {
    return fromWirePolicy(
      await this.http.request<WireSpendingPolicyVersion>({
        method: 'GET',
        path: `${ROOT}/agents/${segment(agentId)}/policy-versions/${segment(versionId)}`,
      }),
    )
  }

  async activatePolicyVersion(
    agentId: string,
    versionId: string,
  ): Promise<SpendingPolicyVersion> {
    return fromWirePolicy(
      await this.http.request<WireSpendingPolicyVersion>({
        method: 'POST',
        path: `${ROOT}/agents/${segment(agentId)}/policy-versions/${segment(versionId)}/activate`,
      }),
    )
  }

  private async changeStatus(agentId: string, action: 'pause' | 'resume') {
    return fromWireAgent(
      await this.http.request<WirePaymentAgent>({
        method: 'POST',
        path: `${ROOT}/agents/${segment(agentId)}/${action}`,
      }),
    )
  }
}

export class AgentWalletsApi {
  constructor(private readonly http: AgentPaymentsHttpClient) {}

  async createPairingChallenge(input: {
    network: import('./types').AgentPaymentNetwork
    address: string
  }): Promise<AgentWalletPairingChallenge> {
    const wire = await this.http.request<WireWalletChallenge>({
      method: 'POST',
      path: `${ROOT}/wallets/pairing-challenges`,
      body: input,
    })
    return {
      challengeId: wire.challenge_id,
      address: wire.address,
      network: wire.network,
      message: wire.message,
      expiresAt: wire.expires_at,
    }
  }

  async register(input: {
    challengeId: string
    signature: string
    signerType: 'LOCAL_TEST' | 'AWS_KMS'
    signerKeyId: string
  }): Promise<AgentWallet> {
    return fromWireWallet(
      await this.http.request<WireAgentWallet>({
        method: 'POST',
        path: `${ROOT}/wallets`,
        body: {
          challenge_id: input.challengeId,
          signature: input.signature,
          signer_type: input.signerType,
          signer_key_id: input.signerKeyId,
        },
      }),
    )
  }

  async list(): Promise<AgentWallet[]> {
    const response = await this.http.request<{ data: WireAgentWallet[] }>({
      method: 'GET',
      path: `${ROOT}/wallets`,
    })
    return response.data.map(fromWireWallet)
  }

  async bind(
    agentId: string,
    input: { agentWalletId: string; network: import('./types').AgentPaymentNetwork },
  ): Promise<AgentWalletBinding> {
    const wire = await this.http.request<WireWalletBinding>({
      method: 'POST',
      path: `${ROOT}/agents/${segment(agentId)}/wallet-bindings`,
      body: {
        agent_wallet_id: input.agentWalletId,
        network: input.network,
      },
    })
    return {
      id: wire.id,
      paymentAgentId: wire.payment_agent_id,
      agentWalletId: wire.agent_wallet_id,
      network: wire.network,
      isDefault: wire.is_default,
      createdAt: wire.created_at,
    }
  }

  unbind(agentId: string, bindingId: string): Promise<{ success: boolean }> {
    return this.http.request({
      method: 'DELETE',
      path: `${ROOT}/agents/${segment(agentId)}/wallet-bindings/${segment(bindingId)}`,
    })
  }
}

export class AgentPaymentBudgetsApi {
  constructor(private readonly http: AgentPaymentsHttpClient) {}

  getOrganization(): Promise<AgentPaymentBudget> {
    return this.get(`${ROOT}/budgets/organization`)
  }

  getAgent(agentId: string): Promise<AgentPaymentBudget> {
    return this.get(`${ROOT}/agents/${segment(agentId)}/budget`)
  }

  updateOrganization(limitAtomic: string): Promise<AgentPaymentBudget> {
    return this.update(`${ROOT}/budgets/organization`, limitAtomic)
  }

  updateAgent(agentId: string, limitAtomic: string): Promise<AgentPaymentBudget> {
    return this.update(`${ROOT}/agents/${segment(agentId)}/budget`, limitAtomic)
  }

  private async get(path: string) {
    return fromWireBudget(
      await this.http.request<WireBudget>({
        method: 'GET',
        path,
      }),
    )
  }

  private async update(path: string, limitAtomic: string) {
    return fromWireBudget(
      await this.http.request<WireBudget>({
        method: 'PATCH',
        path,
        body: { limit_atomic: limitAtomic },
      }),
    )
  }
}

export class AgentPaymentApprovalsApi {
  constructor(private readonly http: AgentPaymentsHttpClient) {}

  async list(): Promise<AgentPaymentApproval[]> {
    const response = await this.http.request<{ data: WireApproval[] }>({
      method: 'GET',
      path: `${ROOT}/approvals`,
    })
    return response.data.map(fromWireApproval)
  }

  async get(approvalId: string): Promise<AgentPaymentApproval> {
    return fromWireApproval(
      await this.http.request<WireApproval>({
        method: 'GET',
        path: `${ROOT}/approvals/${segment(approvalId)}`,
      }),
    )
  }

  approve(approvalId: string, reason?: string): Promise<unknown> {
    return this.decide(approvalId, 'approve', reason)
  }

  reject(approvalId: string, reason?: string): Promise<unknown> {
    return this.decide(approvalId, 'reject', reason)
  }

  private decide(approvalId: string, action: 'approve' | 'reject', reason?: string) {
    return this.http.request({
      method: 'POST',
      path: `${ROOT}/approvals/${segment(approvalId)}/${action}`,
      body: { reason },
    })
  }
}

export class AgentPaymentQueriesApi {
  constructor(private readonly http: AgentPaymentsHttpClient) {}

  async list(): Promise<AgentPayment[]> {
    const response = await this.http.request<{ data: WirePayment[] }>({
      method: 'GET',
      path: `${ROOT}/payments`,
    })
    return response.data.map(fromWirePayment)
  }

  async get(intentId: string): Promise<AgentPayment> {
    return fromWirePayment(
      await this.http.request<WirePayment>({
        method: 'GET',
        path: `${ROOT}/payments/${segment(intentId)}`,
      }),
    )
  }

  async transitions(intentId: string): Promise<AgentPaymentTransition[]> {
    const response = await this.http.request<{ data: WireTransition[] }>({
      method: 'GET',
      path: `${ROOT}/payments/${segment(intentId)}/transitions`,
    })
    return response.data.map((wire) => ({
      id: wire.id,
      sequence: wire.sequence,
      fromPaymentStatus: wire.from_payment_status,
      toPaymentStatus: wire.to_payment_status,
      fromResourceStatus: wire.from_resource_status,
      toResourceStatus: wire.to_resource_status,
      reasonCode: wire.reason_code,
      actorType: wire.actor_type,
      actorId: wire.actor_id,
      metadata: wire.metadata,
      createdAt: wire.created_at,
    }))
  }

  async receipt(intentId: string): Promise<AgentPaymentReceipt> {
    const wire = await this.http.request<WireReceipt>({
      method: 'GET',
      path: `${ROOT}/payments/${segment(intentId)}/receipt`,
    })
    return {
      id: wire.id,
      intentId: wire.intent_id,
      authorizationId: wire.authorization_id,
      requestOutcome: wire.request_outcome,
      httpStatus: wire.http_status,
      paymentResponse: wire.payment_response,
      resourceBodyHash: wire.resource_body_hash,
      signatureHash: wire.signature_hash,
      transactionHash: wire.transaction_hash,
      settlementBlockNumber: wire.settlement_block_number,
      settlementBlockHash: wire.settlement_block_hash,
      reportedAt: wire.reported_at,
      createdAt: wire.created_at,
    }
  }
}

type WirePaymentAgent = {
  id: string
  name: string
  description: string | null
  status: PaymentAgent['status']
  environment: PaymentAgent['environment']
  active_policy_version_id: string | null
  created_at: string
  updated_at: string
}

type WireAgentCredential = {
  id: string
  name: string
  key_prefix: string
  last_used_at: string | null
  expires_at: string | null
  revoked_at: string | null
  created_at: string
  secret?: string
}

type WireAgentWallet = {
  id: string
  network: import('./types').AgentPaymentNetwork
  address: string
  signer_type: AgentWallet['signerType']
  signer_key_id: string
  status: AgentWallet['status']
  verified_at: string
  created_at: string
  updated_at: string
}

type WireWalletChallenge = {
  challenge_id: string
  address: string
  network: import('./types').AgentPaymentNetwork
  message: string
  expires_at: string
}

type WireWalletBinding = {
  id: string
  payment_agent_id: string
  agent_wallet_id: string
  network: import('./types').AgentPaymentNetwork
  is_default: boolean
  created_at: string
}

type WireSpendingPolicyDocument = {
  network: import('./types').AgentPaymentNetwork
  asset: { symbol: 'USDC'; contract_address: string }
  allowed_origins: string[]
  allowed_pay_to: string[]
  automatic_payment_threshold_atomic: string
  per_payment_limit_atomic: string
  agent_daily_limit_atomic: string
  require_approval_for_unknown_origin: true
  require_approval_for_unknown_pay_to: true
}

type WireSpendingPolicyVersion = {
  id: string
  agent_id: string
  version: number
  document: WireSpendingPolicyDocument
  document_hash: string
  created_by: string | null
  created_at: string
  activated_at: string | null
  superseded_at: string | null
}

type WireBudget = {
  agent_id?: string
  asset: 'USDC'
  decimals: 6
  window_start: string
  window_end: string
  limit_atomic: string
  reserved_atomic: string
  committed_atomic: string
  settled_atomic: string
  available_atomic: string
}

type WireApproval = {
  id: string
  intent_id: string
  agent_id: string
  agent_name: string
  agent_wallet_id: string | null
  wallet_address: string | null
  status: AgentPaymentApproval['status']
  origin: string
  pay_to: string
  network: string
  asset_contract: string
  max_amount_atomic: string
  asset_decimals: number
  expires_at: string
  decided_by: string | null
  decided_at: string | null
  decision_reason: string | null
  created_at: string
}

type WirePayment = {
  id: string
  agent_id: string
  agent_name: string
  payment_status: AgentPayment['paymentStatus']
  resource_status: AgentPayment['resourceStatus']
  method: 'GET'
  resource_url: string
  origin: string
  pay_to: string
  network: string
  asset: 'USDC'
  asset_contract: string
  asset_decimals: number
  max_amount_atomic: string
  transaction_hash: string | null
  settlement_block_number: string | null
  settlement_block_hash: string | null
  created_at: string
  updated_at: string
  settled_at: string | null
  requirements?: unknown
  policy_version_id?: string | null
  approval_expires_at?: string | null
}

type WireTransition = {
  id: string
  sequence: number
  from_payment_status: AgentPaymentTransition['fromPaymentStatus']
  to_payment_status: AgentPaymentTransition['toPaymentStatus']
  from_resource_status: AgentPaymentTransition['fromResourceStatus']
  to_resource_status: AgentPaymentTransition['toResourceStatus']
  reason_code: string
  actor_type: string
  actor_id: string | null
  metadata: unknown
  created_at: string
}

type WireReceipt = {
  id: string
  intent_id: string
  authorization_id: string
  request_outcome: AgentPaymentReceipt['requestOutcome']
  http_status: number | null
  payment_response: string | null
  resource_body_hash: string | null
  signature_hash: string | null
  transaction_hash: string | null
  settlement_block_number: string | null
  settlement_block_hash: string | null
  reported_at: string
  created_at: string
}

function fromWireAgent(wire: WirePaymentAgent): PaymentAgent {
  return {
    id: wire.id,
    name: wire.name,
    description: wire.description,
    status: wire.status,
    environment: wire.environment,
    activePolicyVersionId: wire.active_policy_version_id,
    createdAt: wire.created_at,
    updatedAt: wire.updated_at,
  }
}

function fromWireCredential(wire: WireAgentCredential): AgentCredential {
  return {
    id: wire.id,
    name: wire.name,
    keyPrefix: wire.key_prefix,
    lastUsedAt: wire.last_used_at,
    expiresAt: wire.expires_at,
    revokedAt: wire.revoked_at,
    createdAt: wire.created_at,
    ...(wire.secret ? { secret: wire.secret } : {}),
  }
}

function fromWireWallet(wire: WireAgentWallet): AgentWallet {
  return {
    id: wire.id,
    network: wire.network,
    address: wire.address,
    signerType: wire.signer_type,
    signerKeyId: wire.signer_key_id,
    status: wire.status,
    verifiedAt: wire.verified_at,
    createdAt: wire.created_at,
    updatedAt: wire.updated_at,
  }
}

function policyToWire(document: SpendingPolicyDocument): WireSpendingPolicyDocument {
  return {
    network: document.network,
    asset: {
      symbol: document.asset.symbol,
      contract_address: document.asset.contractAddress,
    },
    allowed_origins: document.allowedOrigins,
    allowed_pay_to: document.allowedPayTo,
    automatic_payment_threshold_atomic: document.automaticPaymentThresholdAtomic,
    per_payment_limit_atomic: document.perPaymentLimitAtomic,
    agent_daily_limit_atomic: document.agentDailyLimitAtomic,
    require_approval_for_unknown_origin: true,
    require_approval_for_unknown_pay_to: true,
  }
}

function fromWirePolicy(wire: WireSpendingPolicyVersion): SpendingPolicyVersion {
  return {
    id: wire.id,
    agentId: wire.agent_id,
    version: wire.version,
    document: {
      network: wire.document.network,
      asset: {
        symbol: wire.document.asset.symbol,
        contractAddress: wire.document.asset.contract_address,
      },
      allowedOrigins: wire.document.allowed_origins,
      allowedPayTo: wire.document.allowed_pay_to,
      automaticPaymentThresholdAtomic: wire.document.automatic_payment_threshold_atomic,
      perPaymentLimitAtomic: wire.document.per_payment_limit_atomic,
      agentDailyLimitAtomic: wire.document.agent_daily_limit_atomic,
      requireApprovalForUnknownOrigin: true,
      requireApprovalForUnknownPayTo: true,
    },
    documentHash: wire.document_hash,
    createdBy: wire.created_by,
    createdAt: wire.created_at,
    activatedAt: wire.activated_at,
    supersededAt: wire.superseded_at,
  }
}

function fromWireBudget(wire: WireBudget): AgentPaymentBudget {
  return {
    ...(wire.agent_id ? { agentId: wire.agent_id } : {}),
    asset: wire.asset,
    decimals: wire.decimals,
    windowStart: wire.window_start,
    windowEnd: wire.window_end,
    limitAtomic: wire.limit_atomic,
    reservedAtomic: wire.reserved_atomic,
    committedAtomic: wire.committed_atomic,
    settledAtomic: wire.settled_atomic,
    availableAtomic: wire.available_atomic,
  }
}

function fromWireApproval(wire: WireApproval): AgentPaymentApproval {
  return {
    id: wire.id,
    intentId: wire.intent_id,
    agentId: wire.agent_id,
    agentName: wire.agent_name,
    agentWalletId: wire.agent_wallet_id,
    walletAddress: wire.wallet_address,
    status: wire.status,
    origin: wire.origin,
    payTo: wire.pay_to,
    network: wire.network,
    assetContract: wire.asset_contract,
    maxAmountAtomic: wire.max_amount_atomic,
    assetDecimals: wire.asset_decimals,
    expiresAt: wire.expires_at,
    decidedBy: wire.decided_by,
    decidedAt: wire.decided_at,
    decisionReason: wire.decision_reason,
    createdAt: wire.created_at,
  }
}

function fromWirePayment(wire: WirePayment): AgentPayment {
  return {
    id: wire.id,
    agentId: wire.agent_id,
    agentName: wire.agent_name,
    paymentStatus: wire.payment_status,
    resourceStatus: wire.resource_status,
    method: wire.method,
    resourceUrl: wire.resource_url,
    origin: wire.origin,
    payTo: wire.pay_to,
    network: wire.network,
    asset: wire.asset,
    assetContract: wire.asset_contract,
    assetDecimals: wire.asset_decimals,
    maxAmountAtomic: wire.max_amount_atomic,
    transactionHash: wire.transaction_hash,
    settlementBlockNumber: wire.settlement_block_number,
    settlementBlockHash: wire.settlement_block_hash,
    createdAt: wire.created_at,
    updatedAt: wire.updated_at,
    settledAt: wire.settled_at,
    ...(wire.requirements !== undefined ? { requirements: wire.requirements } : {}),
    ...(wire.policy_version_id !== undefined
      ? { policyVersionId: wire.policy_version_id }
      : {}),
    ...(wire.approval_expires_at !== undefined
      ? { approvalExpiresAt: wire.approval_expires_at }
      : {}),
  }
}

function segment(value: string): string {
  return encodeURIComponent(value)
}

export type { AgentPaymentsClientOptions }
