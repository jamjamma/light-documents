import type { ReactNode } from "react";
import { ShieldCheck, Users, Coins } from "lucide-react";
import type { Category } from "./template-meta";

/**
 * JSX-only icons for category section headers. Split from template-meta.ts so
 * the data-only metadata stays evaluable by Node scripts without a JSX runtime.
 */
export const CATEGORY_ICON: Record<Category, ReactNode> = {
  "Customer contracts": <ShieldCheck className="h-4 w-4" />,
  People: <Users className="h-4 w-4" />,
  Equity: <Coins className="h-4 w-4" />,
};
