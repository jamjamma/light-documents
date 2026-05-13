"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

interface MobileNavValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const Ctx = createContext<MobileNavValue | null>(null);

export function MobileNavProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close drawer on navigation
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll while drawer is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return <Ctx.Provider value={{ open, setOpen }}>{children}</Ctx.Provider>;
}

export function useMobileNav(): MobileNavValue {
  const v = useContext(Ctx);
  if (!v) {
    // Fall back silently rather than crash; this only happens if a consumer
    // is rendered outside the provider (it shouldn't be).
    return { open: false, setOpen: () => {} };
  }
  return v;
}
