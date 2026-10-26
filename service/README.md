# Public catalogue pilot source

This stateless, zero-dependency Node service returns documentation-backed
guidance for two categorical failure classes. It neither executes nor changes
workflows. It has no account creation, database, API-key issuance, outgoing
API calls or application telemetry. Hosting access logs can still contain
transport metadata such as source IP addresses. Do not send personal data.

This directory and the sibling `catalog/` directory are deployment source.
The n8n package's explicit `files` whitelist excludes them from its npm tarball.
The catalogue and diagnosis implementation are byte-identical to the existing
canonical preparation. `deployment-evidence/summary.json` records their hashes.

## Local use

Use Node **24.22.1** or a later patched Node 24 release. From the repository root:

```sh
node --test service/test/*.test.mjs
node service/server.mjs
```

The default listener is `127.0.0.1:8787`. `HOST` and `PORT` are explicitly
configurable; invalid values fail startup. SIGTERM/SIGINT stop the listener
and allow existing requests up to ten seconds before forced exit.

## Direct Render creation inputs

Only after the exact source is pushed to an authorized supported Git provider:

| Setting | Value |
| --- | --- |
| Service type | Web service |
| Runtime | Node |
| Compute plan | `free` only |
| Build command | `node --check service/server.mjs && node --test service/test/*.test.mjs` |
| Start command | `node service/server.mjs` |
| Node environment | `NODE_VERSION=24.22.1` |
| Listener environment | `HOST=0.0.0.0`, retain Render's supplied `PORT` |
| Pilot metadata | `FLUJOFIRME_PUBLIC_PILOT=1` |
| Health-check path, if configuration supports it | `/health` |
| Database, disk, queue, cron | None |

Render terminates HTTPS at its edge and forwards HTTP to this listener.
The default platform port is 10000. No secrets are needed for this categorical
public endpoint. Use the actual server-returned Render URL after a successful
deployment; no URL is reserved or asserted by these files.

The direct creation wrapper might not expose a health-path setting. It can
still detect the open `PORT`, but do not claim a configured `/health` check
unless service details confirm it. Do not switch to a paid compute plan or
add billing details without Alberto's explicit choice.

## Endpoints and input boundary

- `GET /` returns the service contract and limitations.
- `GET /health` returns process readiness and configured mode. It is not an
  assertion of general external availability, uptime or patch status.
- `POST /v1/diagnose` accepts JSON of at most 4096 bytes. Schema permits only
  `schemaVersion`, `nodeType`, `nodeVersion`, `n8nVersion`, `errorClass` and
  `httpStatus`. Extra fields and malformed signatures receive 400.
- Unsupported method, content type or body size receive 405, 415 or 413.

Example categorical payload:

```json
{"schemaVersion":1,"nodeType":"googlesheets","errorClass":"GOOGLE_SHEETS_RATE_LIMIT","httpStatus":429}
```

Do not transmit raw error messages, execution objects, workflow exports,
prompts, model outputs, schemas, credentials, names or customer identifiers.
The endpoint returns original catalogue wording with sources and explicit
limitations. It does not establish any reproduced repair.

## Important free-pilot constraints

Direct primary documentation checked 24 October 2026 says Render Free Web
services sleep after 15 minutes idle and take about one minute to wake. The
current n8n adapter has a 10 second request timeout, so an initial call after
idle can return `lookup_failed`. This source does not solve that client
experience and must not be advertised as continuously available or ready
for formal verification solely because a warm test passes. Do not add
artificial keep-alive traffic to avoid platform limits.

Each workspace receives 750 Free instance hours monthly. Bandwidth and build
pipeline overages may be charged when a payment method exists; without a
payment method, services or builds instead suspend. Confirm real workspace
billing and applicable spend controls before deployment under a strict
zero-investment requirement. Selecting `plan=free` alone is insufficient
proof of zero possible charges. No deployment or billing change was made
as part of this local preparation.

Primary documentation read directly:

- https://render.com/docs/free.md
- https://render.com/docs/web-services.md
- https://render.com/docs/compute-plans.md

Current evidence is local only. External HTTP, n8n integration against the
actual Render origin, idle/cold-start handling and formal publication remain
separate checks after a deployment is authorized and succeeds.
