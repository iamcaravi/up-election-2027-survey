export function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-8 max-w-2xl">
      {eyebrow && <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent">{eyebrow}</p>}
      <h2 className="font-display text-2xl font-extrabold sm:text-3xl">{title}</h2>
      {subtitle && <p className="mt-2 text-sm text-muted sm:text-base">{subtitle}</p>}
    </div>
  );
}
