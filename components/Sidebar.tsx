"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  Info,
  RefreshCw,
  Archive,
  X,
  ChevronsLeft,
  ChevronsRight,
  Play,
} from "lucide-react";
import { useEffect, useState } from "react";
import { resetDemo } from "@/lib/contract-store";
import { useMobileNav } from "./MobileNavContext";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/templates", label: "Templates", icon: BookOpen },
  { href: "/archive", label: "Signed contracts", icon: Archive },
  { href: "/about", label: "About this build", icon: Info },
];

const COLLAPSED_KEY = "sidebar-collapsed";

/**
 * Responsive sidebar:
 *   - Mobile (< md): hidden by default. Slides in from the left when the
 *     MobileTopBar hamburger toggles `useMobileNav().open`. Tapping the
 *     backdrop or a nav link closes it.
 *   - Desktop (>= md): static sidebar with collapse-to-icons toggle. Collapsed
 *     state persists in localStorage. Nav items show tooltips via title attr
 *     when collapsed.
 *
 * Drawer state lives in MobileNavContext so the hamburger can live in a
 * separate sticky top bar (not floating over content).
 */
export function Sidebar() {
  const pathname = usePathname();
  const [resetState, setResetState] = useState<"idle" | "done">("idle");
  const { open: mobileOpen, setOpen: setMobileOpen } = useMobileNav();
  const [collapsed, setCollapsed] = useState(false);

  // Hydrate collapsed state from localStorage on mount.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(COLLAPSED_KEY);
      if (saved === "true") setCollapsed(true);
    } catch {
      // localStorage unavailable; ignore
    }
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      const next = !c;
      try {
        window.localStorage.setItem(COLLAPSED_KEY, next ? "true" : "false");
      } catch {
        // ignore
      }
      return next;
    });
  };

  const onReset = () => {
    resetDemo();
    setResetState("done");
    setTimeout(() => {
      window.location.href = "/";
    }, 300);
  };

  return (
    <>
      {/* Mobile backdrop. The hamburger that opens the drawer lives in
          <MobileTopBar />, rendered by the layout. */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-ink-950/40 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={clsx(
          "flex shrink-0 flex-col border-r border-ink-100 bg-white transition-[width,transform] duration-200",
          // Mobile: fixed drawer that slides in from the left
          "fixed inset-y-0 left-0 z-50 w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          // Desktop: static positioning + collapse-to-icons
          "md:static md:translate-x-0 md:h-screen",
          collapsed ? "md:w-16" : "md:w-60",
        )}
      >
        <div
          className={clsx(
            "flex items-center px-3 py-5",
            collapsed
              ? "md:flex-col md:gap-3 md:px-2 md:py-4"
              : "justify-between gap-2 md:px-5",
          )}
        >
          <Link
            href="/"
            className={clsx(
              "flex min-w-0 items-center gap-2",
              collapsed && "md:justify-center md:gap-0",
            )}
            title={collapsed ? "Light Documents" : undefined}
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-ink-900">
              <span className="text-[13px] font-bold text-accent-300">L</span>
            </div>
            <div
              className={clsx(
                "min-w-0 truncate text-sm font-semibold text-ink-900",
                collapsed && "md:hidden",
              )}
            >
              Light Documents
            </div>
          </Link>

          {/* Mobile close button */}
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-ink-500 hover:bg-ink-100 md:hidden"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Desktop collapse toggle — sibling of logo, stacks below when collapsed */}
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-md text-ink-500 hover:bg-ink-100 md:inline-flex"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          </button>
        </div>

        <nav className={clsx("flex-1", collapsed ? "md:px-1.5" : "px-3")}>
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                className={clsx(
                  "mb-0.5 flex items-center gap-2.5 rounded-lg text-sm transition-colors",
                  collapsed ? "md:justify-center md:px-2 md:py-2.5" : "px-3 py-2",
                  active ? "bg-ink-900 text-white" : "text-ink-700 hover:bg-ink-100",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className={clsx("truncate", collapsed && "md:hidden")}>{label}</span>
              </Link>
            );
          })}

          <div className={clsx("my-4 border-t border-ink-100", collapsed && "md:mx-1")} />

          <Link
            href="/contracts/new"
            title={collapsed ? "New contract" : undefined}
            className={clsx(
              "mb-0.5 flex items-center gap-2.5 rounded-lg border border-ink-200 text-sm font-medium text-ink-900 hover:bg-ink-50",
              collapsed ? "md:justify-center md:px-2 md:py-2.5" : "px-3 py-2",
            )}
          >
            <FileText className="h-4 w-4 shrink-0" />
            <span className={clsx("truncate", collapsed && "md:hidden")}>New contract</span>
          </Link>
        </nav>

        <div className={clsx("border-t border-ink-100", collapsed ? "md:px-1.5 md:py-3" : "px-3 py-3")}>
          <div
            className={clsx(
              "mb-2 flex items-center rounded-lg bg-ink-50",
              collapsed ? "md:justify-center md:p-1.5" : "gap-2 px-2.5 py-2",
            )}
            title={collapsed ? "Martina Holst · Head of Finance & Ops" : undefined}
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-100 text-[11px] font-semibold text-accent-700">
              MH
            </div>
            <div className={clsx("min-w-0 flex-1", collapsed && "md:hidden")}>
              <div className="truncate text-[12px] font-medium text-ink-900">Martina Holst</div>
              <div className="truncate text-[10px] text-ink-500">Head of Finance & Ops</div>
            </div>
          </div>

          {!collapsed && (
            <div className="mb-2 px-2 text-[10px] leading-snug text-ink-500 md:[&]:block">
              Demo: simulating a Martina session. Production uses Google Workspace SSO so each user sees their own queue.
            </div>
          )}

          <button
            onClick={() => {
              if (typeof window !== "undefined" && window.innerWidth < 768) {
                alert(
                  "The guided tour is desktop-first. Open on a wider screen, or click into Bolt MSA from the dashboard to walk the demo manually.",
                );
                return;
              }
              import("@/lib/tour-steps").then(({ writeTourState, setTourDismissed }) => {
                setTourDismissed(false);
                writeTourState({ active: true, stepIndex: 0 });
                window.dispatchEvent(new CustomEvent("tour:start"));
              });
            }}
            title={collapsed ? "Take the tour" : "Take a guided tour of the build (~90s)"}
            className={clsx(
              "flex w-full items-center gap-2.5 rounded-lg text-xs text-ink-700 hover:bg-ink-50",
              collapsed ? "md:justify-center md:px-2 md:py-2" : "px-3 py-2",
            )}
          >
            <Play className="h-3.5 w-3.5 shrink-0" />
            <span className={clsx(collapsed && "md:hidden")}>Take the tour</span>
          </button>

          <button
            onClick={onReset}
            title={collapsed ? "Reset demo data" : "Clears localStorage and re-seeds the demo data"}
            className={clsx(
              "flex w-full items-center gap-2.5 rounded-lg text-xs text-ink-500 hover:bg-ink-50",
              collapsed ? "md:justify-center md:px-2 md:py-2" : "px-3 py-2",
            )}
          >
            <RefreshCw className="h-3.5 w-3.5 shrink-0" />
            <span className={clsx(collapsed && "md:hidden")}>
              {resetState === "done" ? "Resetting..." : "Reset demo data"}
            </span>
          </button>

          {!collapsed && (
            <div className="mt-2 px-3 text-[11px] leading-relaxed text-ink-400">
              Case study prototype.
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
