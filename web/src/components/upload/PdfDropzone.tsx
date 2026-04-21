import type { ReactNode } from "react";
import { IoCloudUploadOutline } from "react-icons/io5";

export function PdfDropzone({
  title = "Drop your PDF here",
  subtitle = "or click to browse files",
  hint = "PDF only • up to 25MB",
  right,
  onFileSelected,
}: {
  title?: string;
  subtitle?: string;
  hint?: string;
  right?: ReactNode;
  onFileSelected?: (file: File) => void;
}) {
  return (
    <div className="group relative">
      <label className="block">
        <span className="sr-only">Choose a PDF to upload</span>
        <div
          className={[
            "relative rounded-2xl border border-dashed border-zinc-300 bg-white/70 p-6",
            "transition-colors group-hover:border-zinc-400",
            "dark:border-white/15 dark:bg-white/5 dark:group-hover:border-white/25",
          ].join(" ")}
        >
          <input
            type="file"
            accept="application/pdf"
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              onFileSelected?.(file);
              e.currentTarget.value = "";
            }}
          />

          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-4">
              <div
                className={[
                  "mt-0.5 flex h-11 w-11 items-center justify-center rounded-xl",
                  "bg-zinc-900 text-white",
                  "dark:bg-zinc-50 dark:text-zinc-900",
                ].join(" ")}
                aria-hidden="true"
              >
                <IoCloudUploadOutline className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {title}
                </div>
                <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {subtitle}
                </div>
                <div className="mt-3 text-xs text-zinc-500 dark:text-zinc-500">
                  {hint}
                </div>
              </div>
            </div>

            {right ? <div className="shrink-0">{right}</div> : null}
          </div>

          <div
            className={[
              "pointer-events-none absolute inset-0 rounded-2xl",
              "ring-1 ring-transparent group-focus-within:ring-zinc-900/15 dark:group-focus-within:ring-white/15",
            ].join(" ")}
          />
        </div>
      </label>
    </div>
  );
}

