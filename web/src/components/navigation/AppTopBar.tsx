"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { Container } from "@/components/ui/Container";
import { NewSessionButton } from "@/components/session/NewSessionButton";
import { IoDocumentTextOutline } from "react-icons/io5";

const ThemeToggle = dynamic(
  () => import("@/components/theme/ThemeToggle").then((m) => m.ThemeToggle),
  { ssr: false }
);

export function AppTopBar({
  active,
}: {
  active?: "chat" | "home";
}) {
  return (
    <div className="border-b border-zinc-200/70 bg-white/70 backdrop-blur dark:border-white/10 dark:bg-zinc-950/40">
      <Container className="py-4">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50"
          >
            <span
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
              aria-hidden="true"
            >
              <IoDocumentTextOutline className="h-[18px] w-[18px]" />
            </span>
            <span>Private PDF Chat</span>
          </Link>

          <div className="flex items-center gap-2">
            <nav className="hidden sm:flex items-center gap-1 text-sm">
              <Link
                href="/chat"
                className={[
                  "rounded-lg px-3 py-2 transition-colors",
                  active === "chat"
                    ? "text-zinc-900 dark:text-zinc-50 bg-zinc-900/5 dark:bg-white/10"
                    : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white",
                ].join(" ")}
              >
                Chat
              </Link>
            </nav>
            {active === "chat" ? <NewSessionButton /> : null}
            <ThemeToggle />
          </div>
        </div>
      </Container>
    </div>
  );
}

