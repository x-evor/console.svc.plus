"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useSearchParams } from "next/navigation";

import BrandCTA from "@components/BrandCTA";
import { PublicPageIntro } from "@/components/public/PublicPageShell";
import SearchComponent from "@components/search";
import { useLanguage } from "@i18n/LanguageProvider";
import type { BlogCategory, BlogPostSummary } from "@lib/blogContent";

function formatDate(
  dateStr: string | undefined,
  language: "zh" | "en",
): string {
  if (!dateStr) return "";

  const date = new Date(dateStr);

  if (language === "zh") {
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

interface BlogListProps {
  posts: BlogPostSummary[];
  categories: BlogCategory[];
}

function buildCategoryCounts(posts: BlogPostSummary[]) {
  return posts.reduce<Record<string, number>>((acc, post) => {
    const categoryKey = post.category?.key;
    if (!categoryKey) return acc;
    acc[categoryKey] = (acc[categoryKey] || 0) + 1;
    return acc;
  }, {});
}

export default function BlogList({ posts, categories }: BlogListProps) {
  const { language } = useLanguage();
  const isChinese = language === "zh";
  const searchParams = useSearchParams();
  const selectedCategory = searchParams.get("category");
  const page = searchParams.get("page");

  const categoryTabs = useMemo(() => {
    const categoriesFromPosts = posts
      .map((post) => post.category)
      .filter(
        (category): category is NonNullable<BlogPostSummary["category"]> =>
          Boolean(category),
      )
      .map((category) => ({
        key: category.key,
        label: category.label ?? category.key,
      }));

    return [...categories, ...categoriesFromPosts].filter(
      (category, index, self) =>
        self.findIndex((item) => item.key === category.key) === index,
    );
  }, [categories, posts]);

  const categoryCounts = useMemo(() => buildCategoryCounts(posts), [posts]);
  const filteredPosts = useMemo(() => {
    if (!selectedCategory) return posts;
    return posts.filter((post) => post.category?.key === selectedCategory);
  }, [posts, selectedCategory]);

  const postsPerPage = 10;
  const currentPage = useMemo(() => {
    const parsed = Number(page || "1");
    if (!Number.isFinite(parsed) || parsed < 1) return 1;
    const totalPages = Math.max(
      1,
      Math.ceil(filteredPosts.length / postsPerPage),
    );
    return Math.min(parsed, totalPages);
  }, [page, filteredPosts.length]);
  const totalPages = Math.max(
    1,
    Math.ceil(filteredPosts.length / postsPerPage),
  );
  const startIndex = (currentPage - 1) * postsPerPage;
  const endIndex = startIndex + postsPerPage;
  const paginatedPosts = filteredPosts.slice(startIndex, endIndex);

  return (
    <div className="space-y-8">
      <section className="rounded-[2.4rem] border border-slate-900/10 bg-[linear-gradient(180deg,#ffffff,#faf7f2)] p-6 shadow-[0_22px_50px_rgba(15,23,42,0.05)] sm:p-8 lg:p-10">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-end">
          <PublicPageIntro
            eyebrow={isChinese ? "博客与动态" : "Editorial notes"}
            title={
              isChinese ? "产品日志与架构随笔" : "Product Notes & Field Updates"
            }
            subtitle={
              isChinese
                ? "把产品更新、发布日志和架构观察收进同一套公开页阅读语法。"
                : "A calmer feed for releases, essays, and field notes across the Cloud-Neutral stack."
            }
            titleClassName={
              isChinese
                ? "text-[2.7rem] tracking-[-0.08em] sm:text-[3.4rem]"
                : "editorial-display text-[2.9rem] tracking-[-0.06em] sm:text-[3.6rem]"
            }
          />

          <div className="rounded-[1.75rem] border border-slate-900/10 bg-white/85 p-5">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-text-subtle">
              {isChinese ? "搜索文章" : "Search notes"}
            </p>
            <div className="mt-4">
              <SearchComponent
                className="max-w-none"
                inputClassName="w-full rounded-full border border-slate-900/10 bg-[#fcfbf8] py-3 pl-5 pr-12 text-sm text-slate-700 shadow-none focus:border-slate-900/15 focus:bg-white focus:ring-2 focus:ring-primary/15"
                buttonClassName="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-slate-950 text-white transition hover:bg-primary"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-900/10 bg-white/92 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/blogs"
            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
              !selectedCategory
                ? "border-slate-900/10 bg-slate-950 text-white"
                : "border-slate-900/10 bg-white text-slate-700 hover:border-slate-900/15 hover:bg-[#fcfbf8]"
            }`}
          >
            {isChinese ? "全部" : "All"}
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                !selectedCategory
                  ? "bg-white/20 text-white"
                  : "bg-[#f8f4ec] text-slate-700"
              }`}
            >
              {posts.length}
            </span>
          </Link>
          {categoryTabs.map((tab) => {
            const isActive = tab.key === selectedCategory;
            const labelWithCount = categoryCounts[tab.key];
            return (
              <Link
                key={tab.key}
                href={`/blogs${isActive ? "" : `?category=${tab.key}`}`}
                className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  isActive
                    ? "border-slate-900/10 bg-slate-950 text-white"
                    : "border-slate-900/10 bg-white text-slate-700 hover:border-slate-900/15 hover:bg-[#fcfbf8]"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <span>{tab.label}</span>
                {labelWithCount ? (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-[#f8f4ec] text-slate-700"
                    }`}
                  >
                    {labelWithCount}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      </section>

      {filteredPosts.length === 0 ? (
        <div className="rounded-[1.8rem] border border-dashed border-slate-900/12 bg-white/80 py-20 text-center text-sm text-slate-500">
          {isChinese ? "暂无博客文章" : "No posts found."}
        </div>
      ) : (
        <div className="grid gap-4">
          {paginatedPosts.map((post) => (
            <article
              key={post.slug}
              className="rounded-[1.9rem] border border-slate-900/10 bg-white/92 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)] transition duration-200 hover:-translate-y-[1px] hover:bg-white"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="rounded-full border border-slate-900/10 bg-[#f8f4ec] px-3 py-1 text-xs font-semibold text-slate-600">
                  {post.category?.label ?? "Blog"}
                </span>
                {post.date ? (
                  <time className="text-sm text-slate-500">
                    {formatDate(post.date, language)}
                  </time>
                ) : null}
              </div>

              <div className="mt-5 space-y-3">
                <h2 className="text-[1.65rem] font-semibold leading-[1.05] tracking-[-0.04em] text-slate-900">
                  {post.title}
                </h2>
                {post.author ? (
                  <p className="text-sm text-slate-500">
                    {isChinese ? "作者" : "By"} {post.author}
                  </p>
                ) : null}
                <p className="max-w-3xl text-sm leading-7 text-slate-600">
                  {post.excerpt}
                </p>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                {post.tags && post.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-slate-900/10 bg-[#fcfbf8] px-3 py-1 text-xs font-medium text-slate-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
                <Link
                  href={`/blogs/${post.slug}`}
                  className="ml-auto inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:text-primary-hover"
                >
                  {isChinese ? "继续阅读" : "Read more"}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <nav className="flex flex-wrap items-center justify-center gap-2">
          <Link
            href={`/blogs?page=${Math.max(1, currentPage - 1)}${selectedCategory ? `&category=${selectedCategory}` : ""}`}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
              currentPage === 1
                ? "pointer-events-none border-slate-900/8 bg-white text-slate-300"
                : "border-slate-900/10 bg-white text-slate-700 hover:border-slate-900/15 hover:bg-[#fcfbf8]"
            }`}
            aria-disabled={currentPage === 1}
          >
            {isChinese ? "上一页" : "Previous"}
          </Link>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map(
            (pageNumber) => (
              <Link
                key={pageNumber}
                href={`/blogs?page=${pageNumber}${selectedCategory ? `&category=${selectedCategory}` : ""}`}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  pageNumber === currentPage
                    ? "border-slate-900/10 bg-slate-950 text-white"
                    : "border-slate-900/10 bg-white text-slate-700 hover:border-slate-900/15 hover:bg-[#fcfbf8]"
                }`}
              >
                {pageNumber}
              </Link>
            ),
          )}

          <Link
            href={`/blogs?page=${Math.min(totalPages, currentPage + 1)}${selectedCategory ? `&category=${selectedCategory}` : ""}`}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
              currentPage === totalPages
                ? "pointer-events-none border-slate-900/8 bg-white text-slate-300"
                : "border-slate-900/10 bg-white text-slate-700 hover:border-slate-900/15 hover:bg-[#fcfbf8]"
            }`}
            aria-disabled={currentPage === totalPages}
          >
            {isChinese ? "下一页" : "Next"}
          </Link>
        </nav>
      ) : null}

      <BrandCTA lang={language} variant="compact" />
    </div>
  );
}
