export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { headers } from "next/headers";

import { XWorkmateLoading } from "@/app/xworkmate/XWorkmateLoading";
import { XWorkmateWorkspacePage } from "@/components/xworkmate/XWorkmateWorkspacePage";
import {
  buildXWorkmateScopeKey,
  toXWorkmateIntegrationDefaults,
} from "@/lib/xworkmate/types";
import { getConsoleIntegrationDefaults } from "@/server/consoleIntegrations";
import { getXWorkmateSessionContext } from "@/server/xworkmate/profile";

export const metadata = {
  title: "XWorkmate",
  description: "Online XWorkmate workspace powered by OpenClaw gateway",
};

export default async function XWorkmatePage({
  searchParams,
}: {
  searchParams?: Promise<{ prompt?: string; sessionKey?: string }>;
}) {
  const requestHeaders = await headers();
  const requestHost = requestHeaders.get("host");
  const { user, profile } = await getXWorkmateSessionContext(requestHost);
  const defaults =
    profile ? toXWorkmateIntegrationDefaults(profile) : getConsoleIntegrationDefaults();
  const scopeKey = buildXWorkmateScopeKey(
    profile,
    user?.id ?? user?.uuid ?? null,
    requestHost,
  );
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const initialPrompt =
    typeof resolvedSearchParams?.prompt === "string"
      ? resolvedSearchParams.prompt
      : "";
  const initialSessionKey =
    typeof resolvedSearchParams?.sessionKey === "string"
      ? resolvedSearchParams.sessionKey
      : "";

  return (
    <div className="h-[calc(100vh-var(--app-shell-nav-offset))] w-full">
      <Suspense fallback={<XWorkmateLoading />}>
        <XWorkmateWorkspacePage
          defaults={defaults}
          profile={profile}
          initialPrompt={initialPrompt}
          initialSessionKey={initialSessionKey}
          requestHost={requestHost ?? undefined}
          scopeKey={scopeKey}
        />
      </Suspense>
    </div>
  );
}
