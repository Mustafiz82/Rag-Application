import { PdfDropzone } from "@/components/upload/PdfDropzone";
import { IoShieldCheckmarkOutline, IoTimeOutline, IoKeyOutline } from "react-icons/io5";

export function ChatPreUpload({ onPick }: { onPick: (file: File) => void }) {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Chat with a PDF
        </h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          Upload a document to start. Your session will be isolated and data will
          auto-expire in production.
        </p>
      </div>

      <div className="mt-8">
        <PdfDropzone
          title="Upload a PDF to begin"
          subtitle="Click to choose a file (dummy only for now)"
          hint="PDF only • up to 25MB • session-scoped"
          onFileSelected={onPick}
        />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            <IoKeyOutline className="h-4 w-4" />
            No login
          </div>
          <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Session-based access only.
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            <IoTimeOutline className="h-4 w-4" />
            Auto-purge
          </div>
          <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Data expires after inactivity.
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            <IoShieldCheckmarkOutline className="h-4 w-4" />
            Private
          </div>
          <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Queries are filtered by session ID.
          </div>
        </div>
      </div>
    </div>
  );
}

