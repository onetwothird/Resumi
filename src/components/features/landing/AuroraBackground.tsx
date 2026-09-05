export default function AuroraBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(15,23,42,0.07)_1px,transparent_0)] bg-size-[28px_28px] dark:bg-[radial-gradient(circle_at_1px_1px,rgba(148,163,184,0.12)_1px,transparent_0)]" />

      <div className="absolute -top-24 left-[8%] w-155 h-105 rounded-full bg-indigo-100/50 dark:bg-indigo-500/10 blur-[130px]" />

      <div className="absolute inset-x-0 bottom-0 h-32 bg-linear-to-b from-transparent to-background dark:to-slate-950" />
    </div>
  );
}