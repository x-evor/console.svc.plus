import Link from "next/link";

export interface Crumb {
  label: string;
  href: string;
}

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav className="mb-1 flex flex-wrap items-center gap-2 text-sm text-text-muted">
      {items.map((item, index) => (
        <div key={`${item.href}-${index}`} className="flex items-center gap-2">
          {index > 0 ? <span className="text-slate-300">/</span> : null}
          <Link
            href={item.href}
            className="rounded-full border border-slate-900/10 bg-white px-3 py-1.5 transition hover:border-slate-900/15 hover:text-primary"
          >
            {item.label}
          </Link>
        </div>
      ))}
    </nav>
  );
}
