# Publication handoff

The source repository now exists at
https://github.com/bbksweet88/n8n-nodes-flujofirme . Source upload and GitHub CI
verification are still being completed. This is not yet a public npm package
or a submitted verification request. The connected GitHub app's restricted
repository access is separate from authenticated browser access; do not infer
an npm publisher identity from either.

## Public service availability

The existing Authentication None path supports the intended public categorical
API without owner Sites bearer credentials or account setup. That path already
existed in the earlier prototype; the 26 October functional change is the
configurable timeout. No actual public API deployment is established yet.
The optional legacy credential path is not needed by public users/reviewers.
This removes service-key issuance from the public design; it does not by itself
prove the actual hosted endpoint is available.

Before release, record the actual independently accessible HTTPS origin and
three synthetic signature results (two documentation-backed matches and an
unknown class), plus a genuine post-idle request if the free host sleeps.
The node defaults to a finite 90-second timeout, configurable from 1 to 120
seconds. Do not use artificial keep-alives, disable HTTPS verification, or
infer continuous availability from a successful warm call.

## Prepared locally

- MIT license, English README and API documentation link.
- Package identity and metadata naming the newly created public repository.
- No runtime dependencies; n8n supplies the workflow peer.
- An explicitly confirmed manual `publish.yml` workflow. Pushes and tags do not
  publish. It builds, lints, runs ordinary unit tests and previews the package
  before `npm publish --provenance --access public`.
- The workflow uses the patched Node version in `.node-version` and checks the
  requested package version. It only runs its publish job on this
  repository's `main` branch. The package is locally publishable
  (`private: false`); this change does not upload or publish anything.

## Access required before publication

1. Complete and verify the exact source upload and CI in the public repository,
   then confirm the npm publisher identity belongs to Alberto. Repository
   creation alone establishes neither successful checks nor npm authorization.
2. Check package-name availability again. A public npm registry read on
   24 October 2026 returned HTTP 404 for `n8n-nodes-flujofirme`; this does not
   reserve the name or guarantee publication permission.
3. Sign in to npm and complete its required email/2FA steps personally. Never
   send account passwords, recovery codes or access tokens in chat.
4. Prefer npm Trusted Publishing once package settings are available:
   repository owner `bbksweet88`, repository `n8n-nodes-flujofirme`, workflow
   filename `publish.yml`. Explicitly permit `npm publish` when configuring
   that publisher; a stage-only publisher cannot run this workflow's publish.
5. If a brand-new package cannot yet configure that trust, use npm's documented
   granular-token route for the first GitHub Actions publication. A maintainer
   must authorize the minimum suitable publish scope and expiry and put it
   directly into the repository's `NPM_TOKEN` Actions secret. The workflow
   supports that secret through `NODE_AUTH_TOKEN`. Do not put it in source,
   workflow parameters, a package archive or chat. Revoke that bootstrap token
   after configuring and verifying OIDC.

Every n8n verification release must originate in GitHub Actions with
provenance. Do not bootstrap with a local `npm publish` and describe it as an
eligible verification release. npm also offers staged publishing for new
packages, which creates a public placeholder and later requires personal 2FA
approval; it is an alternative external publication action, not a local
dry-run or a way to bypass authorization.

## Release and review

After the source upload is complete, the repository checks pass, npm authorization is
configured, and the exact candidate is approved for publication, manually run
the workflow from `main`, enter the exact package version and select the
publication confirmation. Verify the npm result, provenance, author/repository
match and installed package behavior before submission. The workflow is
prepared locally but has not run on GitHub.

Before claiming verification readiness, complete n8n's required published
package check and editor/installed-namespace checks. Earlier custom-extension
tests do not establish npm installation or editor behavior. The Error Trigger
example is inactive and requires explicit local categorical settings; it does
not classify or repair arbitrary incidents.

Only then sign in to the n8n Creator Portal and submit the actual published
package. A reviewer must be able to use the actual independently validated public
endpoint with Authentication None; this is still a release requirement, not a
completed deployment. That request path needs no service credential or signup.
Jon's preliminary email
does not start formal review or guarantee approval. No paid task or reward is
established.

## Primary requirements checked 24 October 2026

- https://docs.n8n.io/connect/create-nodes/build-your-node/reference/verification-guidelines.md
- https://docs.n8n.io/connect/create-nodes/deploy-your-node/submit-community-nodes.md
- https://docs.npmjs.com/generating-provenance-statements/
- https://docs.npmjs.com/trusted-publishers/
- https://docs.npmjs.com/staged-publishing/
