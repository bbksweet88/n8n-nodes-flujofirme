# Publication handoff — 27 October 2026 candidate

**npm publication remains pending.** The fixed public origin https://flujofirme-catalog-api-20261024.bbksweet.chatgpt.site passed anonymous strict-TLS HTTP checks for the two documented matches and unknown result on 27 October 2026. The revised fixed-origin node then passed these three synthetic lookups in actual n8n 2.44.6 as a local custom extension, preserving paired items 0–2 without credentials or a service-URL parameter. The run used Node.js 24.22.1, strict TLS and the environment's explicitly validated platform CA. Installed-package/editor checks and service reliability still need review. Source preparation and preliminary n8n feedback do not start formal review.

## Requirements clarified by n8n

Garrit Franke replied in the existing n8n correspondence on 27 October 2026: keep matching in the external service; a static catalogue with matching in the node moves toward logic nodes, which they are not accepting. Use one stable public service endpoint operated by FlujoFirme rather than free text. A free host waking after idle is a reliability concern. No further pre-review was offered; the subsequent route is npm publication with provenance and Creator Portal submission into the regular queue.

This local candidate removes user-configurable destinations and authentication from the node. Historical private-site code and evidence remain in the separate archive; no owner bearer credential is part of the proposed public node.

## Service gate

1. Retain evidence for the actual independently reachable HTTPS service that performs matching externally. The existing Sites origin passed the bounded anonymous HTTP checks; that does not establish continuous availability. Do not invent an origin or reuse a private endpoint merely because its owner can access it.
2. Retain the 27 October evidence for the two documentation-backed matches and unknown response through ordinary external HTTP and the actual n8n custom-extension node with strict TLS enabled. Assess genuine idle behavior and operation within the hosting limits separately. A warm request or increased timeout does not establish reliability; these synthetic lookups are not workflow repairs.
3. Keep the source constant `PUBLIC_SERVICE_ORIGIN` at the corroborated exact origin. Update the development notice and README status only when new evidence supports it. Keep it fixed in the package; do not reintroduce a user-supplied URL or runtime environment/filesystem access.
4. Build, lint, run the ordinary tests and `npm run release:check`. The configuration check prevents empty/placeholder origins from publication but does not perform network validation or certify reliability. Review the recorded external evidence separately.

No artificial keep-alive traffic, card verification, paid hosting or account change is authorized by this preparation. The free Render attempt remains blocked by account-specific card verification unless a supported no-card route is confirmed.

## npm and Creator Portal

The public source repository is https://github.com/bbksweet88/n8n-nodes-flujofirme . Its previous CI result does not validate this new local candidate. After any source update, review the exact published source and fresh CI result.

Confirm the npm publisher identity and package-name availability. The earlier registry 404 did not reserve the name. GitHub access does not establish npm authorization. A maintainer must personally complete any required npm email/2FA steps; do not send passwords, tokens or recovery codes through chat.

Prefer npm Trusted Publishing for repository `bbksweet88/n8n-nodes-flujofirme` and workflow `publish.yml` once package settings allow it. If the first publication needs npm's documented granular-token route, an authorized maintainer must create the minimum suitable scope and expiry and enter it directly in the repository's `NPM_TOKEN` Actions secret, never source or chat. Revoke a bootstrap token after OIDC is configured and verified.

The manual workflow checks identity/version/runtime, installs, builds, lints, runs ordinary unit tests and the fixed-service configuration gate, previews the package, then publishes with provenance. Pushes and tags do not publish. `prepublishOnly` also checks the fixed service configuration for direct npm publication. Do not run publication until service evidence, publisher access and the exact candidate are reviewed and authorized.

Verify the actual npm version, provenance, author/repository identity and final installed-package namespace/editor behavior. Earlier custom-extension tests do not establish those results. Run n8n's current published-package check, then submit the actual published version through Creator Portal. Formal acceptance, paid work and income remain unestablished.

Primary requirements previously checked:
- https://docs.n8n.io/connect/create-nodes/build-your-node/reference/verification-guidelines.md
- https://docs.n8n.io/connect/create-nodes/deploy-your-node/submit-community-nodes.md
- https://docs.npmjs.com/generating-provenance-statements/
- https://docs.npmjs.com/trusted-publishers/
- https://docs.npmjs.com/staged-publishing/
