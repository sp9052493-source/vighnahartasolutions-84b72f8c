import type { ReactNode } from "react";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";

export function LegalShell({
  title,
  subtitle,
  updated,
  children,
}: {
  title: string;
  subtitle?: string;
  updated?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="bg-hero text-primary-foreground">
        <div className="mx-auto max-w-4xl px-4 py-14 lg:px-6">
          <h1 className="font-display text-3xl font-extrabold lg:text-4xl">{title}</h1>
          {subtitle && <p className="mt-3 max-w-2xl text-primary-foreground/80">{subtitle}</p>}
          {updated && <p className="mt-4 text-xs uppercase tracking-wider text-primary-foreground/60">Last updated: {updated}</p>}
        </div>
      </section>
      <main className="mx-auto max-w-4xl px-4 py-12 lg:px-6">
        <article className="prose prose-slate max-w-none text-sm leading-relaxed text-foreground prose-headings:font-display prose-headings:text-foreground prose-h2:mt-10 prose-h2:text-xl prose-h2:font-bold prose-h3:mt-6 prose-h3:text-base prose-h3:font-semibold prose-p:text-muted-foreground prose-li:text-muted-foreground prose-a:text-primary">
          {children}
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
