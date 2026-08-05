import { describe, expect, it, vi } from 'vitest'

import { StableOpsAgentPayments } from './client'

describe('StableOpsAgentPayments', () => {
  it('使用独立 Agent Payments 命名空间创建 Agent 并映射响应', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse({
        id: 'agent_1',
        name: '采购代理',
        description: null,
        status: 'active',
        environment: 'sandbox',
        active_policy_version_id: 'policy_1',
        created_at: '2026-07-30T00:00:00.000Z',
        updated_at: '2026-07-30T00:00:00.000Z',
      }),
    )
    const client = new StableOpsAgentPayments({
      apiKey: 'sk_sandbox_test',
      baseUrl: 'https://api.example.com',
      fetch: fetchMock,
    })

    await expect(client.agents.create({ name: '采购代理' })).resolves.toMatchObject({
      id: 'agent_1',
      activePolicyVersionId: 'policy_1',
    })
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/v1/agent-payments/agents',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          authorization: 'Bearer sk_sandbox_test',
        }),
      }),
    )
  })

  it('把策略文档映射为服务端 snake_case 契约', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse({
        id: 'policy_2',
        agent_id: 'agent_1',
        version: 2,
        document: {
          network: 'eip155:84532',
          asset: {
            symbol: 'USDC',
            contract_address: '0x036cbd53842c5426634e7929541ec2318f3dcf7e',
          },
          allowed_origins: ['https://api.example.com'],
          allowed_pay_to: ['0x1111111111111111111111111111111111111111'],
          automatic_payment_threshold_atomic: '100000',
          per_payment_limit_atomic: '1000000',
          agent_daily_limit_atomic: '10000000',
          require_approval_for_unknown_origin: true,
          require_approval_for_unknown_pay_to: true,
        },
        document_hash: 'hash',
        created_by: null,
        created_at: '2026-07-30T00:00:00.000Z',
        activated_at: null,
        superseded_at: null,
      }),
    )
    const client = new StableOpsAgentPayments({ fetch: fetchMock })

    await client.agents.createPolicyVersion('agent_1', {
      network: 'eip155:84532',
      asset: {
        symbol: 'USDC',
        contractAddress: '0x036cbd53842c5426634e7929541ec2318f3dcf7e',
      },
      allowedOrigins: ['https://api.example.com'],
      allowedPayTo: ['0x1111111111111111111111111111111111111111'],
      automaticPaymentThresholdAtomic: '100000',
      perPaymentLimitAtomic: '1000000',
      agentDailyLimitAtomic: '10000000',
      requireApprovalForUnknownOrigin: true,
      requireApprovalForUnknownPayTo: true,
    })

    const request = fetchMock.mock.calls[0]?.[1]
    expect(JSON.parse(String(request?.body))).toMatchObject({
      allowed_origins: ['https://api.example.com'],
      automatic_payment_threshold_atomic: '100000',
      asset: {
        contract_address: '0x036cbd53842c5426634e7929541ec2318f3dcf7e',
      },
    })
  })

  it('拒绝同时配置组织 API Key 和 Clerk access token', () => {
    expect(
      () =>
        new StableOpsAgentPayments({
          apiKey: 'sk_test',
          accessToken: 'clerk_test',
        }),
    ).toThrow('apiKey and accessToken cannot be used together')
  })

  it('Clerk 管理员令牌只发送到独立 Dashboard 命名空间', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ data: [] }))
    const client = new StableOpsAgentPayments({
      accessToken: 'clerk_admin_token',
      environment: 'live',
      baseUrl: 'https://api.example.com',
      fetch: fetchMock,
    })

    await client.approvals.list()

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/v1/dashboard/agent-payments/approvals',
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-stableops-clerk-token': 'clerk_admin_token',
          'x-stableops-env': 'live',
        }),
      }),
    )
    const headers = fetchMock.mock.calls[0]?.[1]?.headers as Record<string, string>
    expect(headers.authorization).toBeUndefined()
  })
})

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}
