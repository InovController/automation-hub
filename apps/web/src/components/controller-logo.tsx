export function ControllerLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M 78.3,26.2 A 37,37 0 1,0 78.3,73.8 L 65.3,62.9 A 20,20 0 1,1 65.3,37.1 Z"
      />
    </svg>
  );
}
