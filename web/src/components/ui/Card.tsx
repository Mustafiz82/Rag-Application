import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "rounded-2xl bg-white ring-1 ring-zinc-200 shadow-sm",
        "dark:bg-zinc-950 dark:ring-white/10",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}
