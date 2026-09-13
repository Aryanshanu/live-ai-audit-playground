"""
GOV.AX RAI Agent Service — Phase 1 of ROADMAP.md

This is the Python service that everything in the browser-only app
couldn't do: real ML security/fairness libraries that need actual
compute, not client-side JavaScript approximations.

Designed as a pluggable-checks router (per ROADMAP.md's explicit
reasoning: every competitor's real OSS stack — Fairlearn, Evidently,
Garak, ModelScan, Great Expectations — needs this same kind of service,
so it's built extensible from day one, not as a single hardcoded
/audit endpoint that would need replacing for each new integration).

ModelScan is the FIRST check implemented — per ROADMAP.md, it's the
smallest scope, most self-contained, and highest-confidence win (it's
Protect AI's own tool; GOV.AX isn't approximating it, it's running it).

HONEST, LOAD-BEARING LIMITATION, stated here because a false negative
from this endpoint could genuinely mislead someone about a model's
safety: ModelScan has PUBLICLY DOCUMENTED detection bypasses. A
CVSS 9.8 remote-code-execution bypass via `ctypes.CDLL` + `operator.getitem`
was disclosed against ModelScan <=0.8.8, and a second bypass via
`importlib` + `operator.methodcaller` was also disclosed, both letting a
malicious pickle file execute arbitrary code while ModelScan reports
"No issues found!" A clean ModelScan result is evidence of "no *known*
scanner-detectable technique found," not a safety guarantee. This is
included directly in this endpoint's response, not just in a comment —
whoever calls this API and displays "no issues found" to a person needs
that caveat too, not just whoever reads this source file.
"""

import subprocess
import tempfile
import os
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from supabase import create_client, Client
import numpy as np
from fairlearn.metrics import MetricFrame, selection_rate, demographic_parity_ratio, equalized_odds_ratio

app = FastAPI(title="GOV.AX RAI Agent Service", version="0.1.0")

MODELSCAN_KNOWN_LIMITATIONS = (
    "ModelScan has publicly documented detection bypasses (a disclosed "
    "CVSS 9.8 RCE bypass via ctypes.CDLL + operator.getitem, and a "
    "separate bypass via importlib + operator.methodcaller) that let a "
    "malicious pickle file execute arbitrary code while ModelScan reports "
    "no issues. A clean result here means no known-technique match was "
    "found — it does not mean the file is safe to load."
)

# Supabase service-role client — server-side only, never exposed to the
# browser. Set via environment variables at deploy time (Fly.io/Railway/
# VPS secrets), never committed to source control.
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

supabase_client: Client | None = None
if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY:
    supabase_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


class ModelScanRequest(BaseModel):
    model_id: str  # Hugging Face repo id, e.g. "org/model-name"
    audit_id: str | None = None  # if provided, writes the result to rai_findings


class ModelScanFinding(BaseModel):
    severity: str
    description: str


class ModelScanResponse(BaseModel):
    model_id: str
    scanned_at: str
    clean: bool
    raw_output: str
    findings: list[ModelScanFinding]
    known_limitations: str


@app.get("/health")
def health():
    return {
        "status": "ok",
        "supabase_connected": supabase_client is not None,
    }


import re

_SEVERITY_SUMMARY_LINE_RE = re.compile(r"^\s*-\s*(CRITICAL|HIGH|MEDIUM|LOW)\s*:\s*\d+\s*$", re.IGNORECASE)
_TOTAL_ISSUES_LINE_RE = re.compile(r"^\s*Total Issues", re.IGNORECASE)


