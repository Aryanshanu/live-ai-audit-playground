# GOV.AX RAI Agent Service

Phase 1 of `ROADMAP.md`. The Python service GOV.AX's browser-only app couldn't provide — real ML libraries need real compute.

**Status:** Code written and tested locally (module import, endpoint behavior, and output-parsing logic all verified against real dependency installs and real ModelScan console output samples). **Never deployed.** No live URL exists yet.

## What's implemented

- `POST /checks/modelscan` — scans a Hugging Face model's actual weight file for known unsafe-deserialization patterns via ModelScan's native `-hf` flag. If `audit_id` is provided, writes the result to the real `rai_findings` table using the Supabase **service role** key (bypasses RLS by design — this is the one place in the whole system that should have that level of access, and only server-side).
- `POST /checks/fairness` — real Fairlearn `demographic_parity_ratio` and `equalized_odds_ratio` computed on caller-supplied `y_true`/`y_pred`/`sensitive_features`. Scope note: this audits decisions a model already made — it doesn't train one. Writes to the real `fairness_metrics` table when `audit_id` is provided. **Real caveat found during testing, not theoretical**: a genuinely fair 50/50 process at n=100/group produced a false "non-compliant" reading (ratio 0.77) purely from sampling noise — confirmed by rerunning at n=20,000/group, which correctly converged to 0.99. The endpoint now returns a `small_sample_warning` field whenever the smallest group has under 1,000 rows.
- `GET /health` — reports whether the Supabase connection is configured.

## What isn't implemented yet

MLflow (real model-version lineage) and SHAP (real explainability) — per `ROADMAP.md`'s sequencing.

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

## Deploying to Fly.io (region choice explained in `fly.toml`)

```bash
flyctl launch --no-deploy   # review the generated config against fly.toml first
flyctl secrets set SUPABASE_URL=https://ceppqcqgwietagzixrhr.supabase.co
flyctl secrets set SUPABASE_SERVICE_ROLE_KEY=<from Supabase dashboard, never the anon key>
flyctl deploy
```

The `SUPABASE_SERVICE_ROLE_KEY` is not the anon/publishable key used in the frontend — it's a separate, far more powerful key that bypasses Row Level Security entirely. Get it from the Supabase dashboard (Project Settings → API → `service_role` secret). It must never appear in any frontend code, any committed file, or anywhere outside this service's deployment secrets.
