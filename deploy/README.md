# Single-server hosting templates

These examples have not been installed or verified on a real VPS. They are a starting point for your deployment operator, not evidence of a live service. Use your own domain/server/account; no hosting account is supplied.

1. Provision one current supported Linux server with local persistent disk and Node.js 24.22.1 or a compatible version exposing native Argon2 and SQLite. This release was tested on Node 24.22.1 only. Install Caddy from its official distribution and configure your domain DNS to reach that server.
2. Create an unprivileged service user `zentro`, source directory `/opt/zentro-pos`, and data/backup directories `/var/lib/zentro-pos` and `/var/backups/zentro-pos`. Service user owns only data/backup directories; restrict them to that user. Source can be read-only for runtime. Check the actual Node binary path and change ExecStart if it differs.
3. Create `/etc/zentro-pos.env`, readable only by root and the service user (e.g. owner root:zentro, mode 0640), with these server-only settings:

```dotenv
NODE_ENV=production
ZEN_HOST=127.0.0.1
PORT=4173
ZEN_PUBLIC_URL=https://YOUR-ACTUAL-DOMAIN
ZEN_DATA_DIR=/var/lib/zentro-pos
ZEN_TRUST_PROXY=1
ZEN_BACKUP_DIR=/var/backups/zentro-pos
ZEN_BACKUP_INTERVAL_HOURS=24
# Set a unique private 14-128 character value here or through your secret manager.
ZEN_BACKUP_PASSPHRASE=
```

An empty passphrase disables automatic backups. Do not leave it empty if scheduled backup is expected. The passphrase must not be embedded into source, an installer, a command argument or a client build. Copy encrypted backups off this machine and monitor failed backups/disk capacity. No automatic remote transfer/retention is implemented.

4. Before starting the service, run the interactive bootstrap as the service user with this exact data directory. For example, from the source folder: `sudo -u zentro env ZEN_DATA_DIR=/var/lib/zentro-pos /usr/bin/node server/bootstrap.mjs`. Enter your Power account information privately in the terminal. Avoid running bootstrap once as root in a different data directory and then starting an empty service.
5. Adapt/install `zentro.service.example`, including directory ownership, Node path and write permissions. Adapt Caddy's example to your real domain and forward to loopback port 4173. Caddy must preserve the incoming Host header: the application validates it against ZEN_PUBLIC_URL. Do not expose port 4173 directly. Only the HTTPS reverse proxy should be reachable publicly. No path prefix, load-balanced replicas or shared network filesystem are supported.
6. `ZEN_TRUST_PROXY=1` accepts the final valid X-Forwarded-For address only when the TCP peer is loopback. This is intended for Caddy on the same server; leave disabled without that arrangement. App rate limits remain process-local and reset on restart. Use appropriate edge limits for a public deployment.
7. Start the service and check its logs for readiness and backup state. Open the actual HTTPS origin; verify Secure session/device cookies, MFA, company onboarding, two-company isolation, reprint, reporting, encrypted backup/restore and suspension. Verify HTTP redirects to HTTPS and that data files and API secrets cannot be downloaded.
8. Set that same HTTPS origin in `desktop/desktop-config.json` and build/test your Windows installer. Existing customers must connect to the same backend to share accounts/data. Test all gates in `docs/RELEASE_GATES.md` before production.

Backups temporarily reject mutations with HTTP 503. The live checkout retains its command key for retries but does not implement an offline queue. A lost connection after checkout may have occurred after commit: check sales history before creating a different transaction. Payment entries are external records and do not capture/refund bank/card funds.

For upgrades: stop the service, create an encrypted backup, verify restore on a separate directory, keep source/version and any schema changes reviewable, then start the new release. No schema migration rollback tool is included. Never run a second server against the same data directory. Do not manually edit financial JSON to correct business mistakes; use return/adjustment operations.
