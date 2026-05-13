"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "./ui/Button";
import { ArrowLeft } from "lucide-react";

interface Props {
  /** Optional fallback href if there's no history to pop. Defaults to "/". */
  fallback?: string;
  label?: string;
}

/**
 * History-aware back button. Uses router.back() when possible so users land on
 * the actual previous page (e.g. Templates → New Contract → Contract Detail
 * pops back to New Contract, not Dashboard). Falls back to a normal link when
 * the user opened the page directly (referrer === current page).
 */
export function BackButton({ fallback = "/", label = "Back" }: Props) {
  const router = useRouter();

  const handleClick = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallback);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      leadingIcon={<ArrowLeft className="h-3.5 w-3.5" />}
      onClick={handleClick}
    >
      {label}
    </Button>
  );
}

/**
 * Static-href fallback for cases where history-awareness is undesirable.
 * Renders as a normal Link so it works without JS.
 */
export function BackLink({ href = "/", label = "Back" }: { href?: string; label?: string }) {
  return (
    <Link href={href}>
      <Button variant="ghost" size="sm" leadingIcon={<ArrowLeft className="h-3.5 w-3.5" />}>
        {label}
      </Button>
    </Link>
  );
}
