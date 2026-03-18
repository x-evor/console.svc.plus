# =======================================================
# Global ARGs — 必须在所有 FROM 之前声明
# =======================================================
ARG NODE_BUILDER_IMAGE=node:22-bookworm
ARG NODE_RUNTIME_IMAGE=node:22-slim
ARG CONTENTLAYER_BUILD=true
ARG NEXT_PUBLIC_APP_BASE_URL=
ARG NEXT_PUBLIC_SITE_URL=
ARG NEXT_PUBLIC_LOGIN_URL=
ARG NEXT_PUBLIC_DOCS_BASE_URL=
ARG NEXT_PUBLIC_RUNTIME_ENVIRONMENT=
ARG NEXT_PUBLIC_RUNTIME_REGION=
ARG NEXT_PUBLIC_GISCUS_REPO=
ARG NEXT_PUBLIC_GISCUS_REPO_ID=
ARG NEXT_PUBLIC_GISCUS_CATEGORY=
ARG NEXT_PUBLIC_GISCUS_CATEGORY_ID=
ARG NEXT_PUBLIC_PAYPAL_CLIENT_ID=
ARG NEXT_PUBLIC_STRIPE_PRICE_XSTREAM_PAYGO=
ARG NEXT_PUBLIC_STRIPE_PRICE_XSTREAM_SUBSCRIPTION=
ARG NEXT_PUBLIC_STRIPE_PRICE_XSCOPEHUB_PAYGO=
ARG NEXT_PUBLIC_STRIPE_PRICE_XSCOPEHUB_SUBSCRIPTION=
ARG NEXT_PUBLIC_STRIPE_PRICE_XCLOUDFLOW_PAYGO=
ARG NEXT_PUBLIC_STRIPE_PRICE_XCLOUDFLOW_SUBSCRIPTION=

# -------------------------------------------------------
# Stage 1 — Builder (Turbopack + standalone)
# -------------------------------------------------------
FROM ${NODE_BUILDER_IMAGE} AS builder

WORKDIR /app/dashboard

ARG NEXT_PUBLIC_APP_BASE_URL
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_LOGIN_URL
ARG NEXT_PUBLIC_DOCS_BASE_URL
ARG NEXT_PUBLIC_RUNTIME_ENVIRONMENT
ARG NEXT_PUBLIC_RUNTIME_REGION
ARG NEXT_PUBLIC_GISCUS_REPO
ARG NEXT_PUBLIC_GISCUS_REPO_ID
ARG NEXT_PUBLIC_GISCUS_CATEGORY
ARG NEXT_PUBLIC_GISCUS_CATEGORY_ID
ARG NEXT_PUBLIC_PAYPAL_CLIENT_ID
ARG NEXT_PUBLIC_STRIPE_PRICE_XSTREAM_PAYGO
ARG NEXT_PUBLIC_STRIPE_PRICE_XSTREAM_SUBSCRIPTION
ARG NEXT_PUBLIC_STRIPE_PRICE_XSCOPEHUB_PAYGO
ARG NEXT_PUBLIC_STRIPE_PRICE_XSCOPEHUB_SUBSCRIPTION
ARG NEXT_PUBLIC_STRIPE_PRICE_XCLOUDFLOW_PAYGO
ARG NEXT_PUBLIC_STRIPE_PRICE_XCLOUDFLOW_SUBSCRIPTION