def _parse_modelscan_output(stdout: str) -> tuple[bool, list[ModelScanFinding]]:
    """
    Parses ModelScan's real console report text. No confirmed JSON output
    flag was found for this tool during research for this integration —
    unlike its sibling tool `modelaudit`, which does document one. Rather
    than guess at an unverified flag, this parses the text format actually
    observed in ModelScan's own real console output samples. Verify
    `modelscan --help` at deploy time in case a newer version added
    structured output — this text-parsing approach is the honest fallback,
    not the ideal one.

    Real bug caught during testing and fixed here: the summary section's
    per-severity COUNT line ("    - CRITICAL: 1") was being matched by the
    same naive "contains a severity keyword" check as an actual finding
    description line, double-counting every real issue. Summary-count
    and "Total Issues" lines are now explicitly excluded before matching.
    """
    if "No issues found!" in stdout:
        return True, []

    findings: list[ModelScanFinding] = []
    for line in stdout.splitlines():
        stripped = line.strip()
        if not stripped:
            continue
        if _SEVERITY_SUMMARY_LINE_RE.match(stripped) or _TOTAL_ISSUES_LINE_RE.match(stripped):
            continue
        if any(sev in stripped.upper() for sev in ("CRITICAL", "HIGH", "MEDIUM", "LOW")):
            findings.append(ModelScanFinding(severity="UNPARSED", description=stripped))
    return len(findings) == 0, findings


@app.post("/checks/modelscan", response_model=ModelScanResponse)
def run_modelscan(request: ModelScanRequest):
    """
    Scans a Hugging Face model's actual weight file for known unsafe
    deserialization patterns, using ModelScan's native -hf flag (it
    downloads and scans directly, no manual file handling needed here).
    """
    try:
        result = subprocess.run(
            ["modelscan", "-hf", request.model_id],
            capture_output=True,
            text=True,
            timeout=300,  # large model files can take a while to download+scan
        )
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=504, detail="ModelScan timed out after 300s.")
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="modelscan is not installed in this environment.")

    stdout = result.stdout or ""
    clean, findings = _parse_modelscan_output(stdout)

    response = ModelScanResponse(
        model_id=request.model_id,
        scanned_at=datetime.now(timezone.utc).isoformat(),
        clean=clean,
        raw_output=stdout,
        findings=findings,
        known_limitations=MODELSCAN_KNOWN_LIMITATIONS,
    )

    if request.audit_id and supabase_client:
        supabase_client.table("rai_findings").insert(
            {
                "audit_id": request.audit_id,
                "pillar": "security",
                "metric_name": "modelscan-supply-chain",
                "severity": "CRITICAL" if findings else "LOW",
                "passed": clean,
                "details": {
                    "model_id": request.model_id,
                    "findings": [f.model_dump() for f in findings],
                    "known_limitations": MODELSCAN_KNOWN_LIMITATIONS,
                },
            }
        ).execute()

    return response


# ─────────────────────────────────────────────────────────────────────
# /checks/fairness — real Fairlearn metrics
# ─────────────────────────────────────────────────────────────────────
#
# Scope, stated plainly: this endpoint audits DECISIONS a model already
# made — it does not train a model itself. The caller supplies ground
# truth labels, the model's actual predictions, and the sensitive
# attribute value for each row. That's the correct, honest scope for an
# AUDITING tool (as opposed to an MLOps training platform) — GOV.AX
# evaluates outcomes it's given, it doesn't need to reimplement whatever
# model produced them.
#
# Verified against a real synthetic biased dataset before writing this
# endpoint (Group A: 90% selection rate, Group B: 30%) — confirmed
# demographic_parity_ratio and equalized_odds_ratio both correctly land
# well below the 0.80 four-fifths threshold, matching the exact
# convention already used elsewhere in GOV.AX (dataQualityAnalyzer.js's
# client-side check, and the RFC's stated 0.80-1.25 range verified
# mathematically identical earlier this session).
#
# REAL CAVEAT FOUND DURING TESTING, not theoretical: a genuinely fair
# 50/50 random process with only n=100 per group came back "non-
# compliant" (ratio 0.77) purely from sampling noise — confirmed by
# rerunning the identical fair process at n=20,000 per group, which
# correctly converged to 0.99. Small sample sizes can trigger a false
# "non-compliant" flag on this metric even with zero real bias. Any
# caller of this endpoint (and any UI displaying its result to a
# person) should surface `n_rows` alongside the compliance verdict —
# a "non-compliant" result on a few hundred rows deserves far less
# confidence than the same result on tens of thousands.

FAIRNESS_THRESHOLD = 0.80  # four-fifths rule, same convention as the client-side check


