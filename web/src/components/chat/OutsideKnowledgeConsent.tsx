"use client";

import { Button } from "@/components/ui/Button";

export function OutsideKnowledgeConsent({
  onAllow,
  onDecline,
  isBusy,
}: {
  onAllow: () => void;
  onDecline: () => void;
  isBusy?: boolean;
}) {
  return (
    <div className="mt-3 rounded-2xl border border-zinc-200 bg-white/60 p-4 text-sm text-zinc-800 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200">
      <div className="font-medium text-zinc-900 dark:text-zinc-50">
        I can’t find this in your PDF.
      </div>
      <div className="mt-1 text-zinc-600 dark:text-zinc-400">
        Do you want me to answer using outside knowledge (not from your PDF)? I can
        remember your choice for this session.
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button onClick={onAllow} disabled={isBusy}>
          Allow outside knowledge (session)
        </Button>
        <Button variant="secondary" onClick={onDecline} disabled={isBusy}>
          No, PDF only
        </Button>
      </div>
    </div>
  );
}

