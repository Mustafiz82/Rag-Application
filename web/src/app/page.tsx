import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CardBody } from "@/components/ui/CardBody";
import { CardHeader } from "@/components/ui/CardHeader";
import { AppTopBar } from "@/components/navigation/AppTopBar";

export default function Home() {
  return (
    <div className="min-h-full bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50">
      <AppTopBar active="home" />

      <Container className="py-12 sm:py-16">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-zinc-700 ring-1 ring-zinc-200 dark:bg-white/5 dark:text-zinc-200 dark:ring-white/10">
              Production-grade RAG • Session-based • Auto-purge
            </div>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Chat with your PDF, privately.
            </h1>
            <p className="max-w-xl text-base leading-7 text-zinc-600 dark:text-zinc-400">
              Upload a PDF, the system vectorizes it, and you can ask questions with
              streaming answers—without accounts and with automatic data expiration.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Link href="/chat">
                <Button>Start chatting</Button>
              </Link>
            </div>
          </div>

          <Card>
            <CardHeader
              title="What happens next"
              description="A quick look at the pipeline (UI only for now)."
            />
            <CardBody>
              <ol className="space-y-3 text-sm text-zinc-700 dark:text-zinc-300">
                <li className="flex gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-white text-xs dark:bg-zinc-50 dark:text-zinc-900">
                    1
                  </span>
                  <div>
                    <div className="font-medium text-zinc-900 dark:text-zinc-50">
                      Upload & parse
                    </div>
                    <div className="mt-0.5 text-zinc-600 dark:text-zinc-400">
                      Extract text from your PDF and delete temp files immediately.
                    </div>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-white text-xs dark:bg-zinc-50 dark:text-zinc-900">
                    2
                  </span>
                  <div>
                    <div className="font-medium text-zinc-900 dark:text-zinc-50">
                      Chunk & embed
                    </div>
                    <div className="mt-0.5 text-zinc-600 dark:text-zinc-400">
                      Split into overlapping chunks and vectorize using embeddings.
                    </div>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-white text-xs dark:bg-zinc-50 dark:text-zinc-900">
                    3
                  </span>
                  <div>
                    <div className="font-medium text-zinc-900 dark:text-zinc-50">
                      Retrieve & stream
                    </div>
                    <div className="mt-0.5 text-zinc-600 dark:text-zinc-400">
                      Vector search per-session, then stream an answer in real time.
                    </div>
                  </div>
                </li>
              </ol>
            </CardBody>
          </Card>
        </div>
      </Container>
    </div>
  );
}
