import AuditPlayground from '../components/AuditPlayground';

export default function Home() {
  return (
    <div>
      {/* ━━ Hero Section ━━ */}
      <div className="text-center mb-10 lg:mb-14">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
          <span className="text-emerald-400">Live</span>{' '}
          <span className="text-gray-100">AI Audit</span>{' '}
          <span className="text-gray-100">Playground</span>
        </h1>
        <p className="mt-4 text-sm sm:text-base text-gray-500 max-w-2xl mx-auto leading-relaxed">
          Instantly audit any open-weight AI model on Hugging Face against
          India&apos;s{' '}
          <span className="text-gray-300 font-semibold">DPDP Act 2023</span>{' '}
          and the{' '}
          <span className="text-gray-300 font-semibold">
            PSA AI Governance Framework
          </span>
          . Fully client-side. Zero data retention.
        </p>

        {/* Tech badges */}
        <div className="flex items-center justify-center gap-3 mt-5 flex-wrap">
          <Badge label="Client-Side Only" />
          <Badge label="Zero Persistence" />
          <Badge label="Rule-as-Code" />
          <Badge label="Open Source" />
        </div>
      </div>

      {/* ━━ Audit Playground ━━ */}
      <AuditPlayground />
    </div>
  );
}

function Badge({ label }) {
  return (
    <span className="inline-flex items-center px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-400/80 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
      {label}
    </span>
  );
}
