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