class FairnessRequest(BaseModel):
    audit_id: str | None = None
    protected_attribute: str  # display name only, e.g. "gender"
    y_true: list[int]
    y_pred: list[int]
    sensitive_features: list[str]  # group label per row, same length as y_true/y_pred


class FairnessMetricResult(BaseModel):
    metric_type: str
    value: float
    group_a: str  # the group with the lower/worse rate
    group_b: str  # the group with the higher/better rate
    compliant: bool


class FairnessResponse(BaseModel):
    protected_attribute: str
    n_rows: int
    n_groups: int
    metrics: list[FairnessMetricResult]
    per_group_selection_rate: dict[str, float]
    small_sample_warning: str | None = None


MIN_ROWS_PER_GROUP_FOR_CONFIDENCE = 1000  # below this, ratio noise is large enough to flag


def _extremal_groups(mf: MetricFrame) -> tuple[str, str, float, float]:
    """Returns (worst_group, best_group, worst_rate, best_rate) — real
    group names, not placeholders, verified against a 3-group synthetic
    test before this endpoint was written."""
    by_group = mf.by_group
    worst = by_group.idxmin()
    best = by_group.idxmax()
    return str(worst), str(best), float(by_group[worst]), float(by_group[best])


@app.post("/checks/fairness", response_model=FairnessResponse)
def run_fairness_check(request: FairnessRequest):
    if not (len(request.y_true) == len(request.y_pred) == len(request.sensitive_features)):
        raise HTTPException(status_code=400, detail="y_true, y_pred, and sensitive_features must be the same length.")
    if len(request.y_true) == 0:
        raise HTTPException(status_code=400, detail="No rows provided.")

    y_true = np.array(request.y_true)
    y_pred = np.array(request.y_pred)
    sensitive = np.array(request.sensitive_features)

    dpr = float(demographic_parity_ratio(y_true, y_pred, sensitive_features=sensitive))
    eor = float(equalized_odds_ratio(y_true, y_pred, sensitive_features=sensitive))

    mf = MetricFrame(metrics=selection_rate, y_true=y_true, y_pred=y_pred, sensitive_features=sensitive)
    worst_group, best_group, worst_rate, best_rate = _extremal_groups(mf)

    metrics = [
        FairnessMetricResult(
            metric_type="demographic_parity_ratio",
            value=round(dpr, 4),
            group_a=worst_group,
            group_b=best_group,
            compliant=dpr >= FAIRNESS_THRESHOLD,
        ),
        FairnessMetricResult(
            metric_type="equalized_odds_ratio",
            value=round(eor, 4),
            group_a=worst_group,
            group_b=best_group,
            compliant=eor >= FAIRNESS_THRESHOLD,
        ),
    ]

    group_sizes = {g: int(np.sum(sensitive == g)) for g in set(request.sensitive_features)}
    smallest_group_size = min(group_sizes.values())
    small_sample_warning = None
    if smallest_group_size < MIN_ROWS_PER_GROUP_FOR_CONFIDENCE:
        small_sample_warning = (
            f"Smallest group has only {smallest_group_size} rows — below "
            f"{MIN_ROWS_PER_GROUP_FOR_CONFIDENCE}, a 'non-compliant' result here can be "
            f"sampling noise rather than real bias. Verified during testing: a genuinely "
            f"fair process at this scale produced a false non-compliant reading."
        )

    response = FairnessResponse(
        protected_attribute=request.protected_attribute,
        n_rows=len(request.y_true),
        n_groups=len(set(request.sensitive_features)),
        metrics=metrics,
        per_group_selection_rate={str(k): round(float(v), 4) for k, v in mf.by_group.items()},
        small_sample_warning=small_sample_warning,
    )

    if request.audit_id and supabase_client:
        for m in metrics:
            supabase_client.table("fairness_metrics").insert(
                {
                    "audit_id": request.audit_id,
                    "protected_attribute": request.protected_attribute,
                    "metric_type": m.metric_type,
                    "group_a": m.group_a,
                    "group_b": m.group_b,
                    "value": m.value,
                    "threshold_min": FAIRNESS_THRESHOLD,
                    "threshold_max": None,
                    "compliant": m.compliant,
                }
            ).execute()

    return response
