# StableOps Agent Payments API SDK

[![npm version](https://img.shields.io/npm/v/@stableops/agent-payments-api-sdk)](https://www.npmjs.com/package/@stableops/agent-payments-api-sdk) [![npm downloads](https://img.shields.io/npm/dm/@stableops/agent-payments-api-sdk)](https://www.npmjs.com/package/@stableops/agent-payments-api-sdk) [![License](https://img.shields.io/npm/l/@stableops/agent-payments-api-sdk)](https://www.npmjs.com/package/@stableops/agent-payments-api-sdk) [![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org) [![Node](https://img.shields.io/badge/Node-%3E%3D20-339933)](https://nodejs.org)

[中文文档](./README.zh-CN.md)

StableOps Agent Payments is a payment control layer for autonomous agents. It
combines immutable spending policies, organization and agent budgets, human
approvals, customer-controlled wallets, short-lived execution grants, and
payment reconciliation.

This SDK is intended for operator backends that configure and manage Agent
Payments. Keep management credentials in the operator backend rather than the
agent runtime.

## Features

- Create, update, pause, and resume payment agents.
- Issue, list, and revoke restricted Agent Keys.
- Register customer-controlled wallets and bind them to agents.
- Create, inspect, and activate immutable spending policy versions.
- Read and update organization- and agent-level budgets.
- List and decide pending payment approvals.
- Query payments, state transitions, and settlement receipts.
- Separate organization API key and dashboard administrator authentication modes.
- Dual CJS and ESM builds with generated TypeScript declarations.

## Requirements

- Node.js 20 or newer.
- A StableOps organization.
- An organization API key for management and query operations, or a verified
  Clerk organization-administrator access token for dashboard approval flows.
- A server-side environment. Do not expose either credential to an agent or browser bundle.

## Installation

```bash
pnpm add @stableops/agent-payments-api-sdk
```

```bash
npm install @stableops/agent-payments-api-sdk
```

```bash
yarn add @stableops/agent-payments-api-sdk
```

## Quick Start

```ts
import { StableOpsAgentPayments } from '@stableops/agent-payments-api-sdk'

const payments = new StableOpsAgentPayments({
  apiKey: process.env.STABLEOPS_API_KEY!,
})

const agent = await payments.agents.create({
  name: 'Procurement agent',
  description: 'Purchases approved business data',
})

const credential = await payments.agents.createKey(agent.id, {
  name: 'Procurement runtime',
})

// The plaintext Agent Key is returned only once. Store it in a secret manager.
console.log(credential.secret)
```

The API key scopes requests to its organization and environment, so no separate
environment option is required.

The client exposes separate resources for each management area:

```ts
const agents = await payments.agents.list()
const wallets = await payments.wallets.list()
const organizationBudget = await payments.budgets.getOrganization()
const approvals = await payments.approvals.list()
const recentPayments = await payments.payments.list()
```

Approval decisions can use a separate client configured with a verified Clerk
organization-administrator access token:

```ts
const dashboard = new StableOpsAgentPayments({
  accessToken: process.env.STABLEOPS_ADMIN_ACCESS_TOKEN!,
  environment: 'sandbox',
})

await dashboard.approvals.approve('approval_...', 'Approved business purchase')
```

The access-token client automatically uses the isolated
`/v1/dashboard/agent-payments/*` namespace and never sends the administrator
token as an API-key bearer token. Do not configure `apiKey` and `accessToken` on
the same client.

## Documentation

For complete wallet registration, policy, budget, approval, and payment query
examples, see the official documentation:

- English docs: https://stableops.dev/en/docs/agent-payments/management-sdk
- Chinese docs: https://stableops.dev/zh/docs/agent-payments/management-sdk
- Quickstart: https://stableops.dev/en/docs/agent-payments/quickstart

## Current Support

The current release supports configured USDC and x402 v2 `exact` across six
EVM mainnets and their testnets, plus Solana mainnet and Devnet. Sandbox only
accepts test networks, while Live only accepts mainnets and remains subject to
StableOps organization risk controls. TRON and Nile are not yet supported.

Use `@stableops/agent-sdk` in the agent runtime and
`@stableops/agent-signer` in the customer-controlled signing environment.

## License

This SDK is licensed under `Apache-2.0`.
