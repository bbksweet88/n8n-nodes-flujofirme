# FlujoFirme n8n node — development prototype

This package was generated using the official `@n8n/create-node@0.53.2` scaffold (`@n8n/node-cli@0.54.2`) and adapted for one service: the FlujoFirme catalogue of documented workflow failure classes.

## Source status — 26 October 2026

Public source repository:
https://github.com/bbksweet88/n8n-nodes-flujofirme . Source upload and GitHub CI
verification are being completed separately. Repository creation does not
establish a published npm package, a deployed public API or n8n verification.

The node's existing **Authentication: None** path is intended for the public
categorical API. It also existed in the earlier prototype; the new source
change is a configurable finite timeout for hosts that may sleep. **No actual
public catalogue endpoint has yet been deployed and independently validated.**
An empty or example Service URL is not a live service. No npm publication,
Creator Portal submission or payment is established by this preparation.
Jon's response is preliminary feedback on the concept.

Owner-authorized Sites access remains an optional legacy mode. Public callers
will not need an owner Sites bearer token. Historical private-pilot evidence
is retained in the separately archived preparation, not in this public source
repository.

## What this version does

One `Failure → Diagnose` operation makes one POST request to `<Service URL>/v1/diagnose` using n8n's HTTP helper, with redirects disabled and a configurable finite timeout: **90 seconds** by default, integer **1–120 seconds**. A free instance may take about one minute to wake after idle; waiting longer makes the initial request possible but does not guarantee availability. No artificial keep-alive traffic is used. Node type and error class are selected explicitly. An Error Trigger often contains a display name but not a verifiable node type/version, so this prototype does not guess them.

Only these payload fields can be sent: `schemaVersion`, `nodeType`, `errorClass`, optional numeric `nodeVersion` (positive, at most 100), optional numeric major.minor.patch `n8nVersion` (at most 32 characters), optional integer `httpStatus`. It does not forward input items, error messages, workflow JSON, execution identifiers, credentials from input items, prompts or customer data. Because arbitrary error text can contain private information, this version has no raw-message parameter.

The result is documented guidance, a manual test, rollback notes and source links. An unmatched class returns `status: unmatched`. A lookup failure is explicit. It never modifies, retries or executes the failed workflow.

This uses a programmatic node to construct and validate the exact outbound allowlist and response contract before exposing output. The single API request is not a proxy to Google or model providers.

## Public pilot configuration

1. Once deployment and external checks succeed, set **Service URL** to the
   actual published FlujoFirme catalogue HTTPS origin. No URL is asserted yet.
2. Leave **Authentication** at **None** for that public categorical endpoint.
   This request path requires no account, payment, access token or credential.
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

The current source update was built and checked under **Node.js 24.22.1**.
Install the pinned isolated development dependencies, then run:

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm run build
npm run lint
npm test
node --test service/test/*.test.mjs
```

The 26 October node build and lint passed, and the current ordinary node
suite passed **17 tests**. This includes the new configurable-timeout regression
and the strengthened no-credential public-request check. These mocked helper
tests make no external HTTP calls. The separate `service/` tests exercise the
local catalogue HTTP service; see `service/README.md` for listener configuration
and deployment constraints.

No runtime dependencies are declared. Development compilation pins
`n8n-workflow@2.45.1`; the n8n host supplies the workflow peer at runtime.
The node rejects plain HTTP, including localhost. Test the local HTTP service
separately, or use an authorized HTTPS origin for actual node integration.

### Historical integration evidence

The separately archived 23–24 October preparation includes real n8n **2.44.6**
custom-extension executions. Local HTTPS validation covered four synthetic
items: two matches, an unmatched signature and a handled HTTP503, preserving
pairing. An owner-authorized hosted Sites pilot later returned two documented
matches and one unmatched result with HTTPS verification enabled, including
under Node.js **24.22.1**. The earlier ordinary node suite passed **16 tests**.
Those historical executions are distinct from the current **17-test** local
suite and do not establish the updated node's public API, npm-installed
namespace, editor behavior or production availability.

The historical runners, reports and archived validation files are not included
in this standalone public repository. No missing parent-directory paths are
required to build or test this source. Historical failures remain preserved in
the separate archive and are not relabelled as successful public access.

## Inactive workflow example

`examples/error-workflow.json` is inactive. It has an Error Trigger and this node, with `Authentication: None`, an empty service URL and Unknown class/type. Importing it does not set another workflow's error-handler configuration. Select the true class/type and authorized endpoint explicitly before using it; choose a private n8n credential when required. No automatic classification from node display names is implied.

## Before verification

- Verify the actual public hosted URL from an external client and n8n. Record
  both warm and genuine post-idle behavior; a warm test alone does not establish
  cold-start reliability or continuous availability.
- Test final npm installation and editor behavior. The historical custom-
  extension executions do not establish npm namespace installation.
- Keep the package metadata aligned with the real public repository and the
  actual service documentation. Public repository creation does not establish
  successful CI, an npm release or deployed service access.
- Run the current official package check, publish through authorized GitHub
  Actions with provenance, verify the published package and submit the real
  version through Creator Portal. See `PUBLICATION.md`.

No security scanner, exploit or third-party security test is part of these
checks. Free hosting, real repairs, a supported production service and formal
n8n verification must each be established separately.

## License

MIT. Documentation and the node UI are in English. Examples are synthetic and do not establish real repairs, customers, savings or income.

