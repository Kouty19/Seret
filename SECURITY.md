# Security Policy

Thank you for taking the time to make Seret safer for everyone.

## Supported versions

The only supported version is the deployment currently running on
`https://seret-weld.vercel.app`. Past commits are not maintained.

## Reporting a vulnerability

Please **do not** open a public GitHub issue for a security report.

Email **kouty@elevon.fr** with:
- A short title and description of the issue
- Steps to reproduce (or a proof of concept)
- The impact you believe it has
- Your name / handle if you'd like to be credited

We try to respond within **72 hours** and to ship a fix within **14 days**
for confirmed issues. Critical vulnerabilities (account takeover, data
exfiltration, child-safety bypass) get an emergency response.

## Safe harbor / responsible disclosure

Security research done in good faith — no data exfiltration beyond what is
needed to prove the bug, no disruption of service, no social engineering of
users or employees — will not be met with legal action. Please give us a
reasonable window to fix the issue before public disclosure (90 days by
default, shorter if we've already patched).

## In scope

- `https://seret-weld.vercel.app` — web app, API routes, server-side code
- Our Supabase project (auth / DB / RLS policies)
- Supply-chain issues in the dependencies we ship

## Out of scope

- Vercel / Supabase / TMDB / Anthropic infrastructure (report to the vendor)
- Social engineering of individual users
- DoS that requires more bandwidth than we have a SLA for
- Third-party sign-in provider bugs (Google / Apple / Facebook)

## What we deploy as a defense in depth

- **Rate limiting** — 100 req/min/IP globally, 10 req/min/IP on AI routes
- **Security headers** on every response — CSP, HSTS, X-Frame-Options,
  X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- **Row-Level Security** enforced on every Supabase table
- **API keys** (TMDB, Claude, Stripe, service-role) live only server-side
- **Input validation** — type & length checks on user-supplied params
- **Content filters** — `include_adult=false` on all TMDB calls +
  multilingual NSFW keyword blocklist, for every user, no exceptions
- **Child profile isolation** — separate kind=`kid`, optional parental PIN,
  extra genre/keyword filters on top of adult filters
- **No card data stored** — Stripe Checkout only (when Premium reactivates)
- **Logging** — 5xx errors go to Vercel logs; no PII in logs beyond IP

## Data handling

See [/privacy](https://seret-weld.vercel.app/privacy) for the full policy.
Summary: minimum data collected, no ad networks, no selling, full account
deletion via Settings → Delete my account.

## Contact

- Security issues: **kouty@elevon.fr** (subject starting with `[SECURITY]`)
- Everything else: same address, any subject
