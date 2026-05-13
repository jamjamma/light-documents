import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface Crumb {
  label: string;
  href?: string;
}

interface Props {
  items: Crumb[];
}

export function Breadcrumb({ items }: Props) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[12px] text-ink-500">
      {items.map((item, i) => {
        const last = i === items.length - 1;
        return (
          <span key={i} className="inline-flex items-center gap-1.5">
            {item.href && !last ? (
              <Link href={item.href} className="hover:text-ink-900 hover:underline">
                {item.label}
              </Link>
            ) : (
              <span className={last ? "font-medium text-ink-900" : ""}>{item.label}</span>
            )}
            {!last && <ChevronRight className="h-3 w-3 text-ink-300" />}
          </span>
        );
      })}
    </nav>
  );
}
