// Shared stat display — was previously redefined nearly identically in
// State/Election/District/Constituency pages. Value formatting stays the
// caller's job (some callers pass already-formatted numbers, e.g. via
// formatNumber) so this stays purely presentational.
export function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="font-display text-2xl font-extrabold text-foreground">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
