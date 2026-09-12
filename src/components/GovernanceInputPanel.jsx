'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence, useAnimationControls } from 'framer-motion';
import ToggleSwitch from './ToggleSwitch';

const MODEL_ID_REGEX = /^[a-zA-Z0-9_-]+\/[a-zA-Z0-9._-]+$/;

export default function GovernanceInputPanel({ onSubmit, loading }) {
  const [modelId, setModelId] = useState('');
  const [useCase, setUseCase] = useState('customer-facing');
  const [minorData, setMinorData] = useState(false);
  const [behavioralTracking, setBehavioralTracking] = useState(false);
  const [crossBorder, setCrossBorder] = useState(false);
  const [hfToken, setHfToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [touched, setTouched] = useState(false);

  const controls = useAnimationControls();
  const isValidModelId = !touched || modelId === '' || MODEL_ID_REGEX.test(modelId);
  const isFormValid = modelId.trim() !== '' && MODEL_ID_REGEX.test(modelId);

  const handleModelIdChange = (e) => {
    setTouched(true);
    setModelId(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);

    if (!isFormValid) {
      // Trigger error shake feedback on input
      await controls.start({
        x: [-6, 6, -4, 4, -2, 2, 0],
        transition: { duration: 0.35, ease: 'easeInOut' },
      });
      return;
    }

    onSubmit({
      modelId: modelId.trim(),
      useCase,
      minorData,
      behavioralTracking,
      crossBorder,
      hfToken: hfToken.trim() || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Section Header */}
      <div>
        <h2 className="text-lg font-bold text-gray-100 tracking-wide flex items-center gap-2">
          <span className="text-emerald-400">⚙</span> Model Card Scanner
        </h2>
        <p className="text-xs text-gray-500 mt-1 font-mono">
          Query live metadata &amp; tags directly from Hugging Face Hub
        </p>
      </div>

      {/* ── Model ID ── */}
      <div>
        <label htmlFor="model-id" className="block text-sm font-medium text-gray-300 mb-2">
          Hugging Face Model ID
        </label>
        <motion.input
          id="model-id"
          type="text"
          animate={controls}
          value={modelId}
          onChange={handleModelIdChange}
          placeholder="meta-llama/Llama-3-8B-Instruct"
          autoComplete="off"
          spellCheck="false"
          className={`w-full px-4 py-3 bg-[#0B0F19] border rounded-lg font-mono text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 transition-all duration-200 ${
            !isValidModelId
              ? 'border-red-500 focus:ring-red-500/50 neon-glow-red'
              : 'border-[#1E293B] focus:ring-emerald-500/50 focus:border-emerald-500/30'
          }`}
        />
        {!isValidModelId && modelId !== '' && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1.5 text-xs text-red-400 flex items-center gap-1"
          >
            <span>⚠</span> Invalid format — use <code className="text-red-300 bg-red-500/10 px-1 rounded">namespace/model-name</code>
          </motion.p>
        )}

        {/* Preset Open-Source Models */}
        <div className="mt-2.5">
          <p className="text-[11px] text-gray-500 mb-1.5 font-mono">
            ⚡ Quick-select top open-weight models:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {[
              'meta-llama/Llama-3-8B-Instruct',
              'Qwen/Qwen2.5-7B-Instruct',
              'Qwen/Qwen2.5-7B',
              'mistralai/Mistral-7B-Instruct-v0.3',
              'google/gemma-2-9b-it',
              'openai-community/gpt2',
            ].map((preset) => (
              <motion.button
                key={preset}
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setModelId(preset);
                  setTouched(true);
                }}
                className={`text-[10px] font-mono px-2 py-1 rounded border transition-all cursor-pointer ${
                  modelId === preset
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                    : 'bg-[#0B0F19] border-[#1E293B] text-gray-400 hover:border-gray-600 hover:text-gray-200'
                }`}
              >
                {preset}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Use Case ── */}
      <div>
        <label htmlFor="use-case" className="block text-sm font-medium text-gray-300 mb-2">
          Deployment Target Use-Case
        </label>
        <select
          id="use-case"
          value={useCase}
          onChange={(e) => setUseCase(e.target.value)}
          className="w-full px-4 py-3 bg-[#0B0F19] border border-[#1E293B] rounded-lg text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/30 transition-all cursor-pointer"
        >
          <option value="customer-facing">🔴 Customer-Facing Conversational Interface (High Risk)</option>
          <option value="internal-analytics">🟡 Internal Data Analytics &amp; Processing (Medium Risk)</option>
          <option value="academic-creative">🟢 Automated Academic / Creative Generation (Low Risk)</option>
        </select>
      </div>

      {/* ── Demographic Framework ── */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Demographic Framework
        </label>
        <div className="space-y-3 p-4 bg-[#0B0F19] border border-[#1E293B] rounded-lg">
          <ToggleSwitch
            id="toggle-minor"
            label="Processes data of minors (< 18 years)"
            checked={minorData}
            onChange={setMinorData}
          />
          <div className="border-t border-[#1E293B]" />
          <ToggleSwitch
            id="toggle-tracking"
            label="Executes behavioral tracking / monitoring"
            checked={behavioralTracking}
            onChange={setBehavioralTracking}
          />
          <div className="border-t border-[#1E293B]" />
          <ToggleSwitch
            id="toggle-crossborder"
            label="Transfers data outside sovereign borders"
            checked={crossBorder}
            onChange={setCrossBorder}
          />
        </div>
      </div>

      {/* ── HF Token (Collapsible with AnimatePresence) ── */}
      <div>
        <button
          type="button"
          onClick={() => setShowToken(!showToken)}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1.5 group cursor-pointer"
        >
          <span
            className="transition-transform duration-200"
            style={{ display: 'inline-block', transform: showToken ? 'rotate(90deg)' : 'rotate(0deg)' }}
          >
            ▸
          </span>
          <span>🔑 Optional: Hugging Face Access Token</span>
        </button>

        <AnimatePresence>
          {showToken && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-2 overflow-hidden"
            >
              <input
                type="password"
                value={hfToken}
                onChange={(e) => setHfToken(e.target.value)}
                placeholder="hf_xxxxxxxxxxxxxxxxxxxx"
                autoComplete="off"
                className="w-full px-4 py-3 bg-[#0B0F19] border border-[#1E293B] rounded-lg font-mono text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
              <p className="mt-1.5 text-[10px] text-gray-600">
                🔒 Token is passed locally via header only — never stored or indexed.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Submit Button with Shake and whileTap ── */}
      <motion.button
        type="submit"
        disabled={loading}
        whileHover={isFormValid ? { scale: 1.01 } : {}}
        whileTap={{ scale: 0.98 }}
        className={`w-full py-4 rounded-lg font-extrabold text-sm tracking-[0.2em] uppercase transition-all duration-300 ${
          isFormValid
            ? 'bg-emerald-500 hover:bg-emerald-400 text-[#0B0F19] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] cursor-pointer'
            : 'bg-gray-800/60 text-gray-500 cursor-not-allowed border border-gray-700/50'
        }`}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-3">
            <span className="w-4 h-4 border-2 border-gray-600 border-t-emerald-300 rounded-full animate-spin" />
            <span>Querying HF Hub...</span>
          </span>
        ) : (
          '▶  RUN METADATA AUDIT'
        )}
      </motion.button>
    </form>
  );
}
