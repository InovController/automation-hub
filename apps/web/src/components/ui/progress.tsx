export function Progress({ value }: { value: number }) {
  return (
    <div className="h-4 overflow-hidden rounded-full bg-slate-100 dark:bg-[#10192a]">
      <div
        className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 transition-[width]"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}
