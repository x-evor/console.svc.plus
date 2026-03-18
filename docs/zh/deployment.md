# 部署

## 生产基线

- 运行拓扑: `Caddy + Docker Compose`
- 目标主机: `47.120.61.35`
- 域名:
  - `cn.svc.plus`
  - `cn.onwalk.net`
- 前端独立发布流水线: `.github/workflows/service_release_frontend-deploy.yml`

## 运行方式

前端镜像在 GitHub Actions 中完成构建并推送到镜像仓库，目标主机只负责拉取镜像和启动容器，不在机器上本地构建。

`yarn prebuild` 会同步 docs、博客和其它静态内容。CI 在该阶段执行 `scripts/sync-doc-content.sh`（从 `console.svc.plus`、`accounts.svc.plus`、`rag-server.svc.plus` 和 `postgresql.svc.plus` 拉取文档）以及 `scripts/sync-blog-content.sh`（克隆 `https://github.com/cloud-neutral-workshop/knowledge.git`），因此 `knowledge/` 目录和所有文档/博客资产在构建镜像时就已存在。

当前方案尽量以静态模式运行：

- Caddy 直接服务 `/_next/static/*` 与 `public/` 里的静态资源，并配合 `frontend_static` 共享卷。
- Next.js standalone 容器只承接动态页面、认证接口和代理接口，`frontend-assets` 任务会把所有静态文件（包括哈希后的 CSS/JS）拷贝到 `frontend_static`。
- `knowledge/` 与同步的文档/博客内容在 GitHub Actions 的 Docker 构建阶段就被写入镜像。

发布由 `.github/workflows/service_release_frontend-deploy.yml` 驱动，CI 构建/推送镜像、渲染 `.env.runtime`，然后将 `docker-compose.yml`、`Caddyfile` 与运行时环境文件发送到主机。随后控制平面工作流 `.github/workflows/service_release_apiserver-deploy.yml` 通过 `scripts/github-actions/update-release-dns.sh` 更新 Cloudflare DNS，使 `cn.svc.plus` 与别名 `cn.onwalk.net` 指向更新后的环境。

这是针对弱 IO 单机主机 `47.120.61.35` 的部署权衡：主机不会在本地构建镜像，只需登录 GHCR、拉取 `dashboard` 镜像、解包静态资源到 `frontend_static`，再通过 `docker compose` 启动 `dashboard` 与 `caddy`。

未来如果 `docs.svc.plus` 被拆分成独立的 API 服务，必须同步更新这份说明（以及运行手册），让 GitHub Actions 只打包属于新服务的内容。

## 相关文档

- `usage/deployment.md`
- `governance/release-process.md`
- `development/dev-setup.md`
