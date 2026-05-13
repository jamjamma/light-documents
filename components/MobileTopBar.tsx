"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { useMobileNav } from "./MobileNavContext";

/**
 * Sticky top bar on mobile only. Hosts the drawer hamburger so it has a clear
 * anchor (top of the viewport) rather than floating loose over scrolled content.
 *
 * Sits below the DemoBanner in normal flow; once the user scrolls past the
 * banner it sticks to the top of the viewport.
 */
export function MobileTopBar() {
  const { setOpen } = useMobileNav();
  return (
    <div className="sticky top-0 z-30 flex h-12 items-center gap-3 border-b border-ink-100 bg-white/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-white/80 md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-ink-200 bg-white text-ink-700 hover:bg-ink-50"
      >
        <Menu className="h-4 w-4" />
      </button>
      <Link href="/" className="flex min-w-0 items-center gap-2">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-ink-900">
          <span className="text-[11px] font-bold text-accent-300">L</span>
        </div>
        <div className="truncate text-sm font-semibold text-ink-900">Light Documents</div>
      </Link>
    </div>
  );
}
