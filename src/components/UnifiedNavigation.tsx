"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../i18n/LanguageProvider";
import { Menu, X, Sun, Moon, Monitor, Plus, BarChart2 } from "lucide-react";
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
              className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
              onClick={() => setMenuOpen(false)}
            />
            <div className="absolute inset-0 bg-background shadow-2xl transition-transform duration-300 ease-in-out">
              <div className="flex h-full flex-col overflow-y-auto">
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-surface-border bg-background px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
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
                    <span className="text-lg font-bold tracking-tight">
                      Cloud-Neutral
                    </span>
                  </Link>
                  <button
                    onClick={() => setMenuOpen(false)}
                    className="rounded-lg p-2 text-text-muted transition-colors hover:bg-surface-muted"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {user && (
                  <div className="border-b border-surface-border bg-surface-muted/30 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-semibold text-white">
                        {accountInitial}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="truncate text-sm font-semibold">
                          {user.username}
                        </p>
                        <p className="truncate text-xs text-text-muted">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex-1 px-4 pb-4 pt-5">
                  <p className="px-2 text-[10px] font-bold uppercase tracking-widest text-text-muted opacity-50 mb-2">
                    {isChinese ? "主导航" : "Main Navigation"}
                  </p>
                  <div className="space-y-1 mb-6">
                    {filteredMainNav.map((item) => {
                      const active = isActive(item);
                      if (item.showOn === "desktop") return null;
                      if (item.key === "chat") {
                        return (
                          <button
                            key={item.key}
                            onClick={() => {
                              toggleOpen();
                              setMenuOpen(false);
                            }}
                            className={`flex w-full items-center px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                              active
                                ? "bg-primary/10 text-primary"
                                : "text-text hover:bg-surface-muted"
                            }`}
                          >
                            {item.icon && (
                              <item.icon className="mr-3 h-5 w-5 opacity-70" />
                            )}
                            <span>{getLabel(item.label, language)}</span>
                          </button>
                        );
                      }
                      return (
                        <Link
                          key={item.key}
                          href={item.href}
                          className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                            active
                              ? "bg-primary/10 text-primary"
                              : "text-text hover:bg-surface-muted"
                          }`}
                          onClick={() => setMenuOpen(false)}
                        >
                          {item.icon && (
                            <item.icon className="mr-3 h-5 w-5 opacity-70" />
                          )}
                          <span>{getLabel(item.label, language)}</span>
                        </Link>
                      );
                    })}
                  </div>

                  {filteredSecondaryNav.length > 0 && (
                    <>
                      <p className="px-2 text-[10px] font-bold uppercase tracking-widest text-text-muted opacity-50 mb-2">
                        {isChinese ? "其他" : "Other"}
                      </p>
                      <div className="space-y-1 mb-6">
                        {filteredSecondaryNav.map((item) => {
                          const active = isActive(item);
                          if (item.showOn === "desktop") return null;
                          return (
                            <Link
                              key={item.key}
                              href={item.href}
                              className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                                active
                                  ? "bg-primary/10 text-primary"
                                  : "text-text hover:bg-surface-muted"
                              }`}
                              onClick={() => setMenuOpen(false)}
                            >
                              {item.icon && (
                                <item.icon className="mr-3 h-5 w-5 opacity-70" />
                              )}
                              <span>{getLabel(item.label, language)}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </>
                  )}

                  <div className="mt-8 space-y-3 px-2">
                    <p className="px-2 text-[10px] font-bold uppercase tracking-widest text-text-muted opacity-50 mb-2">
                      {isChinese ? "账户" : "Account"}
                    </p>
                    {accountNav.map((item) => (
                      <Link
                        key={item.key}
                        href={item.href}
                        className={`flex w-full items-center justify-center rounded-xl py-3 text-sm font-bold transition ${
                          item.key === "logout"
                            ? "bg-rose-500/10 text-rose-600 shadow-sm hover:bg-rose-500/20"
                            : "border border-surface-border bg-surface-muted/50 dark:bg-surface-muted/30 hover:bg-surface-hover"
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

                <div className="border-t border-surface-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))] space-y-4">
                  <div className="flex flex-col gap-3">
                    <p className="px-2 text-[10px] font-bold uppercase tracking-widest text-text-muted opacity-50">
                      {isChinese ? "设置" : "Settings"}
                    </p>
                    <div className="flex items-center justify-between rounded-xl bg-surface-muted/50 p-2">
                      <span className="ml-2 text-xs font-medium text-text-muted">
                        {isChinese ? "界面语言" : "Language"}
                      </span>
                      <LanguageToggle />
                    </div>
                    <div className="flex flex-col gap-2 rounded-xl bg-surface-muted/50 p-2">
                      <span className="ml-2 text-xs font-medium text-text-muted mb-1">
                        {isChinese ? "发布频道" : "Channels"}
                      </span>
                      <ReleaseChannelSelector
                        selected={selectedChannels}
                        onToggle={toggleChannel}
                      />
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
