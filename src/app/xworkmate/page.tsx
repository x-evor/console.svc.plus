import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { XWorkmateLoading } from "@/app/xworkmate/XWorkmateLoading";
import { XWorkmateWorkspacePage } from "@/components/xworkmate/XWorkmateWorkspacePage";
import {
  buildSharedXWorkmateUrl,
  isLegacyConsoleXWorkmateHost,
  normalizeXWorkmateHost,
} from "@/lib/xworkmate/host";
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

export default async function XWorkmatePage() {
  const requestHeaders = await headers();
  const requestHost = normalizeXWorkmateHost(
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host"),
  );

  if (isLegacyConsoleXWorkmateHost(requestHost)) {
    redirect(buildSharedXWorkmateUrl("/xworkmate"));
  }

  const { user, profile } = await getXWorkmateSessionContext(requestHost);
  const defaults = profile
    ? toXWorkmateIntegrationDefaults(profile)
    : getConsoleIntegrationDefaults();
  const scopeKey = buildXWorkmateScopeKey(profile, user?.id, requestHost);

  return (
    <div className="h-[calc(100vh-var(--app-shell-nav-offset))] w-full">
      <Suspense fallback={<XWorkmateLoading />}>
        <XWorkmateWorkspacePage
          defaults={defaults}
          profile={profile}
          scopeKey={scopeKey}
          requestHost={requestHost}
        />
      </Suspense>
    </div>
  );
}
