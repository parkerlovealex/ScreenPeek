# Admin configuration

The application requires a signed Cloudflare Access JWT **and** a matching Access email header, then checks `admin_users` on every admin request. An email header by itself does not grant access. No development login bypass is installed.

Before enabling live admin access:

1. Create a Cloudflare Access application protecting `/admin` and `/admin/*` on the deployment hostname. Protect every reachable admin hostname; disable the extra Workers hostname when serving only a protected custom domain.
2. Set `CF_ACCESS_TEAM_DOMAIN` to the team's `…cloudflareaccess.com` domain and `CF_ACCESS_AUD` to the application's audience. Enter values in environment settings, not source files.
3. Add the first owner's lowercase Access email to D1. Replace this example address before executing it: `INSERT INTO admin_users(email,role) VALUES('owner@example.invalid','owner');`. Additional roles are `editor`, `ads` and `viewer`. Per-module JSON switches can restrict a role; they cannot grant powers outside it. Full user-management UI is Phase 2.
4. Set `GITHUB_REPO` and `GITHUB_ACTIONS_TOKEN` for Run sync now. The token needs Actions write access to this repository. Dispatch targets `nightly.yml` on `main`, with deployment off; `SCREENPEEK_SYNC_ENABLED` must also be enabled in repository variables before the job executes. Source API credentials stay in GitHub Actions.
5. Set `CLOUDFLARE_ZONE_ID` and a cache-purge token in the Worker's `CLOUDFLARE_API_TOKEN` binding. This token can differ from the sync job's token of the same name. Without it, database changes are saved and marked pending; the app does not claim that live cache propagation succeeded.

Keep `ADS_ENABLED=0` on previews. Live ads additionally require the admin master switch and each slot switch. Authenticated test-mode slots need `?adtest=1` on an Access-protected preview; a query flag alone never authorizes them. Static pages pick up changes only on their next build, as approved by the owner.

Configuration exports contain ad code and destinations. Keep the downloaded file private. This export covers configuration and content overrides, not the full catalogue or image bucket; full backups are task 1.34.

Local verification generates RSA keys at test runtime, returns simulated Access certificates in an isolated Worker wrapper, and exercises the unchanged production signature verifier. These credentials and external-response fixtures are never part of a deployed build.
