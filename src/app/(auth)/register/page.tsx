export const dynamic = "force-dynamic";

export const revalidate = 0;

import { Suspense } from "react";
import { notFound } from "next/navigation";

import { isFeatureEnabled } from "@lib/featureToggles";
import { getAccountServiceBaseUrl } from "@server/serviceConfig";

import RegisterContent from "./RegisterContent";

function RegisterPageFallback() {
  return <div className="flex min-h-screen flex-col bg-background" />;
}

export default function RegisterPage() {
  if (!isFeatureEnabled("globalNavigation", "/register")) {
    notFound();
  }

  const accountServiceBaseUrl = getAccountServiceBaseUrl();

  return (
    <Suspense fallback={<RegisterPageFallback />}>
      <RegisterContent accountServiceBaseUrl={accountServiceBaseUrl} />
    </Suspense>
  );
}
