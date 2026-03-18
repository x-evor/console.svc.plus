export const dynamic = "force-dynamic";

import { Suspense } from "react";

import { XWorkmateLoading } from "@/app/xworkmate/XWorkmateLoading";
import { XWorkmateWorkspaceRoute } from "@/components/xworkmate/XWorkmateWorkspaceRoute";
import { getConsoleIntegrationDefaults } from "@/server/consoleIntegrations";

export const metadata = {
  title: "XWorkmate",
  description: "Online XWorkmate workspace powered by OpenClaw gateway",
};

export default function XWorkmatePage() {
  const defaults = getConsoleIntegrationDefaults();
  return (
    <div className="h-[calc(100vh-var(--app-shell-nav-offset))] w-full">
      <Suspense fallback={<XWorkmateLoading />}>
        <XWorkmateWorkspaceRoute defaults={defaults} />
      </Suspense>
    </div>
  );
}
