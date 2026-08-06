# StableOps Agent Payments API SDK

[![npm version](https://img.shields.io/npm/v/@stableops/agent-payments-api-sdk)](https://www.npmjs.com/package/@stableops/agent-payments-api-sdk) [![npm downloads](https://img.shields.io/npm/dm/@stableops/agent-payments-api-sdk)](https://www.npmjs.com/package/@stableops/agent-payments-api-sdk) [![License](https://img.shields.io/npm/l/@stableops/agent-payments-api-sdk)](https://www.npmjs.com/package/@stableops/agent-payments-api-sdk) [![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org) [![Node](https://img.shields.io/badge/Node-%3E%3D20-339933)](https://nodejs.org)

[查看英文说明](./README.md)

StableOps Agent Payments 是面向自主代理的付款控制层，通过不可变的支出策略、组织与代理预算、人工审批、客户自主管理的钱包、短时执行授权和付款对账来约束代理付款。

这个 SDK 适合在运营方服务端配置和管理 Agent Payments。管理凭证应保留在运营方服务端，不能放入代理运行时。

## 功能

- 创建、更新、暂停和恢复付款代理。
- 签发、查询和撤销受限的代理密钥。
- 注册客户自主管理的钱包并绑定到代理。
- 创建、查询和启用不可变的支出策略版本。
- 查询和更新组织级与代理级预算。
- 查询待审批付款并作出批准或拒绝决定。
- 查询付款、状态变更记录和结算回执。
- 分离组织 API Key 与控制台管理员两种认证方式。
- 同时输出 CJS、ESM 和 TypeScript 类型声明。

## 环境要求

- Node.js 20 或更高版本。
- StableOps 组织。
- 用于管理和查询操作的组织 API Key，或用于控制台审批流程且已验证的 Clerk 组织管理员访问令牌。
- 服务端运行环境。不要把任何一种凭证暴露给代理或打包到浏览器代码中。

## 安装

```bash
pnpm add @stableops/agent-payments-api-sdk
```

```bash
npm install @stableops/agent-payments-api-sdk
```

```bash
yarn add @stableops/agent-payments-api-sdk
```

## 快速开始

```ts
import { StableOpsAgentPayments } from '@stableops/agent-payments-api-sdk'

const payments = new StableOpsAgentPayments({
  apiKey: process.env.STABLEOPS_API_KEY!,
})

const agent = await payments.agents.create({
  name: '采购代理',
  description: '购买已批准的业务数据',
})

const credential = await payments.agents.createKey(agent.id, {
  name: '采购代理运行时',
})

// 明文代理密钥只会返回一次，应将其保存到密钥管理服务。
console.log(credential.secret)
```

API Key 会把请求限定在其所属的组织和环境，无需另行选择环境。

客户端按管理领域提供独立资源：

```ts
const agents = await payments.agents.list()
const wallets = await payments.wallets.list()
const organizationBudget = await payments.budgets.getOrganization()
const approvals = await payments.approvals.list()
const recentPayments = await payments.payments.list()
```

审批操作可以使用另一个客户端，并配置已验证的 Clerk 组织管理员访问令牌：

```ts
const dashboard = new StableOpsAgentPayments({
  accessToken: process.env.STABLEOPS_ADMIN_ACCESS_TOKEN!,
  environment: 'sandbox',
})

await dashboard.approvals.approve('approval_...', '已批准的业务采购')
```

使用访问令牌的客户端会自动切换到隔离的 `/v1/dashboard/agent-payments/*` 命名空间，且不会把管理员令牌作为 API Key Bearer 发送。不能在同一个客户端中同时配置 `apiKey` 和 `accessToken`。

## 官方文档

完整的钱包注册、策略、预算、审批和付款查询示例，请查看官方文档：

- 中文文档：https://stableops.dev/zh/docs/agent-payments/management-sdk
- 英文文档：https://stableops.dev/en/docs/agent-payments/management-sdk
- 快速开始：https://stableops.dev/zh/docs/agent-payments/quickstart

## 当前支持范围

当前版本支持六个 EVM 主网及其对应测试网，以及 Solana 主网和 Devnet 上已配置的 USDC 与 x402 v2 `exact`。沙盒只能使用测试网，正式环境只能使用主网；正式环境的真实资金操作仍受 StableOps 组织风控门禁约束。TRON 和 Nile 暂不支持。

代理运行时应使用 `@stableops/agent-sdk`，客户自主管理的签名环境应使用 `@stableops/agent-signer`。

## 许可证

本 SDK 使用 `Apache-2.0` 许可证。
