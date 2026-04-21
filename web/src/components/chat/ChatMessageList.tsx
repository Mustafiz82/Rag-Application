export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export function ChatMessageList({ messages }: { messages: ChatMessage[] }) {
  return (
    <div className="space-y-4">
      {messages.map((m) =>
        m.role === "user" ? (
          <div className="flex justify-end" key={m.id}>
            <div className="max-w-[78%] rounded-2xl bg-zinc-900 px-4 py-3 text-sm text-white dark:bg-zinc-50 dark:text-zinc-900">
              {m.content}
            </div>
          </div>
        ) : (
          <div className="flex justify-start" key={m.id}>
            <div className="max-w-[78%] rounded-2xl bg-white px-4 py-3 text-sm text-zinc-900 ring-1 ring-zinc-200 dark:bg-zinc-950 dark:text-zinc-50 dark:ring-white/10">
              {m.content}
            </div>
          </div>
        )
      )}
    </div>
  );
}

