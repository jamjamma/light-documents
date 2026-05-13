import clsx from "clsx";
import type { ReactNode } from "react";

type Tone = "neutral" | "amber" | "rose" | "sage" | "slate" | "ink";

interface Props {
  tone?: Tone;
  children: ReactNode;
  className?: string;
  leadingDot?: boolean;
}

const toneClass: Record<Tone, string> = {
  neutral: "bg-ink-100 text-ink-700",
  amber: "bg-accent-50 text-accent-700 ring-1 ring-inset ring-accent-200",
  rose: "bg-rose-50 text-rose-500 ring-1 ring-inset ring-rose-500/20",
  sage: "bg-sage-50 text-sage-500 ring-1 ring-inset ring-sage-500/20",
  slate: "bg-ink-50 text-ink-600 ring-1 ring-inset ring-ink-200",
  ink: "bg-ink-900 text-white",
};

const dotClass: Record<Tone, string> = {
  neutral: "bg-ink-400",
  amber: "bg-accent-500",
  rose: "bg-rose-500",
  sage: "bg-sage-500",
  slate: "bg-ink-400",
  ink: "bg-white",
};

export function Badge({ tone = "neutral", children, className, leadingDot }: Props) {
  return (
    <span className={clsx("pill", toneClass[tone], className)}>
      {leadingDot && <span className={clsx("h-1.5 w-1.5 rounded-full", dotClass[tone])} />}
      {children}
    </span>
  );
}
