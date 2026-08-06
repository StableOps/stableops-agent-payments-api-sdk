export type PaymentAgentStatus = 'active' | 'paused' | 'disabled'
export type AgentPaymentNetwork =
  | 'eip155:1'
  | 'eip155:8453'
  | 'eip155:42161'
  | 'eip155:137'
  | 'eip155:10'
  | 'eip155:56'
  | 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'
  | 'eip155:11155111'
  | 'eip155:84532'
  | 'eip155:421614'
  | 'eip155:80002'
  | 'eip155:11155420'
  | 'eip155:97'
  | 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1'
export type AgentPaymentStatus =
  | 'created'
  | 'awaiting_approval'
  | 'approved'
  | 'authorization_issued'
  | 'settlement_unknown'
  | 'settled'
  | 'expired'
  | 'rejected'
  | 'failed_pre_authorization'
  | 'reverted'
  | 'paused'

export type AgentPaymentResourceStatus =
  | 'not_requested'
  | 'response_received'
  | 'unknown'
  | 'failed'

export type PaymentAgent = {
  id: string
  name: string
  description: string | null
  status: PaymentAgentStatus
  environment: 'sandbox' | 'live'
  activePolicyVersionId: string | null
  createdAt: string
  updatedAt: string
}

export type AgentCredential = {
  id: string
  name: string
  keyPrefix: string
  lastUsedAt: string | null
  expiresAt: string | null
  revokedAt: string | null
  createdAt: string
  secret?: string
}

export type AgentWallet = {
  id: string
  network: AgentPaymentNetwork
  address: string
  signerType: 'LOCAL_TEST' | 'AWS_KMS'
  signerKeyId: string
  status: 'active' | 'disabled'
  verifiedAt: string
  createdAt: string
  updatedAt: string
}

export type AgentWalletPairingChallenge = {
  challengeId: string
  address: string
  network: AgentPaymentNetwork
  message: string
  expiresAt: string
}

export type AgentWalletBinding = {
  id: string
  paymentAgentId: string
  agentWalletId: string
  network: AgentPaymentNetwork
  isDefault: boolean
  createdAt: string
}

export type SpendingPolicyDocument = {
  network: AgentPaymentNetwork
  asset: {
    symbol: 'USDC'
    contractAddress: string
  }
  allowedOrigins: string[]
  allowedPayTo: string[]
  automaticPaymentThresholdAtomic: string
  perPaymentLimitAtomic: string
  agentDailyLimitAtomic: string
  requireApprovalForUnknownOrigin: true
  requireApprovalForUnknownPayTo: true
}

export type SpendingPolicyVersion = {
  id: string
  agentId: string
  version: number
  document: SpendingPolicyDocument
  documentHash: string
  createdBy: string | null
  createdAt: string
  activatedAt: string | null
  supersededAt: string | null
}

export type AgentPaymentBudget = {
  agentId?: string
  asset: 'USDC'
  decimals: 6
  windowStart: string
  windowEnd: string
  limitAtomic: string
  reservedAtomic: string
  committedAtomic: string
  settledAtomic: string
  availableAtomic: string
}

export type AgentPaymentApproval = {
  id: string
  intentId: string
  agentId: string
  agentName: string
  agentWalletId: string | null
  walletAddress: string | null
  status: 'pending' | 'approved' | 'rejected' | 'expired'
  origin: string
  payTo: string
  network: string
  assetContract: string
  maxAmountAtomic: string
  assetDecimals: number
  expiresAt: string
  decidedBy: string | null
  decidedAt: string | null
  decisionReason: string | null
  createdAt: string
}

export type AgentPayment = {
  id: string
  agentId: string
  agentName: string
  paymentStatus: AgentPaymentStatus
  resourceStatus: AgentPaymentResourceStatus
  method: 'GET'
  resourceUrl: string
  origin: string
  payTo: string
  network: string
  asset: 'USDC'
  assetContract: string
  assetDecimals: number
  maxAmountAtomic: string
  transactionHash: string | null
  settlementBlockNumber: string | null
  settlementBlockHash: string | null
  createdAt: string
  updatedAt: string
  settledAt: string | null
  requirements?: unknown
  policyVersionId?: string | null
  approvalExpiresAt?: string | null
}

export type AgentPaymentTransition = {
  id: string
  sequence: number
  fromPaymentStatus: AgentPaymentStatus | null
  toPaymentStatus: AgentPaymentStatus
  fromResourceStatus: AgentPaymentResourceStatus | null
  toResourceStatus: AgentPaymentResourceStatus
  reasonCode: string
  actorType: string
  actorId: string | null
  metadata: unknown
  createdAt: string
}

export type AgentPaymentReceipt = {
  id: string
  intentId: string
  authorizationId: string
  requestOutcome: 'response_received' | 'timeout' | 'request_error' | 'signing_failed'
  httpStatus: number | null
  paymentResponse: string | null
  resourceBodyHash: string | null
  signatureHash: string | null
  transactionHash: string | null
  settlementBlockNumber: string | null
  settlementBlockHash: string | null
  reportedAt: string
  createdAt: string
}
