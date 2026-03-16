"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

type CheckoutStatusBannerProps = {
  className?: string;
};

export default function CheckoutStatusBanner({
  className,
}: CheckoutStatusBannerProps) {
  const searchParams = useSearchParams();
  const checkoutStatus = searchParams.get("checkout");

  const message = useMemo(() => {
    switch (checkoutStatus) {
      case "success":
        return {
          tone: "border-emerald-200 bg-emerald-50 text-emerald-800",
          text: "Stripe 支付已完成，订阅状态正在同步到账户。",
        };
      case "cancelled":
        return {
          tone: "border-amber-200 bg-amber-50 text-amber-800",
          text: "你已取消本次 Stripe 结算，当前未产生新扣费。",
        };
      default:
        return null;
    }
  }, [checkoutStatus]);

  if (!message) {
    return null;
  }

  return (
    <div
      className={`rounded-xl border px-4 py-3 text-sm ${message.tone} ${className ?? ""}`.trim()}
    >
      {message.text}
    </div>
  );
}
