import { NextRequest, NextResponse } from "next/server";

import { getAccountSession } from "@server/account/session";
import { getAccountServiceApiBaseUrl } from "@server/serviceConfig";

const ACCOUNT_API_BASE = getAccountServiceApiBaseUrl();

export async function POST(request: NextRequest) {
  const session = await getAccountSession(request);
  if (!session.user || !session.token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => ({}));
  const response = await fetch(`${ACCOUNT_API_BASE}/stripe/portal`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));
  return NextResponse.json(data, { status: response.status });
}
