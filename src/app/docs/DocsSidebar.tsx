"use client";

import { usePathname } from "next/navigation";
import type { DocCollection } from "./types";
import { SidebarRoot } from "../../components/layout/SidebarRoot";
import { DocsSidebarContent } from "./DocsSidebarContent";

interface DocsSidebarProps {
  collections: DocCollection[];
}

export default function DocsSidebar({ collections }: DocsSidebarProps) {
  const pathname = usePathname();

  return (
    <SidebarRoot className="sticky top-[calc(var(--app-shell-nav-offset)+0.75rem)] hidden h-[calc(100vh-var(--app-shell-nav-offset)-1rem)] w-72 shrink-0 rounded-[14px] border border-surface-border/80 bg-white/78 px-4 py-5 shadow-[var(--shadow-soft)] backdrop-blur lg:block">
      <DocsSidebarContent collections={collections} activePath={pathname} />
    </SidebarRoot>
  );
}
