import { supabase } from './client';

/**
 * Persists one completed audit to the real database: a parent row in
 * `rai_audits`, one `rai_findings` row per issue, and an `audit_log`
 * entry recording the action — all subject to the RLS policies already
 * verified on this schema (an audit_id insert only succeeds if
 * created_by matches the authenticated user).
 *
 * @param {object} params
 * @param {string} params.userId - the authenticated user's id (required — RLS will reject otherwise)
 * @param {string} params.modelId
 * @param {string} [params.datasetRef]
 * @param {Array} params.issues - findings in this app's existing shape ({ruleId|id, layer, severity, message, remediation})
 * @returns {Promise<{auditId: string}>}
 */
export async function persistAuditToDb({ userId, modelId, datasetRef, issues }) {
  if (!userId) throw new Error('Cannot persist an audit without an authenticated user.');

  const { data: audit, error: auditError } = await supabase
    .from('rai_audits')
    .insert({
      created_by: userId,
      model_id: modelId,
      dataset_ref: datasetRef || null,
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (auditError) throw new Error(`Failed to create audit record: ${auditError.message}`);

  if (issues && issues.length > 0) {
    const findingRows = issues.map((issue) => ({
      audit_id: audit.id,
      pillar: ['security', 'quality', 'rai', 'legal'].includes(issue.layer) ? issue.layer : 'legal',
      metric_name: issue.ruleId || issue.id || 'unknown',
      severity: issue.severity || null,
      passed: false,
      details: { message: issue.message, remediation: issue.remediation, evidenceType: issue.evidenceType },
    }));

    const { error: findingsError } = await supabase.from('rai_findings').insert(findingRows);
    if (findingsError) throw new Error(`Failed to persist findings: ${findingsError.message}`);
  }

  // Best-effort audit trail entry — don't fail the whole persist if this
  // one insert has a problem, since the audit record itself already
  // succeeded and is the more important write.
  const { error: logError } = await supabase.from('audit_log').insert({
    actor_id: userId,
    action: 'audit.completed',
    resource_type: 'rai_audit',
    resource_id: audit.id,
    details: { modelId, issueCount: issues?.length || 0 },
  });
  if (logError) console.warn('[GOV.AX] audit_log insert failed (non-fatal):', logError.message);

  return { auditId: audit.id };
}
