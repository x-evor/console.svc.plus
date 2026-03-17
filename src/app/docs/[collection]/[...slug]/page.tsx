export const dynamic = "error";
export const revalidate = false;

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";

import DocArticle from "@/components/doc/DocArticle";
import DocMetaPanel from "@/components/doc/DocMetaPanel";
import { PublicPageIntro } from "@/components/public/PublicPageShell";
import { isFeatureEnabled } from "@lib/featureToggles";

import Feedback from "../../Feedback";
import { getDocVersion, getDocVersionParams } from "../../resources.server";

function DocsBreadcrumbs({
  items,
}: {
  items: { label: string; href: string }[];
}) {
  return (
    <nav className="mb-5 flex flex-wrap items-center gap-2 text-sm text-text-muted">
      {items.map((item, index) => (
        <div key={item.href} className="flex items-center gap-2">
          {index > 0 ? (
            <ChevronRight className="h-4 w-4 text-slate-400" />
          ) : null}
          <Link
            href={item.href}
            className={`rounded-full border px-3 py-1.5 transition ${
              index === items.length - 1
                ? "border-slate-900/10 bg-[#f8f4ec] font-medium text-slate-900"
                : "border-slate-900/10 bg-white text-slate-600 hover:text-primary"
            }`}
          >
            {item.label}
          </Link>
        </div>
      ))}
    </nav>
  );
}

export const generateStaticParams = async () => {
  if (!isFeatureEnabled("appModules", "/docs")) {
    return [];
  }

  return getDocVersionParams();
};

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ collection: string; slug: string[] }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const doc = await getDocVersion(
    resolvedParams.collection,
    resolvedParams.slug,
  );
  if (!doc) return {};

  return {
    title: `${doc.version.title} - ${doc.collection.title} | Documentation`,
    description: doc.version.description,
  };
}

export default async function DocVersionPage({
  params,
}: {
  params: Promise<{ collection: string; slug: string[] }>;
}) {
  if (!isFeatureEnabled("appModules", "/docs")) {
    notFound();
  }

  const resolvedParams = await params;
  const doc = await getDocVersion(
    resolvedParams.collection,
    resolvedParams.slug,
  );
  if (!doc) {
    notFound();
  }

  const { collection, version } = doc;
  const breadcrumbs = [
    { label: "Documentation", href: "/docs" },
    { label: collection.title, href: `/docs/${collection.slug}` },
    { label: version.title, href: `/docs/${collection.slug}/${version.slug}` },
  ];

  return (
    <div className="flex gap-8 xl:gap-10">
      <article className="min-w-0 flex-1 space-y-6">
        <section className="rounded-[2rem] border border-slate-900/10 bg-[linear-gradient(180deg,#ffffff,#faf7f2)] p-6 shadow-[0_20px_48px_rgba(15,23,42,0.05)] lg:p-7">
          <DocsBreadcrumbs items={breadcrumbs} />
          <PublicPageIntro
            eyebrow="Documentation"
            title={version.title}
            subtitle={version.description}
            titleClassName="text-[2.3rem] tracking-[-0.06em] sm:text-[2.9rem]"
          />
        </section>

        <section className="rounded-[2rem] border border-slate-900/10 bg-white/92 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)] lg:p-8">
          <DocArticle content={version.content} />
        </section>

        <Feedback />
      </article>

      <aside className="hidden w-64 shrink-0 lg:block xl:w-72">
        <div className="sticky top-[100px]">
          <div className="rounded-[1.6rem] border border-slate-900/10 bg-white/90 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
            <p className="mb-4 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-text-subtle">
              Metadata
            </p>
            <DocMetaPanel
              description={undefined}
              updatedAt={version.updatedAt}
              tags={version.tags}
            />
          </div>
        </div>
      </aside>
    </div>
  );
}
