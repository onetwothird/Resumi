export default function AuroraBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <style>{`
        @keyframes aurora-drift-a {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(6%, 8%) scale(1.15); }
        }
        @keyframes aurora-drift-b {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-8%, 5%) scale(1.1); }
        }
        @keyframes aurora-drift-c {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(4%, -8%) scale(1.2); }
        }
        .aurora-a { animation: aurora-drift-a 22s ease-in-out infinite; }
        .aurora-b { animation: aurora-drift-b 26s ease-in-out infinite; }
        .aurora-c { animation: aurora-drift-c 19s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .aurora-a, .aurora-b, .aurora-c { animation: none; }
        }
      `}</style>

      {/* Soft indigo/violet blobs — muted in light mode, glowing in dark mode */}
      <div className="aurora-a absolute -top-40 -left-24 w-136 h-136 rounded-full bg-indigo-300/40 dark:bg-indigo-600/25 blur-[110px]" />
      <div className="aurora-b absolute -top-16 -right-32 w-xl h-144 rounded-full bg-violet-300/30 dark:bg-fuchsia-600/15 blur-[120px]" />
      <div className="aurora-c absolute top-40 left-1/3 w-md h-112 rounded-full bg-sky-200/40 dark:bg-indigo-500/15 blur-[100px]" />

      {/* Faint dot grid for texture */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(79,70,229,0.12)_1px,transparent_0)] bg-size-[32px_32px] dark:bg-[radial-gradient(circle_at_1px_1px,rgba(129,140,248,0.18)_1px,transparent_0)]" />

      {/* Fade the aurora into the page background at the bottom so it blends into the next section */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-linear-to-b from-transparent to-[#F7F9FC] dark:to-slate-950" />
    </div>
  );
}