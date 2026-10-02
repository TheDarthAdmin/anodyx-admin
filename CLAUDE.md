# CLAUDE.md — Anodyx Admin

Platform-beheerportaal van Anodyx: tenants aanmaken en beheren, gebruikers ondersteunen, read-only
support-sessies, beheerders, platform-auditlog. Aparte repo en aparte Coolify-resource.

- **Architectuur en regels:** main repo `TheDarthAdmin/anodyx`, `docs/decisions/0010-platform-admin.md`.
  Alle logica en data zitten in de hoofd-API (`/platform/*`). Deze app is een dunne UI.
- **Contract:** `apps/api/src/anodyx/routers/platform.py` in de main repo. Types staan in `lib/types.ts`.
- **Geheim:** de browser praat alleen met `/api/*` op dit domein. `proxy.ts` voegt server-side
  `X-Platform-Secret` toe en gooit een door de browser meegestuurde versie weg. Zet het geheim nooit in
  client-code of `NEXT_PUBLIC_*`.
- **Merk:** kleuren, fonts en logo-regels uit de main repo `CLAUDE.md` ("Branding"). Logo's in
  `public/brand/` (nooit hertekenen). Admin-context = ink-shell + ADMIN-tag; Signal alleen voor
  destructieve acties en foutstatus.
- **Stack:** Next.js (App Router, TypeScript), Tailwind v4, shadcn/base-ui, Phosphor-iconen, vitest, Playwright.
- **Tests:** `npm test` (unit), `npx playwright test` (end-to-end tegen de echte API, zie README).
