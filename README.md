# FlujoFirme n8n node — unpublished development candidate

This source integrates one external service: the FlujoFirme catalogue of documented workflow failure classes. It is a development prototype, with two documentation-backed cases and an unmatched result. It does not demonstrate customer repairs, savings or income.

## Candidate status — 27 October 2026

The public repository is https://github.com/bbksweet88/n8n-nodes-flujofirme . The previous source passed [CI run 40298219112](https://github.com/bbksweet88/n8n-nodes-flujofirme/actions/runs/40298219112) on 26 October. That run does **not** validate this new local candidate.

The n8n team clarified on 27 October that matching should stay in the external service, the node should target one stable public endpoint rather than an end-user URL, and a sleeping free host is a reliability concern. This is design feedback, not formal verification.

This candidate removes the free-text service URL and private-site credential route. The original private-pilot source and evidence remain in the separately preserved preparation. **The fixed origin is https://flujofirme-catalog-api-20261024.bbksweet.chatgpt.site . Anonymous strict-TLS HTTP checks on 27 October returned two documented matches and an unmatched result. The revised node then passed these three synthetic lookups in actual n8n 2.44.6 as a local custom extension, with item linkage preserved and no credentials or URL parameter. Installed-package/editor checks and service reliability remain to be established before npm publication.** If configuration is empty or invalid, the node makes no HTTP request and its publication check fails.

## Behavior

`Failure → Diagnose` sends one POST per item to the fixed service's `/v1/diagnose`, using n8n's ordinary HTTP helper, with redirects disabled. The request timeout remains finite: 90 seconds by default, configurable to an integer from 1 to 120. A longer timeout is not a substitute for reliable hosting.

Only `schemaVersion`, `nodeType`, `errorClass`, optional numeric `nodeVersion`, optional numeric major.minor.patch `n8nVersion` and optional integer `httpStatus` can leave n8n. Input items, raw error text, workflow JSON, prompts, identifiers, credentials and customer data are not forwarded. Node type and error class are selected explicitly; an Error Trigger's display name does not establish them.

Matching remains in the external service. The node constructs an allowlisted signature and validates the returned contract. It does not download the catalogue or run its matching locally. The programmatic style supports the exact outbound allowlist and bounded response transformation.

The service returns documented guidance, manual checks, rollback notes and sources, or an explicit unmatched result. The node never repairs, retries, executes or changes another workflow. Errors are redacted and support Continue On Fail with `status: lookup_failed` and preserved item linkage.

## Configuration

End users cannot set a destination URL or authentication method. Legacy `serviceUrl` and `authentication` values present in imported workflows are ignored. No credential type is registered by this candidate and attached credentials are not read.

The maintainer has configured `PUBLIC_SERVICE_ORIGIN` in `nodes/Flujofirme/serviceConfig.ts` to the anonymously HTTP-tested public HTTPS origin. Do not put a placeholder or an owner-authenticated private origin there. It is a build-time source constant, not an environment-variable, filesystem or expression lookup at runtime.

After the service is configured and validated, users select the true categorical fields and a finite timeout. The inactive workflow example remains synthetic and does not set an error-handler on another workflow.

## Local checks

Use Node.js 24.22.1 and the pinned development dependencies:

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm run build
npm run lint
npm test
node --test service/test/*.test.mjs
npm pack --dry-run --json
npm run release:check
```

The last command fails for an empty or placeholder fixed origin and passes the configured real origin. `prepublishOnly` and the manual GitHub publication workflow invoke this check. Passing it establishes only that the fixed URL is configured; it does not establish external access or operational reliability.

The node tests use synthetic mocked HTTP helpers. They do not contact the public service. No runtime dependencies are declared; n8n supplies `n8n-workflow` as a peer. Development compilation pins version 2.45.1. See `service/README.md` for the separate HTTP service and `PUBLICATION.md` for the remaining release work.

The 27 October custom-extension execution used Node.js 24.22.1 with strict TLS and the validation environment's explicitly validated platform CA. It confirms only three synthetic signatures from that environment; it does not prove npm-installed namespace, editor behavior, continuous availability, idle behavior or customer repairs. Historical executions are separately archived. The research evaluator and its old datasets are unrelated and unchanged.

## License

MIT. Documentation and UI are in English. No npm publication or Creator Portal submission has been performed for this candidate.
