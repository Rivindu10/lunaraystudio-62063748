import type { ReactNode } from "react";

export function PageHeader({ eyebrow, title, children }: { eyebrow: string; title: ReactNode; children?: ReactNode }) {
  return (
    <section className="bg-secondary/60 px-5 pb-16 pt-36 text-center md:pb-20 md:pt-44">
      <p className="eyebrow animate-fade-up text-primary">{eyebrow}</p>
      <h1 className="mx-auto mt-5 max-w-3xl animate-fade-up font-serif text-5xl leading-[1.05] text-forest md:text-7xl">{title}</h1>
      {children && <div className="mx-auto mt-6 max-w-2xl animate-fade-up text-muted-foreground">{children}</div>}
    </section>
  );
}

export function SectionTitle({ eyebrow, title, align = "center" }: { eyebrow: string; title: ReactNode; align?: "center" | "left" }) {
  return (
    <div className={align === "center" ? "text-center" : ""}>
      <p className="eyebrow text-primary">{eyebrow}</p>
      <h2 className="mt-4 font-serif text-4xl leading-tight text-forest md:text-6xl">{title}</h2>
    </div>
  );
}
