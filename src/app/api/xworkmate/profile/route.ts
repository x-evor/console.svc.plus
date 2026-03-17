import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/authGateway";
import { getAccountServiceApiBaseUrl } from "@/server/serviceConfig";

const ACCOUNT_API_BASE = getAccountServiceApiBaseUrl();

function buildProxyHeaders(
  token: string,
  requestHost?: string | null,
): HeadersInit {
  return {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
    ...(requestHost && requestHost.trim().length > 0
      ? {
          "X-Forwarded-Host": requestHost.trim(),
        }
      : {}),
  };
}

export async function GET(request: NextRequest) {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value?.trim();
  if (!token) {
    return NextResponse.json(
      { error: "session_token_required" },
      { status: 401 },
    );
  }

  try {
    const response = await fetch(`${ACCOUNT_API_BASE}/xworkmate/profile`, {
      method: "GET",
      headers: buildProxyHeaders(token, request.headers.get("host")),
      cache: "no-store",
    });

    const payload = await response.json().catch(() => ({}));
    return NextResponse.json(payload, { status: response.status });
  } catch (error) {
    console.error("xworkmate profile proxy failed", error);
    return NextResponse.json(
      { error: "account_service_unreachable" },
      { status: 502 },
    );
  }
}

export async function PUT(request: NextRequest) {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value?.trim();
  if (!token) {
    return NextResponse.json(
      { error: "session_token_required" },
      { status: 401 },
    );
  }

  const rawBody = await request.text();
  try {
    const response = await fetch(`${ACCOUNT_API_BASE}/xworkmate/profile`, {
      method: "PUT",
      headers: {
        ...buildProxyHeaders(token, request.headers.get("host")),
        "Content-Type": "application/json",
      },
      body: rawBody,
      cache: "no-store",
    });

    const payload = await response.json().catch(() => ({}));
    return NextResponse.json(payload, { status: response.status });
  } catch (error) {
    console.error("xworkmate profile update proxy failed", error);
    return NextResponse.json(
      { error: "account_service_unreachable" },
      { status: 502 },
    );
  }
}
