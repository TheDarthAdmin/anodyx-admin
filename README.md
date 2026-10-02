# anodyx-admin

Platform-beheerportaal voor [Anodyx](https://github.com/TheDarthAdmin/anodyx) (ADR 0010 in de main repo).

## Omgevingsvariabelen (runtime)

| Variabele | Voorbeeld | Wat |
|---|---|---|
| `PLATFORM_API_URL` | `http://api-leevk9g1ded8ub2lw43akqv0:8000` | Interne URL van de Anodyx-API (zonder `/platform`) |
| `PLATFORM_SHARED_SECRET` | 64 hex-tekens | Gelijk aan `PLATFORM_SHARED_SECRET` van de API |

Aan de API-kant horen daarbij: `PLATFORM_SHARED_SECRET`, `PLATFORM_DB_PASSWORD`,
`PLATFORM_ADMIN_URL=https://anodyx-admin.darthadmin.com` (WebAuthn-origin en uitnodigingslinks) en eenmalig
`PLATFORM_BOOTSTRAP_EMAIL`, `PLATFORM_BOOTSTRAP_ADMIN_ID` en `PLATFORM_BOOTSTRAP_TOKEN_HASH` voor de eerste
beheerder (zie `anodyx/platform_bootstrap.py` in de main repo).

## Deploy op Coolify

1. Nieuw project *Anodyx Admin* → resource uit `TheDarthAdmin/anodyx-admin` (GitHub App), build pack
   **Dockerfile**, poort `3000`.
2. Domein: `http://anodyx-admin.darthadmin.com` (Cloudflare Tunnel → Traefik op `10.1.10.50:80`; TLS stopt
   bij Cloudflare, vandaar `http://` in Coolify).
3. **Intern netwerk naar de API** (niet via internet):
   - Zet bij de Anodyx-compose-resource (`leevk9g1ded8ub2lw43akqv0`) **"Connect to predefined network"** aan.
   - Deze admin-resource staat dan op hetzelfde `coolify`-netwerk.
   - `PLATFORM_API_URL=http://api-leevk9g1ded8ub2lw43akqv0:8000`.
   - **Te verifiëren na de eerste deploy:** Coolify geeft services op het voorgedefinieerde netwerk de naam
     `<service>-<resource-uuid>`. Test vanuit de admin-container met
     `wget -qO- http://api-leevk9g1ded8ub2lw43akqv0:8000/healthz`.
4. De API publiceert `/platform` niet extra: zonder geldige `X-Platform-Secret` antwoordt ze 404. De publieke
   Anodyx-web-app proxyt `/api/platform` niet (zie ADR 0010).

## Lokaal

```sh
npm ci
# API met lege database, eigen poorten (main repo naast deze):
cd ../Anodyx/apps/api && DEV_FRESH=1 DEV_DB_DIR=/tmp/admin-db DEV_PORT=8400 DEV_RELOAD=0 \
  PLATFORM_ADMIN_URL=http://localhost:3400 uv run python scripts/dev_local.py
# print: "platform admin login (once): http://localhost:3400/verify?token=..."
PLATFORM_API_URL=http://localhost:8400 PLATFORM_SHARED_SECRET=dev-platform-secret npm run dev
```

## Tests

- `npm test`: unit (proxy-headers en secret-stripping, CSP, login-stappen, countdown, waardeweergave).
- `npx playwright test`: end-to-end tegen de echte API (start zelf API op 8410 met verse database en de app
  op 3410). Dekt bootstrap, wachtwoord, TOTP, tenant aanmaken, opschorten, heractiveren, eenmalige link,
  support-sessie en een FIDO2-sleutel via een virtuele authenticator.
