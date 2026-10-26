# FlujoFirme n8n node — development prototype

This package was generated using the official `@n8n/create-node@0.53.2` scaffold (`@n8n/node-cli@0.54.2`) and adapted for one service: the FlujoFirme catalogue of documented workflow failure classes.

## Current release preparation — 26 October 2026

The node now supports a free public categorical catalogue API without account
creation or credentials. Select **Authentication: None**. The exact hosted
endpoint and independently observed deployment results must be recorded before
public distribution; an empty or example endpoint is not a deployed service.
No npm publication, Creator Portal submission, n8n verification or payment is
established by this source preparation. Jon's response approves the concept
only provisionally.

The former owner-authorized Sites route is retained as an explicit optional
legacy mode. Public callers do not use or obtain an owner Sites bearer token.
Historical private-pilot evidence remains unchanged in the parent package.

## What this version does

One `Failure → Diagnose` operation makes one POST request to `<Service URL>/v1/diagnose` using n8n's HTTP helper, with redirects disabled and a configurable finite timeout: **90 seconds** by default, integer **1–120 seconds**. A free instance may take about one minute to wake after idle; waiting longer makes the initial request possible but does not guarantee availability. No artificial keep-alive traffic is used. Node type and error class are selected explicitly. An Error Trigger often contains a display name but not a verifiable node type/version, so this prototype does not guess them.

Only these payload fields can be sent: `schemaVersion`, `nodeType`, `errorClass`, optional numeric `nodeVersion` (positive, at most 100), optional numeric major.minor.patch `n8nVersion` (at most 32 characters), optional integer `httpStatus`. It does not forward input items, error messages, workflow JSON, execution identifiers, credentials from input items, prompts or customer data. Because arbitrary error text can contain private information, this version has no raw-message parameter.

The result is documented guidance, a manual test, rollback notes and source links. An unmatched class returns `status: unmatched`. A lookup failure is explicit. It never modifies, retries or executes the failed workflow.

This uses a programmatic node to construct and validate the exact outbound allowlist and response contract before exposing output. The single API request is not a proxy to Google or model providers.

## Public pilot configuration

1. Set **Service URL** to the published FlujoFirme catalogue HTTPS origin.
2. Leave **Authentication** at **None**. No account, payment, access token or
   credential is needed by the public categorical endpoint.
3. Explicitly select the true node type and error class. Unknown remains
   unknown; an Error Trigger display name does not establish either value.
4. Keep **Request Timeout (Seconds)** at 90 for a free host that may sleep,
   or choose an integer from 1 to 120. This applies to each item separately.
   On timeout or an unavailable service, the node reports `lookup_failed`
   when Continue On Fail is enabled; it never reports a diagnosis as applied.

The public path uses only n8n's ordinary HTTP helper. It does not read attached
credentials or send authentication headers. The request contains only the six
categorical/version/status contract fields described above. No raw error text,
workflow item, prompt, execution object, customer data or secret is sent.

### Optional legacy private Sites access

Only select **Private Site Access** for a separately authorized legacy Sites
endpoint. Create a **FlujoFirme Private Site API** credential with its exact
HTTPS **Service Origin** and enter the authorized token in the password field.
n8n encrypts it at rest. The credential is not needed for the public API.

The node and credential require matching scheme, hostname and effective port
before adding `OAI-Sites-Authorization`. Redirects are disabled. The legacy
credential check uses `GET /health` with a finite 90-second timeout. It does
not disclose the token in examples or error output. Legacy access is retained
for existing development evidence, not offered as public reviewer onboarding.

## Local checks

Node.js 24.19.0 and npm 11.9.0 were available during preparation. Install isolated development dependencies and the n8n host peer, then run:

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm run build
npm run lint
npm test
```

No runtime dependencies are declared; the development environment pins `n8n-workflow@2.45.1` for compilation. `n8n-workflow` is supplied by the n8n host as a peer dependency. The helper-call tests use a mock and send no external HTTP request. The adjacent `../service/` tests exercise the local catalogue HTTP service separately.

Real n8n execution evidence is recorded separately from the mocked helper tests. Production configuration requires an authorized HTTPS endpoint for the single FlujoFirme service. The node intentionally rejects plain HTTP, including localhost; the local service can be tested separately with its own tests. The private test deployment does not establish public availability or production readiness.

The final compiled node was imported and executed by n8n **2.44.6** with Node.js **24.19.0**, loaded as an isolated custom extension. Local HTTPS validation covered four synthetic items: two matches, an unmatched signature and a handled HTTP 503, with paired-item indices preserved and outbound bodies captured. A separate real n8n execution called the privately hosted API: two authenticated matches, one authenticated unmatched result, and one unauthenticated lookup failure. Default HTTPS certificate validation remained enabled. See `../integration-real/` and `VALIDATION.json` for replay scripts, output and exact hashes. The ordinary unit suite passed 16 tests; those are distinct from the real runtime executions.

The current authenticated-pilot execution is separate from those historical runs: three cases passed after the isolated runner was given its existing platform CA trust certificate. Verification of the HTTPS chain stayed enabled. See `../integration-real/evidence-authenticated-pilot/attempt-2-platform-trust/summary.json`; the failed initial configuration is retained alongside it.

## Inactive workflow example

`examples/error-workflow.json` is inactive. It has an Error Trigger and this node, with `Authentication: None`, an empty service URL and Unknown class/type. Importing it does not set another workflow's error-handler configuration. Select the true class/type and authorized endpoint explicitly before using it; choose a private n8n credential when required. No automatic classification from node display names is implied.

## Before verification

- Verify the actual public hosted URL from an external client and n8n. Record
  both warm and genuine post-idle behavior; a warm test alone does not establish
  cold-start reliability or continuous availability.
- Test final npm installation and editor behavior. The historical custom-
  extension executions below do not establish npm namespace installation.
- Keep the package metadata aligned with the real public repository and the
  actual service documentation. The planned repository is not evidence of
  publication or ownership.
- Run the current official package check, publish through authorized GitHub
  Actions with provenance, verify the published package and submit the real
  version through Creator Portal. See `PUBLICATION.md`.

No security scanner, exploit or third-party security test is part of these
checks. Free hosting, real repairs, a supported production service and formal
n8n verification must each be established separately.

## License

MIT. Documentation and the node UI are in English. Examples are synthetic and do not establish real repairs, customers, savings or income.

