import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { DemoBanner } from "@/components/DemoBanner";
import { MobileNavProvider } from "@/components/MobileNavContext";
import { MobileTopBar } from "@/components/MobileTopBar";

export const metadata: Metadata = {
  title: "Light Documents",
  description: "Controlled document execution for Light. Wraps DocuSign, integrates with the ledger.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-ink-50/60 antialiased">
        <MobileNavProvider>
          <DemoBanner />
          <MobileTopBar />
          <div className="flex">
            <Sidebar />
            <main className="min-h-[calc(100vh-32px)] min-w-0 flex-1">{children}</main>
          </div>
        </MobileNavProvider>
      </body>
    </html>
  );
}
