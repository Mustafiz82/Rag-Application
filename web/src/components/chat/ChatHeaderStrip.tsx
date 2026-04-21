import { Button } from "@/components/ui/Button";
import { IoDocumentTextOutline, IoSwapHorizontalOutline } from "react-icons/io5";

export function ChatHeaderStrip({
  fileName,
  onChangePdf,
}: {
  fileName: string;
  onChangePdf: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white/60 px-4 py-3 dark:border-white/10 dark:bg-white/5">
      <div className="flex min-w-0 items-center gap-2">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900">
          <IoDocumentTextOutline className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {fileName}
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-500">Ready (UI only)</div>
        </div>
      </div>

      <Button variant="secondary" size="sm" onClick={onChangePdf}>
        <IoSwapHorizontalOutline className="h-4 w-4" />
        Change PDF
      </Button>
    </div>
  );
}

