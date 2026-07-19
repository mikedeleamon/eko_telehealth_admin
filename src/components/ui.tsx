/** Small shared building blocks in the deck's card-based design language. */

export function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="mb-8">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-sm text-foreground/55 mt-1">{subtitle}</p>
    </header>
  );
}

export function Card({
  children,
  tint,
  className = "",
}: {
  children: React.ReactNode;
  tint?: "blue" | "pink" | "yellow" | "purple";
  className?: string;
}) {
  const tintClass =
    tint === "blue" ? "bg-card-blue"
    : tint === "pink" ? "bg-card-pink"
    : tint === "yellow" ? "bg-card-yellow"
    : tint === "purple" ? "bg-card-purple"
    : "bg-white";
  return (
    <div className={`rounded-3xl p-6 shadow-sm shadow-black/5 ${tintClass} ${className}`}>
      {children}
    </div>
  );
}

export function StatusDot({ color }: { color: string }) {
  return <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: color }} />;
}

export function Badge({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant: "green" | "red" | "orange" | "accent" | "gray";
}) {
  const styles: Record<string, string> = {
    green: "bg-green/10 text-green",
    red: "bg-red/10 text-red",
    orange: "bg-orange/15 text-orange",
    accent: "bg-accent/10 text-accent",
    gray: "bg-black/5 text-foreground/50",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${styles[variant]}`}>
      {children}
    </span>
  );
}

export function LoadingRows() {
  return (
    <div className="space-y-3 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-16 rounded-2xl bg-black/5" />
      ))}
    </div>
  );
}
