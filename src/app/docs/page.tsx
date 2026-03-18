import { promises as fs } from "fs";
import path from "path";

import matter from "gray-matter";
import { ArrowRight, BookCopy, Files } from "lucide-react";
import Link from "next/link";

import DocArticle from "@/components/doc/DocArticle";
import { PublicPageIntro } from "@/components/public/PublicPageShell";

import { getDocCollections } from "./resources.server";

export default async function DocsHome() {
  try {
    const indexPath = path.join(
      process.cwd(),
      "src",
      "content",
      "doc",
      "index.md",
    );
    const [fileContent, collections] = await Promise.all([
      fs.readFile(indexPath, "utf-8"),
      getDocCollections(),
    ]);
    const { data: frontmatter, content } = matter(fileContent);
    const articleCount = collections.reduce(
      (sum, collection) => sum + collection.versions.length,
      0,
    );

    return (
      <div className="space-y-8">
        <section className="rounded-[2.2rem] border border-slate-900/10 bg-[linear-gradient(180deg,#ffffff,#faf7f2)] p-6 shadow-[0_22px_50px_rgba(15,23,42,0.05)] lg:p-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
            <PublicPageIntro
              eyebrow="Documentation"
              title={frontmatter.title || "Documentation"}
              subtitle={
                frontmatter.description ||
                "Unified references for Cloud-Neutral Toolkit services."
              }
              titleClassName="editorial-display text-[2.8rem] tracking-[-0.06em] sm:text-[3.4rem]"
            />

            <div className="grid gap-3 rounded-[1.75rem] border border-slate-900/10 bg-white/85 p-5">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-text-subtle">
                Library snapshot
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <div className="rounded-[1.25rem] border border-slate-900/10 bg-[#fcfbf8] p-4">
                  <div className="flex items-center gap-2 text-slate-900">
                    <BookCopy className="h-4 w-4 text-primary" aria-hidden />
                    <span className="text-sm font-semibold">Collections</span>
                  </div>
                  <p className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-slate-900">
                    {collections.length}
                  </p>
                </div>
                <div className="rounded-[1.25rem] border border-slate-900/10 bg-[#fcfbf8] p-4">
                  <div className="flex items-center gap-2 text-slate-900">
                    <Files className="h-4 w-4 text-primary" aria-hidden />
                    <span className="text-sm font-semibold">Articles</span>
                  </div>
                  <p className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-slate-900">
                    {articleCount}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {collections.length > 0 ? (
          <section className="rounded-[2rem] border border-slate-900/10 bg-white/90 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.05)] lg:p-7">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-text-subtle">
                  Browse collections
                </p>
                <p className="mt-2 text-sm leading-6 text-text-muted">
                  Documentation sections now use the same card language as the
                  rest of the public site.
                </p>
              </div>
              <span className="inline-flex w-fit rounded-full border border-slate-900/10 bg-[#f8f4ec] px-3 py-1 text-xs font-semibold text-slate-700">
                {collections.length} collections
              </span>
            </div>

            <div className="grid gap-3 xl:grid-cols-2">
              {collections.map((collection) => (
                <Link
                  key={collection.slug}
                  href={`/docs/${collection.slug}/${collection.defaultVersionSlug}`}
                  className="group rounded-[1.5rem] border border-slate-900/10 bg-[#fcfbf8] p-4 transition duration-200 hover:-translate-y-[1px] hover:bg-white"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <h2 className="text-[1.05rem] font-semibold leading-7 tracking-[-0.03em] text-slate-900">
                        {collection.title}
                      </h2>
                      <p className="text-sm leading-6 text-slate-600">
                        {collection.description}
                      </p>
                    </div>
                    <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-400 transition group-hover:text-primary" />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full border border-slate-900/10 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                      {collection.versions.length} articles
                    </span>
                    {collection.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-slate-900/10 bg-white px-3 py-1 text-xs font-medium text-slate-500"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section className="rounded-[2rem] border border-slate-900/10 bg-white/92 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)] lg:p-8">
          <div className="mb-5 border-b border-slate-900/10 pb-4">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-text-subtle">
              Overview
            </p>
          </div>
          <DocArticle content={content} />
        </section>
      </div>
    );
  } catch (error) {
    console.error("Failed to load docs index:", error);

    return (
      <div className="rounded-[2rem] border border-dashed border-slate-900/12 bg-white/80 p-8 text-center shadow-[0_18px_40px_rgba(15,23,42,0.04)]">
        <h3 className="text-xl font-semibold tracking-[-0.03em] text-heading">
          No Documentation Found
        </h3>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-text-muted">
          We could not find any documentation files. Please ensure content is
          synced to <code>src/content/doc</code>.
        </p>
      </div>
    );
  }
}
