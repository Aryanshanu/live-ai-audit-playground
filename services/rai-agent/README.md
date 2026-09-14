# GOV.AX RAI Agent Service

Phase 1 of `ROADMAP.md`. The Python service GOV.AX's browser-only app couldn't provide — real ML libraries need real compute.

**Status:** Code written and tested locally (module import, endpoint behavior, and output-parsing logic all verified against real dependency installs and real ModelScan console output samples). **Never deployed.** No live URL exists yet.

## What's implemented

- `POST /checks/modelscan` — scans a Hugging Face model's actual weight file for known unsafe-deserialization patterns via ModelScan's native `-hf` flag. If `audit_id` is provided, writes the result to the real `rai_findings` table using the Supabase **service role** key (bypasses RLS by design — this is the one place in the whole system that should have that level of access, and only server-side).
- `POST /checks/fairness` — real Fairlearn `demographic_parity_ratio` and `equalized_odds_ratio` computed on caller-supplied `y_true`/`y_pred`/`sensitive_features`. Scope note: this audits decisions a model already made — it doesn't train one. Writes to the real `fairness_metrics` table when `audit_id` is provided. **Real caveat found during testing, not theoretical**: a genuinely fair 50/50 process at n=100/group produced a false "non-compliant" reading (ratio 0.77) purely from sampling noise — confirmed by rerunning at n=20,000/group, which correctly converged to 0.99. The endpoint now returns a `small_sample_warning` field whenever the smallest group has under 1,000 rows.
- `POST /checks/explainability` — real SHAP feature importance. **Never deserializes an uploaded model**: doing so would require loading arbitrary pickles server-side, the exact RCE vector `/checks/modelscan` exists to detect. Instead it fits a surrogate to reproduce the caller's supplied predictions and explains that. Returns `fidelity` (cross-validated — see below) and a `low_fidelity_warning` when the surrogate doesn't reliably match. Writes to `explainability_reports` when `audit_id` is given. **Real bug caught in testing**: train-set fidelity reported 1.0 for pure-noise predictions (RandomForest memorizes its training data), so the metric meant to flag untrustworthy explanations was vouching for meaningless ones. Now cross-validated — noise correctly scores ~0.50 and warns.
- `GET /health` — reports whether the Supabase connection is configured.

## What isn't implemented yet

MLflow (real model-version lineage) — per `ROADMAP.md`'s sequencing. SHAP is now implemented (see above).

## A finding worth repeating, not just noting

**ModelScan has publicly documented detection bypasses** — a CVSS 9.8 RCE bypass and a separate one, both letting a malicious pickle file execute code while ModelScan reports "No issues found!" This is included directly in the API's `known_limitations` field on every response, not just here — a clean scan means "no known-technique match," not "safe."

## Running locally

```bash
cd services/rai-agent
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
# http://localhost:8000/docs for interactive API docs
```

## Deploying via Coolify on Vultr (Mumbai)

**Decision, and why:** Coolify (self-hosted, open-source PaaS) over Fly.io/Railway — more aligned with this project's own open-source stance, and its built-in multi-service dashboard is the better fit once Phase 3 adds ClickHouse + Grafana alongside this service. Kamal was the leaner alternative for today's single service, but Coolify's overhead pays for itself once there are 3-4 services to manage instead of one.

**VPS: Vultr, Mumbai region specifically** — verified this is the one mainstream provider with an actual Mumbai datacenter (not just "India" generally — DigitalOcean's India presence is Bangalore, a different city). This preserves the same reasoning that drove the original Fly.io region choice: `ai.gov-prod` is in AWS `ap-south-1` (Mumbai), so co-locating this service in the same metro area minimizes latency on every database write. **Hetzner was deliberately ruled out** despite being the usual default recommendation in Coolify tutorials — it has no India datacenter at all (Germany/Finland/US/Singapore only), and using it here would have silently reintroduced the exact cross-continent latency problem already avoided once.

**Sizing:** 4-8GB RAM instance, not the minimum tier — Coolify's own control plane needs real memory (~2GB) on top of whatever this FastAPI service (and later, ClickHouse/Grafana) actually need.

### Steps

1. Provision a Vultr VPS in the Mumbai region (4-8GB RAM, any recent Ubuntu LTS).
2. Install Coolify: `curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash` (run as root on the fresh VPS — verify this against Coolify's current official docs before running, install scripts do change).
3. In the Coolify dashboard: connect this GitHub repo, point the build at `services/rai-agent/Dockerfile` (Coolify builds directly from the Dockerfile — no separate deploy config file needed, unlike Kamal's `config/deploy.yml`).
4. Set secrets in Coolify's dashboard (never commit these):
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` — not the anon/publishable key (see caveat below)
5. Deploy via the dashboard. Coolify assigns the container's `PORT` at runtime; the Dockerfile already handles this correctly (verified directly: a runtime-injected port value correctly overrides the image's default).
6. Once live, set `NEXT_PUBLIC_RAI_ENGINE_URL` in the frontend's real `.env.local` to the Coolify-assigned URL and rebuild the Next.js static export.

The `SUPABASE_SERVICE_ROLE_KEY` is not the anon/publishable key used in the frontend — it's a separate, far more powerful key that bypasses Row Level Security entirely. Get it from the Supabase dashboard (Project Settings → API → `service_role` secret). It must never appear in any frontend code, any committed file, or anywhere outside this service's deployment secrets.
