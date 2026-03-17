import { NextRequest, NextResponse } from "next/server";
import { applySessionCookie, deriveMaxAgeFromExpires } from "@lib/authGateway";
import { getAccountServiceApiBaseUrl } from "@server/serviceConfig";

const ACCOUNT_API_BASE = getAccountServiceApiBaseUrl();

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const { exchangeCode } = payload;

    if (!exchangeCode || typeof exchangeCode !== "string") {
      return NextResponse.json(
        { success: false, error: "invalid_request" },
        { status: 400 },
      );
    }

    const response = await fetch(`${ACCOUNT_API_BASE}/token/exchange`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        exchange_code: exchangeCode,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, error: errorData.error || "exchange_failed" },
        { status: response.status },
      );
    }

    const data = await response.json();
    const sessionToken =
      typeof data.token === "string" && data.token.trim().length > 0
        ? data.token.trim()
        : typeof data.access_token === "string" &&
            data.access_token.trim().length > 0
          ? data.access_token.trim()
          : "";

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: "invalid_response" },
        { status: 502 },
      );
    }

    const result = NextResponse.json({ success: true });
    const maxAge =
      typeof data.expires_in === "number"
        ? data.expires_in
        : deriveMaxAgeFromExpires(data.expiresAt);
    applySessionCookie(
      result,
      sessionToken,
      maxAge,
      request.headers.get("host") ?? undefined,
    );

    return result;
  } catch (error) {
    console.error("Token exchange proxy failed", error);
    return NextResponse.json(
      { success: false, error: "internal_error" },
      { status: 500 },
    );
  }
}
