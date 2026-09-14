'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Target, FlaskConical, ChevronRight } from 'lucide-react';
import { PILLARS, CAPABILITY_STATUS } from '../lib/pillarConfig';
import { runLiveSecuritySuite } from '../lib/livePromptProbe';
import { scanForPii } from '../lib/piiPatterns';
import { useHfConfig } from '../lib/useHfConfig';
import { getEvidenceTier } from '../lib/evidenceTiers';

/**
 * One reusable page for every evaluation pillar.
 *
 * Format follows the reference (capability strip → target selector + run
 * action → empty state → score tiles → custom prompt test). The engines
 * behind it are GOV.AX's own, and the capability badges state honestly
 * which are live, which are built-but-undeployed, and which are planned.
 *
 * The "Custom Prompt Test" is the most useful idea borrowed here: letting
 * someone throw their own adversarial prompt at a live model and see the
 * real response beats any number of canned demo results.
 */
export default function PillarPage({ pillarId }) {
  const pillar = PILLARS[pillarId];
  const { hfToken, setHfToken, modelId, setModelId } = useHfConfig();
  const [suite, setSuite] = useState(null); // null | 'running:<label>' | result
  const [customPrompt, setCustomPrompt] = useState('');
  const [customResult, setCustomResult] = useState(null);
  const [thorough, setThorough] = useState(false);

  const running = typeof suite === 'string' && suite.startsWith('running');
  const tier = getEvidenceTier('live_dynamic_test');

  const runSuite = useCallback(async () => {
    setSuite('running:Starting…');
    setCustomResult(null);
    const result = await runLiveSecuritySuite(modelId, hfToken, (l) => setSuite(`running:${l}`), thorough);
    setSuite(result);
  }, [modelId, hfToken, thorough]);

  const runCustom = useCallback(async () => {
    if (!customPrompt.trim()) return;
    setCustomResult({ running: true });
    try {
      const res = await fetch('https://router.huggingface.co/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${hfToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: modelId, messages: [{ role: 'user', content: customPrompt }], max_tokens: 400 }),
      });
      if (!res.ok) throw new Error(`Model returned HTTP ${res.status}.`);
      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content ?? '';
      setCustomResult({ content, pii: scanForPii(content) });
    } catch (err) {
      setCustomResult({ error: err.message });
    }
  }, [customPrompt, modelId, hfToken]);

  return (
    <div className="space-y-4 max-w-5xl">
      {/* ── Capability strip ── */}
      <div className="flex flex-wrap items-center gap-2">
        {pillar.capabilities.map((c, i) => {
          if (c.kind === 'mode') {
            return (
              <span key={i} className="text-[10px] font-bold px-2 py-1 rounded-lg bg-fb-blueLight text-fb-blue border border-fb-blue/30">
                {c.label}
              </span>
            );
          }
          if (c.kind === 'io') {
            return (
              <span key={i} className="text-[10px] px-2 py-1 rounded-lg bg-fb-card border border-fb-border text-fb-textSecondary">
                <strong className="text-fb-text">{c.label}:</strong> {c.text}
              </span>
            );
          }
          const st = CAPABILITY_STATUS[c.status];
          return (
            <span
              key={i}
              title={st.note ?? 'Live'}
              className="text-[10px] px-2 py-1 rounded-lg bg-fb-card border border-fb-border text-fb-text flex items-center gap-1.5"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
              {c.label}
              {st.note && <span className="text-fb-textSecondary">· {st.note}</span>}
            </span>
          );
        })}
      </div>

      {/* ── Target selector + run ── */}
      <div className="p-4 bg-fb-card border border-fb-border rounded-xl space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold text-fb-textSecondary uppercase tracking-wide block mb-1">
              Select Model
            </label>
            <input
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              placeholder="e.g. meta-llama/Llama-3-8B-Instruct"
              className="w-full px-3 py-2 text-[12px] bg-fb-bg border border-fb-border rounded-lg text-fb-text focus:outline-none focus:border-fb-blue"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-fb-textSecondary uppercase tracking-wide block mb-1">
              Hugging Face Token
            </label>
            <input
              type="password"
              value={hfToken}
              onChange={(e) => setHfToken(e.target.value)}
              placeholder="hf_…"
              className="w-full px-3 py-2 text-[12px] bg-fb-bg border border-fb-border rounded-lg text-fb-text focus:outline-none focus:border-fb-blue"
            />
          </div>
        </div>

        {pillarId === 'pentesting' && (
          <label className="flex items-center gap-2 text-[11px] text-fb-textSecondary cursor-pointer">
            <input type="checkbox" checked={thorough} onChange={(e) => setThorough(e.target.checked)} className="cursor-pointer" />
            Thorough scan — 3 phrasing variants per vector for a real containment rate
          </label>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={runSuite}
            disabled={running || !hfToken || !modelId}
            className="px-4 py-2 text-[12px] bg-fb-blue hover:bg-fb-blueHover text-white rounded-lg font-medium disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
          >
            <Play size={13} /> {running ? suite.split(':')[1] : pillar.runLabel}
          </button>
          {!hfToken && (
            <span className="text-[10px] text-fb-textSecondary">
              A free Hugging Face token is required — probes run on your own inference credits.
            </span>
          )}
        </div>
      </div>

      {/* ── Empty state ── */}
      {!suite && (
        <div className="p-10 bg-fb-card border border-fb-border rounded-xl text-center">
          <Target size={26} className="mx-auto text-fb-textSecondary mb-2" />
          <h3 className="text-sm font-bold text-fb-text">{pillar.emptyTitle}</h3>
          <p className="text-[11px] text-fb-textSecondary mt-1 max-w-md mx-auto">{pillar.emptyBody}</p>
        </div>
      )}

      {/* ── Results ── */}
      <AnimatePresence>
        {suite && typeof suite === 'object' && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            {suite.error ? (
              <p className="text-[12px] text-fb-red p-3 bg-red-50 border border-red-200 rounded-lg">⚠ {suite.error}</p>
            ) : (
              <>
                <div className="p-4 bg-fb-card border border-fb-border rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[11px] text-fb-textSecondary">
                      <span className="font-mono text-fb-text">{modelId}</span> — live results
                    </p>
                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${tier.badgeClass}`}>
                      {tier.shortLabel}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-6">
                    <div>
                      <p className={`text-3xl font-black ${suite.score >= 75 ? 'text-fb-green' : suite.score >= 50 ? 'text-amber-500' : 'text-fb-red'}`}>
                        {suite.score}%
                      </p>
                      <p className="text-[9px] font-bold text-fb-textSecondary uppercase tracking-widest">Containment</p>
                    </div>
                    <div>
                      <p className="text-3xl font-black text-fb-text">{suite.probes?.length ?? 0}</p>
                      <p className="text-[9px] font-bold text-fb-textSecondary uppercase tracking-widest">Vectors</p>
                    </div>
                  </div>
                </div>

                {suite.outputPiiFlags?.length > 0 && (
                  <p className="text-[11px] text-fb-red p-2.5 bg-red-50 border border-red-200 rounded-lg">
                    ⚠ PII-shaped content found in {suite.outputPiiFlags.length} live response(s) — scanned from real model output.
                  </p>
                )}

                <div className="space-y-2">
                  {suite.probes?.map((p) => (
                    <div
                      key={p.id}
                      className={`p-3 rounded-lg border text-[11px] ${
                        p.status === 'pass' ? 'bg-green-50 border-green-200' :
                        p.status === 'fail' ? 'bg-red-50 border-red-200' : 'bg-fb-bg border-fb-border'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-fb-text">{p.label}</span>
                        <span className={`text-[9px] font-bold uppercase ${
                          p.status === 'pass' ? 'text-fb-green' : p.status === 'fail' ? 'text-fb-red' : 'text-fb-textSecondary'
                        }`}>{p.status}</span>
                      </div>
                      <p className="text-fb-textSecondary mt-1">{p.detail}</p>
                      {p.clause && <p className="text-[9px] text-fb-textSecondary mt-1 font-mono">{p.clause}</p>}
                    </div>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Custom Prompt Test ── */}
      {pillar.promptPlaceholder && (
        <div className="p-4 bg-fb-card border border-fb-border rounded-xl">
          <h3 className="text-xs font-bold text-fb-text flex items-center gap-1.5">
            <FlaskConical size={13} className={pillar.accent} /> Custom Prompt Test
          </h3>
          <p className="text-[10px] text-fb-textSecondary mt-0.5 mb-2.5">{pillar.promptHelp}</p>

          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder={pillar.promptPlaceholder}
            rows={3}
            className="w-full px-3 py-2 text-[12px] bg-fb-bg border border-fb-border rounded-lg text-fb-text placeholder-fb-textSecondary focus:outline-none focus:border-fb-blue resize-none"
          />

          <button
            onClick={runCustom}
            disabled={!customPrompt.trim() || !hfToken || !modelId || customResult?.running}
            className="mt-2 px-3 py-1.5 text-[11px] bg-fb-blueLight hover:bg-fb-blue/20 text-fb-blue border border-fb-blue/30 rounded-lg font-medium disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
          >
            <ChevronRight size={12} /> {customResult?.running ? 'Running…' : 'Run Test'}
          </button>

          {customResult && !customResult.running && (
            <div className="mt-3">
              {customResult.error ? (
                <p className="text-[11px] text-fb-red">⚠ {customResult.error}</p>
              ) : (
                <>
                  <p className="text-[10px] font-bold text-fb-textSecondary uppercase tracking-wide mb-1">
                    Live model response
                  </p>
                  <pre className="p-3 bg-fb-bg border border-fb-border rounded-lg text-[11px] text-fb-text whitespace-pre-wrap font-sans max-h-64 overflow-y-auto">
                    {customResult.content || '(empty response)'}
                  </pre>
                  {customResult.pii?.length > 0 && (
                    <p className="mt-2 text-[11px] text-fb-red">
                      ⚠ PII-shaped content detected in the response: {customResult.pii.join(', ')}
                    </p>
                  )}
                  <p className="mt-2 text-[10px] text-fb-textSecondary">
                    This is the model&apos;s real, unedited output. Judge it yourself — GOV.AX does not score free-form
                    responses, because a confident-looking automated verdict on open text would be weaker evidence than
                    your own reading.
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
