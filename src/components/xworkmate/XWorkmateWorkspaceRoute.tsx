"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import type { IntegrationDefaults } from "@/lib/openclaw/types";
import { useUserStore } from "@/lib/userStore";
import { normalizeXWorkmateHost } from "@/lib/xworkmate/host";
import {
  buildXWorkmateScopeKey,
  toXWorkmateIntegrationDefaults,
  type XWorkmateProfileResponse,
} from "@/lib/xworkmate/types";
import { XWorkmateWorkspacePage } from "@/components/xworkmate/XWorkmateWorkspacePage";

type XWorkmateWorkspaceRouteProps = {
  defaults: IntegrationDefaults;
};

async function fetchProfile(): Promise<XWorkmateProfileResponse | null> {
  const response = await fetch("/api/xworkmate/profile", {
    credentials: "include",
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`xworkmate_profile_failed:${response.status}`);
  }

  return (await response.json()) as XWorkmateProfileResponse;
}

export function XWorkmateWorkspaceRoute({
  defaults,
}: XWorkmateWorkspaceRouteProps): React.ReactNode {
  const searchParams = useSearchParams();
  const sessionUser = useUserStore((state) => state.user);
  const [profile, setProfile] = useState<XWorkmateProfileResponse | null>(null);

  const requestHost = useMemo(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return normalizeXWorkmateHost(window.location.host);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const nextProfile = await fetchProfile();
        if (!cancelled) {
          setProfile(nextProfile);
        }
      } catch (error) {
        console.error("Failed to load xworkmate profile", error);
        if (!cancelled) {
          setProfile(null);
        }
      }
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  const resolvedDefaults = profile
    ? toXWorkmateIntegrationDefaults(profile)
    : defaults;
  const scopeKey = buildXWorkmateScopeKey(
    profile,
    sessionUser?.id ?? sessionUser?.uuid ?? null,
    requestHost,
  );
  const initialPrompt = searchParams.get("prompt") ?? "";
  const initialSessionKey = searchParams.get("sessionKey") ?? "";

  return (
    <XWorkmateWorkspacePage
      defaults={resolvedDefaults}
      profile={profile}
      initialPrompt={initialPrompt}
      initialSessionKey={initialSessionKey}
      requestHost={requestHost}
      scopeKey={scopeKey}
    />
  );
}
