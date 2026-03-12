# 文档 (ZH)

本目录为 `console.svc.plus` 文档的中文版本（当前以占位/逐步翻译为主）。

> English docs: `../README.md`

## 目录结构

- `getting-started/`  入门与快速开始
- `architecture/`  架构与设计
- `usage/`  使用与配置
- `api/`  API 参考
- `integrations/`  第三方集成
- `advanced/`  高级主题（性能/安全/扩展/定制）
- `development/`  开发与贡献
- `operations/`  运维（日志/监控/备份/排障/Runbooks）
- `governance/`  治理（许可证/安全策略/发布流程）
- `appendix/`  附录（FAQ/术语表/参考资料）

## 翻译约定

- 每个中文文件顶部会链接到对应的英文原文路径。
- 如果中文内容尚未完善，会保留 `TODO` 占位，逐步补齐。

## AI 助手集成环境变量

首页 AI 助手和 `/panel/api` 集成页会在服务端读取环境变量做默认值预填，不会把网关地址或令牌硬编码进前端 UI。

建议优先查看：

- `../../.env.example`
- `getting-started/installation.md`

当前约定的主变量：

- `OPENCLAW_GATEWAY_REMOTE_URL`
- `OPENCLAW_GATEWAY_TOKEN`
- `VAULT_SERVER_URL`
- `VAULT_NAMESPACE`
- `VAULT_TOKEN`
- `APISIX_AI_GATEWAY_URL`
- `AI_GATEWAY_ACCESS_TOKEN`
