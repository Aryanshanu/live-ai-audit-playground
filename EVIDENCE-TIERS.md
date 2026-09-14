# Evidence Tiers — Specification v0.1

**Status:** Draft. Implemented in GOV.AX; proposed as a reusable standard.

## The problem this solves

Most AI governance tools show you a score and ask you to trust it. But the ways a finding can be produced differ enormously in strength:

- "Your architecture document contains the word *encryption*" and
- "We fired 3 adversarial prompts at your live model and 1 succeeded"

...are not the same kind of evidence. Collapsing both into one number is the central dishonesty this spec exists to prevent.

**Core rule:** every finding carries a tier declaring *how it was produced*, and that tier is visible everywhere the finding is — UI, API response, and exported report. Never in a footnote, never only in a methodology PDF.

## The tiers

| Tier | ID | What it means | Weight |
|---|---|---|---|
| 🟡 Heuristic | `heuristic_text` | Matched a keyword/pattern in free text. Proves someone *wrote* a phrase — not that the system behaves that way. Cannot detect negation, paraphrase, or lies. | 1 |
| 🔵 Verified | `verified_data` | Computed from real structured data — API metadata, or real statistics on a real dataset. | 2 |
| 🟣 On-Device | `local_inference` | A real ML model ran locally (in-browser, no network) to produce this. Real inference, but a general-purpose model applied to a specialized task. | 2 |
| 🟢 Live Test | `live_dynamic_test` | An actual probe was executed against a live system and its real response evaluated. Strongest tier: observes behavior, not description. | 3 |

The composite score is weighted by these values, and the **percentage of the score backed by non-heuristic evidence is displayed alongside it**. A 90% score built entirely from keyword matches and a 90% score built from live probes are not the same claim, and the UI must not let them look the same.

## Required companion fields

A tier alone is insufficient when a *correctly-computed* result can still be untrustworthy. Implementations MUST surface conditions that undermine a finding, as first-class fields — not prose caveats. GOV.AX's own examples, each of which came from a real bug or real test failure:

| Field | Fires when | Why it exists |
|---|---|---|
| `small_sample_warning` | Smallest group < 1000 rows in a fairness check | A genuinely fair 50/50 process at n=100/group produced a false "non-compliant" ratio of 0.77 in testing. Confirmed as sampling noise by rerunning at n=20,000 (converged to 0.99). |
| `low_fidelity_warning` | Surrogate fidelity < 0.85 in an explainability check | A SHAP explanation of a surrogate that doesn't match the real model is a confident-looking wrong answer — worse than no answer. |
| `known_limitations` | Always, on supply-chain scans | ModelScan has publicly documented bypasses (a disclosed CVSS 9.8 RCE bypass). "No issues found" means *no known-technique match*, never "safe." |

**The principle:** if a result can mislead, the thing that would mislead ships *inside the response*, not in documentation the caller may never read.

## Verifiability requirements

A tier claim is only meaningful if it can be checked. For tiers asserting system properties:

- **Claims must be tested, not inferred.** GOV.AX claimed "immutable audit log" for several development sessions based on *reading* its RLS policies. That claim was only [actually tested](#) later — by creating a real authenticated user and attempting UPDATE and DELETE. It passed, but the gap between "asserted" and "verified" was real, and unexamined assertions are how governance tools become theater.
- **Tamper-evidence must be independently checkable.** GOV.AX's audit log is hash-chained: each row hashes its content plus the previous row's hash. Any signed-in auditor can call `verify_audit_log_integrity()` and get back `(intact, rows_checked, first_broken_id)` — enough to detect and locate tampering, without read access to log contents.

**Honest limit of that mechanism:** hash-chaining makes *silent, partial* tampering detectable. It does not *prevent* a determined party with full database access from rewriting the entire chain. Full prevention requires anchoring periodic Merkle roots outside the operator's control. GOV.AX does not do this yet, and does not claim to.

## What a conforming implementation must do

1. Assign exactly one tier to every finding.
2. Display the tier everywhere the finding appears.
3. Weight composite scores by tier, and show the non-heuristic percentage.
4. Surface undermining conditions as structured fields, not prose.
5. Never upgrade a tier for presentational reasons. A keyword match reported as a live test is the specific failure this spec exists to prevent.

## Open questions for v0.2

- Proposed tiers `community_verified` and `regulator_accepted` — deliberately not included in v0.1, since neither has a defined verification process yet, and a tier without a process is decoration.
- Whether tier weights should be configurable per-organization, or fixed for comparability across organizations.
