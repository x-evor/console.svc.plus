"use client";

import React from "react";
import { SidebarRoot } from "../../../components/layout/SidebarRoot";
import {
  PanelSidebarContent,
  PanelSidebarContentProps,
} from "./PanelSidebarContent";

export interface SidebarProps extends PanelSidebarContentProps {
  className?: string;
}

export default function Sidebar({
  className = "",
  onNavigate,
  collapsed = false,
}: SidebarProps) {
  return (
    <SidebarRoot
      className={`transition-all duration-300 ${collapsed ? "w-20" : "w-64"} border-r border-[color:var(--color-surface-border)] bg-white/82 p-4 text-[var(--color-text)] shadow-[var(--shadow-soft)] backdrop-blur ${className}`}
    >
      <PanelSidebarContent onNavigate={onNavigate} collapsed={collapsed} />
    </SidebarRoot>
  );
}
