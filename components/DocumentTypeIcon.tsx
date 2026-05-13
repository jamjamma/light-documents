import type { ReactNode } from "react";
import type { DocumentType } from "@/lib/types";
import { ShieldCheck, FileSignature, FileText, Users, Coins } from "lucide-react";

interface TypeMeta {
  icon: ReactNode;
  bg: string;
  text: string;
  ring: string;
  label: string;
}

const TYPE_META: Record<DocumentType, TypeMeta> = {
  NDA: {
    icon: <ShieldCheck className="h-3.5 w-3.5" />,
    bg: "bg-ink-100",
    text: "text-ink-700",
    ring: "ring-ink-200",
    label: "NDA",
  },
  MSA: {
    icon: <FileSignature className="h-3.5 w-3.5" />,
    bg: "bg-blue-50",
    text: "text-blue-700",
    ring: "ring-blue-200",
    label: "MSA",
  },
  "Order Form": {
    icon: <FileText className="h-3.5 w-3.5" />,
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    ring: "ring-indigo-200",
    label: "Order Form",
  },
  Employment: {
    icon: <Users className="h-3.5 w-3.5" />,
    bg: "bg-teal-50",
    text: "text-teal-700",
    ring: "ring-teal-200",
    label: "Employment",
  },
  Warrant: {
    icon: <Coins className="h-3.5 w-3.5" />,
    bg: "bg-accent-50",
    text: "text-accent-700",
    ring: "ring-accent-200",
    label: "Warrant",
  },
};

export function DocumentTypeIcon({ type, size = "md" }: { type: DocumentType; size?: "sm" | "md" }) {
  const meta = TYPE_META[type];
  const sz = size === "sm" ? "h-6 w-6" : "h-7 w-7";
  return (
    <div className={`flex ${sz} shrink-0 items-center justify-center rounded-lg ${meta.bg} ${meta.text}`} title={meta.label}>
      {meta.icon}
    </div>
  );
}

export function DocumentTypeBadge({ type }: { type: DocumentType }) {
  const meta = TYPE_META[type];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-inset ${meta.bg} ${meta.text} ${meta.ring}`}
    >
      {meta.icon}
      {meta.label}
    </span>
  );
}

export const DOCUMENT_TYPE_META = TYPE_META;
