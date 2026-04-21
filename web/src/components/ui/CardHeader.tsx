import type { ReactNode } from "react";

export function CardHeader({
  title,
  description,
  right,
}: {
  title: ReactNode;
  description?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-6 pt-6">
      <div className="min-w-0">
        <div className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          {title}
        </div>
        {description ? (
          <div className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            {description}
          </div>
        ) : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

