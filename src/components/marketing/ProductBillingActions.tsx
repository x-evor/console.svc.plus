"use client";

import { useState } from "react";
import Link from "next/link";

import CheckoutStatusBanner from "@components/billing/CheckoutStatusBanner";
import { startStripeCheckout } from "@components/billing/stripe-client";
import type { BillingPlan, ProductConfig } from "@modules/products/registry";

type ProductBillingActionsProps = {
  config: ProductConfig;
  lang: "zh" | "en";
};

type BillingCardProps = {
  config: ProductConfig;
  lang: "zh" | "en";
  title: string;
  linkLabel: string;
  kind: "paygo" | "subscription";
  plan: BillingPlan;
};

function BillingCard({
  config,
  lang,
  title,
  linkLabel,
  kind,
  plan,
}: BillingCardProps) {
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleCheckout = async () => {
    if (!plan.planId || !plan.stripePriceId) {
      setStatusMessage(
        lang === "zh"
          ? "Stripe 价格尚未配置。"
          : "Stripe pricing is not configured yet.",
      );
      return;
    }

    try {
      setStatusMessage(null);
      await startStripeCheckout({
        planId: plan.planId,
        stripePriceId: plan.stripePriceId,
        mode: plan.mode,
        productSlug: config.slug,
        sourcePath: `/${config.slug}`,
      });
    } catch (error) {
      console.warn("Failed to start Stripe checkout", error);
      setStatusMessage(
        lang === "zh"
          ? "无法跳转到 Stripe 结算，请稍后重试。"
          : "Failed to start Stripe checkout.",
      );
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand">
            {title}
          </p>
          <h3 className="text-xl font-semibold text-slate-900">{plan.name}</h3>
          <p className="mt-1 text-sm text-slate-600">{plan.description}</p>
          <p className="mt-2 text-lg font-bold text-slate-900">
            {plan.currency} {plan.price.toFixed(2)}
            {plan.interval ? ` / ${plan.interval}` : ""}
          </p>
        </div>
        <Link
          href={`/${config.slug}#editions`}
          className="text-sm font-medium text-brand hover:text-brand-dark"
        >
          {linkLabel}
        </Link>
      </div>

      <div className="mt-4 space-y-3">
        <button
          type="button"
          onClick={handleCheckout}
          className="inline-flex w-full items-center justify-center rounded-lg bg-brand px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
        >
          {lang === "zh"
            ? kind === "subscription"
              ? "使用 Stripe 订阅"
              : "使用 Stripe 购买"
            : kind === "subscription"
              ? "Subscribe with Stripe"
              : "Buy with Stripe"}
        </button>
        <p className="text-xs text-slate-500">
          {lang === "zh"
            ? "购买前需要先登录，支付状态将自动同步到账户中心。"
            : "Sign in before checkout. Subscription state will sync back to your account automatically."}
        </p>
        {statusMessage ? (
          <p className="text-sm text-brand-dark">{statusMessage}</p>
        ) : null}
      </div>
    </div>
  );
}

export default function ProductBillingActions({
  config,
  lang,
}: ProductBillingActionsProps) {
  const billing = config.billing;
  const paygo = billing?.paygo;
  const saas = billing?.saas;

  if (!paygo && !saas) {
    return null;
  }

  return (
    <section
      id="billing"
      aria-labelledby="billing-title"
      className="bg-slate-50 py-12"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2
              id="billing-title"
              className="text-2xl font-bold text-slate-900"
            >
              {lang === "zh" ? "支付与订阅" : "Payments & Subscription"}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {lang === "zh"
                ? "所有购买入口统一使用 Stripe 结算，支付结果会自动同步到账户中心。"
                : "All purchase flows run through Stripe and sync back to your account automatically."}
            </p>
          </div>
          <div className="text-sm text-slate-700">
            {lang === "zh" ? "Stripe 安全结算" : "Secure Stripe checkout"}
          </div>
        </div>

        <CheckoutStatusBanner className="mt-6" />

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {paygo ? (
            <BillingCard
              config={config}
              lang={lang}
              title="Pay-as-you-go"
              linkLabel={lang === "zh" ? "查看方案" : "View editions"}
              kind="paygo"
              plan={paygo}
            />
          ) : null}
          {saas ? (
            <BillingCard
              config={config}
              lang={lang}
              title="SaaS"
              linkLabel={lang === "zh" ? "订阅详情" : "Subscription details"}
              kind="subscription"
              plan={saas}
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}
