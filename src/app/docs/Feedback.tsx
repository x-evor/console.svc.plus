"use client";

import { useState } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";

export default function Feedback() {
  const [voted, setVoted] = useState<"yes" | "no" | null>(null);

  return (
    <section className="rounded-[1.6rem] border border-slate-900/10 bg-[#fcfbf8] p-5 shadow-[0_14px_30px_rgba(15,23,42,0.04)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-text-subtle">
            Feedback
          </p>
          <h3 className="text-lg font-semibold tracking-[-0.03em] text-heading">
            Is this page helpful?
          </h3>
        </div>

        {voted === null ? (
          <div className="flex gap-3">
            <button
              onClick={() => setVoted("yes")}
              className="inline-flex items-center gap-2 rounded-full border border-slate-900/10 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-primary/20 hover:text-primary"
            >
              <ThumbsUp className="h-4 w-4" />
              Yes
            </button>
            <button
              onClick={() => setVoted("no")}
              className="inline-flex items-center gap-2 rounded-full border border-slate-900/10 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-danger/20 hover:text-danger"
            >
              <ThumbsDown className="h-4 w-4" />
              No
            </button>
          </div>
        ) : (
          <p className="text-sm text-text-muted">Thanks for your feedback.</p>
        )}
      </div>
    </section>
  );
}
