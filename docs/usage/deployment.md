# Deployment Runbook

## Scope

- Runtime: `console.svc.plus`
- Frontend host: Vercel
- Edge: Cloudflare
- Auth backend: `https://accounts.svc.plus`

This runbook is the minimum checklist for production incidents where login or MFA stops working and browser devtools show `/api/auth/login` or `/api/auth/mfa/*` failures.

## Expected Request Flow

1. Browser loads `https://console.svc.plus/login`
2. Browser calls same-origin Next routes on `console.svc.plus`
3. Next route proxies server-side to `https://accounts.svc.plus/api/auth/*`
4. `accounts.svc.plus` returns either a session token or an MFA challenge

The browser should not call `accounts.svc.plus` directly for login.

## Fast Triage

Run these checks first:

```bash
curl -si https://console.svc.plus/login | sed -n '1,20p'
curl -si https://console.svc.plus/api/auth/login | sed -n '1,20p'
curl -si https://accounts.svc.plus/healthz | sed -n '1,20p'
curl -si https://accounts.svc.plus/api/auth/login | sed -n '1,20p'
```

Interpretation:

- `console.svc.plus` returns `403` with `cf-mitigated: challenge`
  Cloudflare is blocking the page or auth API before Vercel sees it.
- `console.svc.plus/api/auth/login` returns `404`
  Vercel production is not serving the expected Next route, or Cloudflare is pointing at the wrong origin/deployment behavior.
- `accounts.svc.plus/healthz` fails
  Back-end outage. Fix backend first.
- `accounts.svc.plus/api/auth/login` returns `200` with `mfaRequired`
  Backend is healthy; continue on console/Vercel/Cloudflare.

## Application Checks

Verify the current build still contains the auth routes:

```bash
cd /Users/shenlan/workspaces/cloud-neutral-toolkit/console.svc.plus
yarn build
cat .next/app-path-routes-manifest.json | jq 'with_entries(select(.key|test("/api/auth/")))'
```

Verify the login page still uses same-origin routes:

```bash
nl -ba 'src/app/(auth)/login/LoginForm.tsx' | sed -n '64,180p'
nl -ba 'src/app/api/auth/login/route.ts' | sed -n '1,180p'
nl -ba 'src/app/api/auth/mfa/verify/route.ts' | sed -n '1,180p'
```

Expected behavior:

- `LoginForm` posts to `/api/auth/login`
- login proxy accepts backend `mfaRequired` / `mfaTicket`
- MFA verify proxy calls `/api/auth/mfa/verify`

## Vercel Checks

In the Vercel project for `console-svc-plus`, verify:

1. The production deployment corresponds to the intended git commit.
2. Framework preset is `Next.js`.
3. Build command is `yarn build` or the project default, not a static export command.
4. Output is not being overridden to static export.
5. Production Functions include `app/api/auth/login` and the other `app/api/auth/*` handlers.
6. Required runtime env vars are present for the auth proxy path if they are managed in Vercel.

If the route exists locally but Vercel returns `404`, suspect:

- wrong production deployment selected
- wrong root directory/project link
- stale alias or domain assignment
- build output mismatch between local and Vercel

## Cloudflare Checks

If `curl` shows `cf-mitigated: challenge`, check Cloudflare first.

Look for:

1. Managed Challenge or WAF custom rules affecting `/login`
2. Managed Challenge or WAF custom rules affecting `/api/auth/*`
3. Bot Fight Mode or Super Bot Fight Mode interactions
4. Transform/redirect/cache rules that alter `/api/auth/*`
5. Page Rules or Ruleset Engine policies applied only to the production hostname

Recommended policy for auth API:

- Do not cache `/api/auth/*`
- Do not apply JS challenge to `/api/auth/*`
- Keep standard security headers, but let requests reach Vercel

## Backend Verification

Use the backend directly to prove whether auth is healthy:

```bash
cd /Users/shenlan/workspaces/cloud-neutral-toolkit/accounts.svc.plus
set -a; source .env; set +a
payload=$(printf '{"identifier":"admin@svc.plus","password":"%s"}' "$SUPERADMIN_PASSWORD")
curl -sS -X POST https://accounts.svc.plus/api/auth/login \
  -H 'Content-Type: application/json' \
  -d "$payload"
```

Expected for an MFA-enabled admin:

- HTTP `200`
- response contains `mfaRequired`
- response contains `mfaTicket` or `mfaToken`

## Known Failure Signatures

- `POST https://console.svc.plus/api/auth/login 404`
  Likely Vercel deployment mismatch or route not published.
- `403` with `cf-mitigated: challenge`
  Cloudflare blocked request before Vercel.
- login returns generic failure even though backend returns MFA challenge
  Console auth proxy is not parsing MFA fields correctly.
- MFA code accepted by authenticator but web login still fails
  Console proxy may be calling the setup endpoint instead of the login MFA endpoint.

## Rollback Strategy

When a release breaks auth:

1. Remove or relax Cloudflare rules affecting `/login` and `/api/auth/*`
2. Re-point domain to last known-good Vercel production deployment
3. Roll back `console.svc.plus`
4. Only then consider `accounts.svc.plus` rollback

## Related Files

- `src/app/(auth)/login/LoginForm.tsx`
- `src/app/api/auth/login/route.ts`
- `src/app/api/auth/mfa/status/route.ts`
- `src/app/api/auth/mfa/verify/route.ts`
- `src/server/serviceConfig.ts`
