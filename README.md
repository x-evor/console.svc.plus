# console.svc.plus

Cloud Neutral Toolkit 的开放云控制面板 (Open Cloud Control Panel).

面向 **Ops / Infra / AI** 的统一前端仪表盘，强调技术自由与可迁移性。

> A unified dashboard for Ops / Infra / AI, built for technical freedom and portability.

## 部署要求 (Deployment Requirements)

| 维度 | 要求 / 规格 | 说明 |
|---|---|---|
| Node.js | `>=18.17 <25` | 推荐使用 `.nvmrc` |
| 包管理 | Yarn (推荐) 或 npm | Yarn 推荐配合 Corepack |
| Git | 必需 | 用于拉取仓库 |
| 部署 (可选) | Vercel / 自建 | 部署方式见 `docs/usage/deployment.md` |

## 快速开始 (Quickstart)

### 一键初始化 (Setup Script)

```bash
curl -fsSL "https://raw.githubusercontent.com/cloud-neutral-toolkit/console.svc.plus/main/scripts/setup.sh?$(date +%s)" \
  | bash -s -- console.svc.plus
```

### 本地运行 (Local Dev)

```bash
yarn dev
```

如果需要环境变量：

```bash
cp .env.example .env
```

AI 助手与集成页使用以下环境变量做服务端预填，不在前端 UI 中硬编码：

- `OPENCLAW_GATEWAY_REMOTE_URL`
- `OPENCLAW_GATEWAY_TOKEN`
- `VAULT_SERVER_URL`
- `VAULT_NAMESPACE`
- `VAULT_TOKEN`
- `APISIX_AI_GATEWAY_URL`
- `AI_GATEWAY_ACCESS_TOKEN`

建议参考 `/Users/shenlan/workspaces/cloud-neutral-toolkit/openclaw-deploy-example/.env` 填写，并同时查看 `docs/getting-started/installation.md`。

## 核心特性 & 技术栈 (Features & Tech Stack)

核心特性：
* 统一控制面：汇聚 Cloud Neutral Toolkit 各微服务入口
* 文档与内容系统：Contentlayer 驱动的 docs/content pipeline
* 可扩展集成：OIDC、Cloudflare Web Analytics 等

技术栈：
* Next.js + TypeScript
* Tailwind CSS + Radix UI
* Contentlayer

## 说明文档 (Docs)

入口：
* EN: `docs/README.md`
* ZH: `docs/zh/README.md`

常用链接：
* OIDC: `docs/integrations/oidc-auth.md`
* Cloudflare Web Analytics: `docs/integrations/cloudflare-web-analytics.md`
* Assistant / Integrations env setup: `docs/getting-started/installation.md`

其他：
* Agent rules: `AGENTS.md`
