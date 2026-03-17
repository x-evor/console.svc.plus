import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

import { XWorkmateProfileEditor } from "@/components/xworkmate/XWorkmateProfileEditor";
import {
  buildSharedXWorkmateUrl,
  isLegacyConsoleXWorkmateHost,
  isSharedXWorkmateHost,
  normalizeXWorkmateHost,
} from "@/lib/xworkmate/host";
import { buildXWorkmateScopeKey } from "@/lib/xworkmate/types";
import { getXWorkmateSessionContext } from "@/server/xworkmate/profile";

export const metadata = {
  title: "XWorkmate Personal Integrations",
  description: "Manage the personal XWorkmate integrations profile",
};

export default async function XWorkmateIntegrationsPage() {
  const requestHeaders = await headers();
  const requestHost = normalizeXWorkmateHost(
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host"),
  );

  if (isLegacyConsoleXWorkmateHost(requestHost)) {
    redirect(buildSharedXWorkmateUrl("/xworkmate/integrations"));
  }

  const { user, profile } = await getXWorkmateSessionContext(requestHost);
  if (!profile) {
    redirect("/xworkmate");
  }
  if (isSharedXWorkmateHost(requestHost)) {
    redirect(profile.canEditIntegrations ? "/xworkmate/admin" : "/xworkmate");
  }
  if (profile.profileScope !== "user-private") {
    redirect("/xworkmate");
  }

  const scopeKey = buildXWorkmateScopeKey(profile, user?.id, requestHost);

  return (
    <div className="min-h-[calc(100vh-var(--app-shell-nav-offset))] bg-[linear-gradient(180deg,#f4f7fd_0%,#f6f8fb_32%,#f3f5f8_100%)] px-4 py-5 md:px-6">
      <div className="mx-auto max-w-6xl">
        <XWorkmateProfileEditor
          payload={profile}
          scopeKey={scopeKey}
          workspaceHref="/xworkmate"
        />
      </div>
    </div>
  );
}
