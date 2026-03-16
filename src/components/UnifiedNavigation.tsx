"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../i18n/LanguageProvider";
import { Menu, X } from "lucide-react";
import { translations } from "../i18n/translations";
import LanguageToggle from "./LanguageToggle";
// import { AskAIButton } from "./AskAIButton";
import ReleaseChannelSelector from "./ReleaseChannelSelector";
import { useUserStore } from "@lib/userStore";
import { useMoltbotStore } from "@lib/moltbotStore";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  createNavConfig,
  filterNavItems,
  type NavItem,
  type ReleaseChannel,
  DEFAULT_CHANNELS,
  RELEASE_CHANNEL_STORAGE_KEY,
  CHANNEL_ORDER,
} from "@lib/navigation";

const getLabel = (
  label: string | ((lang: string) => string),
  lang: string,
): string => {
  return typeof label === "function" ? label(lang) : label;
};

export default function UnifiedNavigation() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedChannels, setSelectedChannels] = useState<ReleaseChannel[]>([
    "stable",
  ]);
  const navRef = useRef<HTMLElement | null>(null);
  const { language } = useLanguage();
  const user = useUserStore((state) => state.user);
  const { setIsOpen, setMode, toggleOpen } = useMoltbotStore();
  const nav = translations[language].nav;
  const accountCopy = nav.account;
  const accountInitial =
    user?.username?.charAt(0)?.toUpperCase() ??
    user?.email?.charAt(0)?.toUpperCase() ??
    "?";
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const isChinese = language === "zh";

  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = window.localStorage.getItem(RELEASE_CHANNEL_STORAGE_KEY);
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored) as unknown;
      if (!Array.isArray(parsed)) return;

      const normalized = CHANNEL_ORDER.filter((channel) =>
        parsed.includes(channel),
      );
      if (normalized.length === 0) return;

      const restored: ReleaseChannel[] = normalized.includes("stable")
        ? normalized
        : [...DEFAULT_CHANNELS, ...normalized];
      setSelectedChannels((current) => {
        if (
          current.length === restored.length &&
          current.every((value, index) => value === restored[index])
        ) {
          return current;
        }
        return restored;
      });
    } catch (error) {
      console.warn("Failed to restore release channels selection", error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      RELEASE_CHANNEL_STORAGE_KEY,
      JSON.stringify(selectedChannels),
    );
  }, [selectedChannels]);

  useEffect(() => {
    if (!accountMenuOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(event.target as Node)
      ) {
        setAccountMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [accountMenuOpen]);

  useEffect(() => {
    setAccountMenuOpen(false);
  }, [user]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    document.body.style.overflow = menuOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const element = navRef.current;
    if (!element) {
      return;
    }

    const updateOffset = () => {
      const height = element.getBoundingClientRect().height;
      document.documentElement.style.setProperty(
        "--app-shell-nav-offset",
        `${height}px`,
      );
    };

    updateOffset();

    const resizeObserver = new ResizeObserver(() => {
      updateOffset();
    });

    resizeObserver.observe(element);
    window.addEventListener("resize", updateOffset);

    return () => {
      window.removeEventListener("resize", updateOffset);
      resizeObserver.disconnect();
    };
  }, []);

  const toggleChannel = (channel: ReleaseChannel) => {
    if (channel === "stable") return;
    setSelectedChannels((prev) =>
      prev.includes(channel)
        ? prev.filter((value) => value !== channel)
        : [...prev, channel],
    );
  };

  const { mainNav, secondaryNav, accountNav } = createNavConfig(
    language,
    !!user,
    !!user?.isAdmin,
    !!user?.isOperator,
  );

  const filteredMainNav = filterNavItems(mainNav, user);
  const filteredSecondaryNav = filterNavItems(secondaryNav, user);
  const mobilePrimaryNav = [...filteredMainNav, ...filteredSecondaryNav].filter(
    (item) => item.showOn !== "desktop",
  );
  const mobileQuickLinks = mobilePrimaryNav.filter((item) =>
    ["chat", "console", "docs", "services"].includes(item.key),
  );

  const isHiddenRoute = pathname
    ? [
        "/login",
        "/register",
        "/xstream",
        "/xcloudflow",
        "/xscopehub",
        "/blogs",
      ].some((prefix) => pathname.startsWith(prefix))
    : false;

  if (isHiddenRoute) {
    return null;
  }

  const isActive = (item: NavItem): boolean => {
    if (item.active) {
      return item.active(pathname || "");
    }
    return pathname === item.href;
  };

  return (
    <>
      <nav
        ref={navRef}
        style={{
          width: "calc(100% + var(--assistant-reserve-offset, 0px))",
          marginRight: "calc(var(--assistant-reserve-offset, 0px) * -1)",
        }}
        className="sticky top-0 z-50 w-full border-b border-surface-border bg-background/95 text-text backdrop-blur transition-colors duration-150"
      >
        <div className="lg:hidden flex items-center justify-between border-b border-surface-border/70 bg-background px-4 py-3">
          <Link
            href="/"
            className="flex items-center gap-2"
            onClick={() => setMenuOpen(false)}
          >
            <Image
              src="/icons/cloudnative_32.png"
              alt="logo"
              width={24}
              height={24}
              className="h-6 w-6"
              unoptimized
            />
            <span className="text-base font-semibold tracking-tight text-text">
              Cloud-Neutral
            </span>
          </Link>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-xl bg-surface-muted p-2 text-text transition-colors hover:bg-surface-hover"
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        <div className="hidden lg:block mx-auto w-full max-w-7xl px-6 sm:px-8">
          <div className="flex items-center gap-5 py-3">
            <div className="flex flex-1 items-center">
              <nav className="hidden items-center gap-1 text-sm font-medium text-text-muted lg:flex whitespace-nowrap -ml-2">
                {filteredMainNav.map((item) => {
                  const active = isActive(item);
                  if (item.showOn === "mobile") return null;
                  if (item.key === "chat") {
                    return (
                      <button
                        key={item.key}
                        onClick={() => {
                          toggleOpen();
                        }}
                        className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                          active
                            ? "bg-primary/10 text-primary"
                            : "text-text-muted hover:text-text hover:bg-surface-muted"
                        }`}
                      >
                        {item.icon && <item.icon className="w-4 h-4" />}
                        <span className="text-[13px] tracking-tight">
                          {getLabel(item.label, language)}
                        </span>
                      </button>
                    );
                  }
                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-text-muted hover:text-text hover:bg-surface-muted"
                      }`}
                    >
                      {item.icon && <item.icon className="w-4 h-4" />}
                      <span className="text-[13px] tracking-tight">
                        {getLabel(item.label, language)}
                      </span>
                    </Link>
                  );
                })}
                {filteredSecondaryNav.map((item) => {
                  const active = isActive(item);
                  if (item.showOn === "mobile") return null;
                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-text-muted hover:text-text hover:bg-surface-muted"
                      }`}
                    >
                      {item.icon && <item.icon className="w-4 h-4" />}
                      <span className="text-[13px] tracking-tight">
                        {getLabel(item.label, language)}
                      </span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="hidden flex-1 items-center justify-end gap-3 lg:flex">
              {user ? (
                <div className="flex items-center gap-3">
                  <LanguageToggle />
                  <ReleaseChannelSelector
                    selected={selectedChannels}
                    onToggle={toggleChannel}
                    variant="icon"
                  />
                  <DropdownMenu.Root
                    open={accountMenuOpen}
                    onOpenChange={setAccountMenuOpen}
                  >
                    <DropdownMenu.Trigger asChild>
                      <button
                        type="button"
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-semibold text-white shadow-shadow-sm transition hover:from-primary-hover hover:to-accent focus:outline-none focus:ring-2 focus:ring-primary/60 focus:ring-offset-2 focus:ring-offset-background outline-none ring-offset-background"
                        aria-label="User account menu"
                      >
                        {accountInitial}
                      </button>
                    </DropdownMenu.Trigger>

                    <DropdownMenu.Portal>
                      <DropdownMenu.Content
                        align="end"
                        sideOffset={8}
                        className="z-50 min-w-[220px] overflow-hidden rounded-[12px] border border-surface-border bg-surface p-1 shadow-shadow-md animate-in fade-in zoom-in-95 duration-[120ms] data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95 motion-reduce:animate-none"
                      >
                        <div className="px-4 py-3 border-b border-surface-border/50 mb-1 text-right">
                          <p className="text-sm font-semibold text-text leading-none mb-1.5">
                            {user.username}
                          </p>
                          <p className="text-[12px] text-text-muted leading-none break-all">
                            {user.email}
                          </p>
                        </div>

                        <div className="space-y-0.5">
                          {accountNav.map((item) => (
                            <DropdownMenu.Item
                              key={item.key}
                              asChild
                              className="outline-none"
                            >
                              <Link
                                href={item.href}
                                className={`flex h-[38px] flex-row-reverse items-center justify-between gap-3 px-3 rounded-lg text-[13px] font-medium transition-all group select-none ${
                                  item.key === "logout"
                                    ? "text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 focus:bg-rose-500/10 focus:text-rose-600"
                                    : "text-text-muted hover:bg-primary/10 hover:text-primary focus:bg-primary/10 focus:text-primary"
                                }`}
                                onClick={() => setAccountMenuOpen(false)}
                              >
                                {item.icon && (
                                  <item.icon
                                    className={`w-4 h-4 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity ${item.key === "logout" ? "text-rose-500" : "text-current"}`}
                                  />
                                )}
                                <span className="flex-1 text-right">
                                  {typeof item.label === "function"
                                    ? item.label(language)
                                    : item.label}
                                </span>
                              </Link>
                            </DropdownMenu.Item>
                          ))}
                        </div>
                      </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Root>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 text-sm font-medium text-text-muted">
                    <Link
                      href="/login"
                      className="text-sm opacity-80 transition hover:text-primary hover:opacity-100"
                    >
                      {nav.account.login}
                    </Link>
                    <span
                      className="h-3 w-px bg-surface-border"
                      aria-hidden="true"
                    />
                    <Link
                      href="/register"
                      className="rounded-md border border-surface-border px-3 py-1 text-primary transition hover:border-primary/40 hover:bg-surface-muted"
                    >
                      {nav.account.register}
                    </Link>
                  </div>
                  <LanguageToggle />
                  <ReleaseChannelSelector
                    selected={selectedChannels}
                    onToggle={toggleChannel}
                    variant="icon"
                  />
                </>
              )}
            </div>
          </div>
        </div>

        {menuOpen && (
          <div className="fixed inset-0 z-[60] lg:hidden">
            <div
              className="absolute inset-0 bg-white/92 backdrop-blur-md transition-opacity"
              onClick={() => setMenuOpen(false)}
            />
            <div className="absolute inset-0 bg-background transition-transform duration-300 ease-in-out">
              <div className="relative flex h-full flex-col overflow-y-auto bg-[radial-gradient(circle_at_bottom_right,rgba(15,23,42,0.06),transparent_32%),linear-gradient(180deg,#ffffff_0%,#fbfbfa_100%)]">
                <div className="sticky top-0 z-10 flex items-center justify-between bg-transparent px-5 pb-4 pt-[max(1rem,env(safe-area-inset-top))]">
                  <Link
                    href="/"
                    className="flex items-center gap-2"
                    onClick={() => setMenuOpen(false)}
                  >
                    <Image
                      src="/icons/cloudnative_32.png"
                      alt="logo"
                      width={24}
                      height={24}
                      className="h-6 w-6"
                      unoptimized
                    />
                    <span className="text-[1.625rem] font-semibold tracking-[-0.04em] text-text">
                      Cloud-Neutral
                    </span>
                  </Link>
                  <div className="flex items-center gap-2">
                    <div className="rounded-full border border-surface-border bg-white/80 px-2 py-1 shadow-sm">
                      <LanguageToggle />
                    </div>
                    <button
                      onClick={() => setMenuOpen(false)}
                      className="rounded-full border border-surface-border bg-white/80 p-2 text-text-muted shadow-sm transition-colors hover:bg-surface-muted"
                      aria-label={isChinese ? "关闭菜单" : "Close menu"}
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 px-6 pb-8 pt-3">
                  {user ? (
                    <div className="mb-6 flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-text text-sm font-semibold text-background">
                        {accountInitial}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-text">
                          {user.username}
                        </p>
                        <p className="truncate text-xs text-text-muted">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  ) : null}

                  <div className="space-y-1.5">
                    {mobilePrimaryNav.map((item) => {
                      const active = isActive(item);
                      if (item.key === "chat") {
                        return (
                          <button
                            key={item.key}
                            onClick={() => {
                              toggleOpen();
                              setMenuOpen(false);
                            }}
                            className={`group flex w-full items-center justify-between rounded-2xl px-1 py-3 text-left transition-colors ${
                              active
                                ? "text-text"
                                : "text-text hover:text-primary"
                            }`}
                          >
                            <span className="text-[2rem] font-semibold tracking-[-0.045em]">
                              {getLabel(item.label, language)}
                            </span>
                            <span
                              className={`text-sm transition-transform ${
                                active
                                  ? "text-primary"
                                  : "text-text-muted group-hover:translate-x-1 group-hover:text-primary"
                              }`}
                            >
                              {isChinese ? "进入" : "Open"}
                            </span>
                          </button>
                        );
                      }
                      return (
                        <Link
                          key={item.key}
                          href={item.href}
                          className={`group flex items-center justify-between rounded-2xl px-1 py-3 transition-colors ${
                            active
                              ? "text-text"
                              : "text-text hover:text-primary"
                          }`}
                          onClick={() => setMenuOpen(false)}
                        >
                          <span className="text-[2rem] font-semibold tracking-[-0.045em]">
                            {getLabel(item.label, language)}
                          </span>
                          <span
                            className={`text-sm transition-transform ${
                              active
                                ? "text-primary"
                                : "text-text-muted group-hover:translate-x-1 group-hover:text-primary"
                            }`}
                          >
                            {isChinese ? "查看" : "View"}
                          </span>
                        </Link>
                      );
                    })}
                  </div>

                  {mobileQuickLinks.length > 0 ? (
                    <div className="pointer-events-none mt-10 flex justify-end">
                      <div className="pointer-events-auto w-[10.5rem] rounded-[1.6rem] bg-slate-100/88 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.08)] backdrop-blur">
                        <p className="mb-3 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-text-muted/70">
                          {isChinese ? "快捷入口" : "Shortcuts"}
                        </p>
                        <div className="space-y-2">
                          {mobileQuickLinks.map((item) =>
                            item.key === "chat" ? (
                              <button
                                key={item.key}
                                onClick={() => {
                                  toggleOpen();
                                  setMenuOpen(false);
                                }}
                                className="block text-left text-[1.05rem] font-medium tracking-[-0.03em] text-text transition hover:text-primary"
                              >
                                {getLabel(item.label, language)}
                              </button>
                            ) : (
                              <Link
                                key={item.key}
                                href={item.href}
                                onClick={() => setMenuOpen(false)}
                                className="block text-[1.05rem] font-medium tracking-[-0.03em] text-text transition hover:text-primary"
                              >
                                {getLabel(item.label, language)}
                              </Link>
                            ),
                          )}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="mt-auto px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
                  <div className="flex items-end justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="mb-3 max-w-[11rem] rounded-full border border-surface-border bg-white/80 px-3 py-2 shadow-sm">
                        <ReleaseChannelSelector
                          selected={selectedChannels}
                          onToggle={toggleChannel}
                          variant="icon"
                        />
                      </div>
                      <div className="flex items-center gap-3 text-xs text-text-muted">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-surface-border bg-white/80 shadow-sm">
                          {accountInitial}
                        </span>
                        <span className="truncate">
                          {user
                            ? user.username || user.email
                            : isChinese
                              ? "访客模式"
                              : "Guest mode"}
                        </span>
                      </div>
                    </div>

                    <div className="flex w-[10.5rem] shrink-0 flex-col gap-2">
                      {accountNav.map((item) => (
                        <Link
                          key={item.key}
                          href={item.href}
                          className={`flex min-h-12 items-center justify-center rounded-full px-4 text-base font-semibold transition ${
                            item.key === "logout"
                              ? "bg-rose-500/8 text-rose-600 hover:bg-rose-500/15"
                              : "bg-slate-100/88 text-text hover:bg-slate-200/88"
                          }`}
                          onClick={() => setMenuOpen(false)}
                        >
                          {typeof item.label === "function"
                            ? item.label(language)
                            : item.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* <div className="hidden lg:block">
        <AskAIButton />
      </div> Removed to merge AI assistant into navbar and sidebar only */}
    </>
  );
}