ENV NEXT_TELEMETRY_DISABLED=1 \
    NEXT_PRIVATE_TURBOPACK=1 \
    NEXT_PUBLIC_APP_BASE_URL=${NEXT_PUBLIC_APP_BASE_URL} \
    NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL} \
    NEXT_PUBLIC_LOGIN_URL=${NEXT_PUBLIC_LOGIN_URL} \
    NEXT_PUBLIC_DOCS_BASE_URL=${NEXT_PUBLIC_DOCS_BASE_URL} \
    NEXT_PUBLIC_RUNTIME_ENVIRONMENT=${NEXT_PUBLIC_RUNTIME_ENVIRONMENT} \
    NEXT_PUBLIC_RUNTIME_REGION=${NEXT_PUBLIC_RUNTIME_REGION} \
    NEXT_PUBLIC_GISCUS_REPO=${NEXT_PUBLIC_GISCUS_REPO} \
    NEXT_PUBLIC_GISCUS_REPO_ID=${NEXT_PUBLIC_GISCUS_REPO_ID} \
    NEXT_PUBLIC_GISCUS_CATEGORY=${NEXT_PUBLIC_GISCUS_CATEGORY} \
    NEXT_PUBLIC_GISCUS_CATEGORY_ID=${NEXT_PUBLIC_GISCUS_CATEGORY_ID} \
    NEXT_PUBLIC_PAYPAL_CLIENT_ID=${NEXT_PUBLIC_PAYPAL_CLIENT_ID} \
    NEXT_PUBLIC_STRIPE_PRICE_XSTREAM_PAYGO=${NEXT_PUBLIC_STRIPE_PRICE_XSTREAM_PAYGO} \
    NEXT_PUBLIC_STRIPE_PRICE_XSTREAM_SUBSCRIPTION=${NEXT_PUBLIC_STRIPE_PRICE_XSTREAM_SUBSCRIPTION} \
    NEXT_PUBLIC_STRIPE_PRICE_XSCOPEHUB_PAYGO=${NEXT_PUBLIC_STRIPE_PRICE_XSCOPEHUB_PAYGO} \
    NEXT_PUBLIC_STRIPE_PRICE_XSCOPEHUB_SUBSCRIPTION=${NEXT_PUBLIC_STRIPE_PRICE_XSCOPEHUB_SUBSCRIPTION} \
    NEXT_PUBLIC_STRIPE_PRICE_XCLOUDFLOW_PAYGO=${NEXT_PUBLIC_STRIPE_PRICE_XCLOUDFLOW_PAYGO} \
    NEXT_PUBLIC_STRIPE_PRICE_XCLOUDFLOW_SUBSCRIPTION=${NEXT_PUBLIC_STRIPE_PRICE_XCLOUDFLOW_SUBSCRIPTION}

# ---------------------------
# 基础镜像升级到最新
# ---------------------------
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl git \
    && apt-get upgrade -y \
    && rm -rf /var/lib/apt/lists/* \
    && corepack enable \
    && corepack prepare yarn@4.12.0 --activate

COPY . .
RUN find . -name "package-lock.json" -delete
RUN yarn install --immutable && \
    yarn prebuild && \
    yarn next build

# -------------------------------------------------------
# Stage 2 — Runtime (极致瘦身)
# -------------------------------------------------------
FROM ${NODE_RUNTIME_IMAGE} AS runner

WORKDIR /app/dashboard/

ENV NODE_ENV=production \
    RUNTIME_ENV=prod \
    REGION=cn \
    PORT=3000

# ---------------------------
# 安装 tini（修复子进程 + 更快退出）
# 基础镜像升级到最新
# ---------------------------
RUN apt-get update \
    && apt-get install -y --no-install-recommends tini ca-certificates \
    && apt-get dist-upgrade -y \
    && apt-get install -y --no-install-recommends --only-upgrade libpam-modules libpam-modules-bin libpam-runtime libpam0g zlib1g \
    && rm -rf /var/lib/apt/lists/*

# ---------------------------
# 导入 standalone 的运行产物
# ---------------------------
COPY --from=builder /app/dashboard/.next/standalone ./
COPY --from=builder /app/dashboard/.next/static ./static
COPY --from=builder /app/dashboard/public ./public
COPY --from=builder /app/dashboard/knowledge ./knowledge
COPY --from=builder /app/dashboard/src/content/blogs ./src/content/blogs

# ---------------------------
# 额外瘦身（可减少 15–40 MB）
# ---------------------------
#RUN rm -rf node_modules/next/dist/compiled/@vercel/og/* \
#    && rm -rf node_modules/sharp/vendor/* \
#    && find node_modules -name "*.md" -delete \
#    && find node_modules -name "*.map" -delete

# （如果 Edge Runtime 里用不到 font/SWC 也可移除，比现在更狠）

EXPOSE 3000

ENTRYPOINT ["/usr/bin/tini", "--"]

CMD ["node", "server.js"]
