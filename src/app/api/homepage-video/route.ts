export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

import { getAccountServiceApiBaseUrl } from "@/server/serviceConfig";

const ACCOUNT_API_BASE = getAccountServiceApiBaseUrl();

export async function GET(request: NextRequest) {
  try {
    const headers = new Headers({
      Accept: "application/json",
    });

    const requestHost =
      request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    if (requestHost?.trim()) {
      headers.set("X-Forwarded-Host", requestHost.trim());
    }

    const response = await fetch(`${ACCOUNT_API_BASE}/homepage-video`, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const payload = await response.json().catch(() => null);
    if (payload === null) {
      return NextResponse.json({ error: "invalid_response" }, { status: 502 });
    }

    return NextResponse.json(payload, { status: response.status });
  } catch (error) {
    console.error("homepage video proxy failed", error);
    return NextResponse.json(
      { error: "account_service_unreachable" },
      { status: 502 },
    );
  }
}
