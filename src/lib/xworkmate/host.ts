const SHARED_HOSTS = new Set([
  "svc.plus",
  "www.svc.plus",
  "console.svc.plus",
  "localhost",
  "127.0.0.1",
  "[::1]",
]);

export function normalizeXWorkmateHost(value?: string | null): string {
  const trimmed = String(value ?? "")
    .trim()
    .toLowerCase();
  if (!trimmed) {
    return "";
  }

  const withoutProtocol = trimmed.replace(/^https?:\/\//, "");
  const withoutPath = withoutProtocol.split("/")[0] ?? "";
  const withoutPort = withoutPath.replace(/:\d+$/, "");
  return withoutPort.replace(/\.+$/, "");
}

export function isSharedXWorkmateHost(host?: string | null): boolean {
  const normalized = normalizeXWorkmateHost(host);
  if (!normalized) {
    return true;
  }
  return SHARED_HOSTS.has(normalized);
}

export function isLegacyConsoleXWorkmateHost(host?: string | null): boolean {
  return normalizeXWorkmateHost(host) === "console.svc.plus";
}

export function buildSharedXWorkmateUrl(pathname: string): string {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `https://svc.plus${normalizedPath}`;
}
