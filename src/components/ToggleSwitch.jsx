'use client';

/**
 * Accessible toggle switch with keyboard support and ARIA attributes.
 */
export default function ToggleSwitch({ label, checked, onChange, id }) {
  return (
    <label
      htmlFor={id}
      className="flex items-center justify-between cursor-pointer group py-1"
    >
      <span className="text-sm text-gray-300 group-hover:text-gray-100 transition-colors select-none pr-4">
        {label}
      </span>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onChange(!checked);
          }
        }}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-offset-2 focus:ring-offset-[#0B0F19] ${
          checked ? 'bg-emerald-500' : 'bg-gray-700'
        }`}
      >
        <span
          aria-hidden="true"
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </label>
  );
}
