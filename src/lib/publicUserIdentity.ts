function normalizeText(value?: string | null): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeRole(value?: string | null): string {
  return normalizeText(value).toLowerCase();
}

export function resolvePublicUserEmail(input: {
  email?: string | null;
  role?: string | null;
}): string {
  void normalizeRole(input.role);
  return normalizeText(input.email);
}

export function hasPublicUserEmail(input: {
  email?: string | null;
  role?: string | null;
}): boolean {
  void normalizeRole(input.role);
  return normalizeText(input.email).length > 0;
}
