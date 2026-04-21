export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export function ChatMessageList({ messages }: { messages: ChatMessage[] }) {
  return (
    <div className="space-y-4">
      {messages.map((m) => {
        // --- LOGIC TO EXTRACT TEXT FROM JSON STRING ---
        let displayContent = m.content;
        
        if (m.role === "assistant" && m.content.startsWith("{")) {
          try {
            const parsed = JSON.parse(m.content);
            if (parsed.answer) {
              displayContent = parsed.answer;
            }
          } catch (e) {
            // If it's not valid JSON, just show the raw string
            displayContent = m.content;
          }
        }
        // ----------------------------------------------

        return (
          <div className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`} key={m.id}>
            <div
              className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm ${
                m.role === "user"
                  ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                  : "bg-white text-zinc-900 ring-1 ring-zinc-200 dark:bg-zinc-950 dark:text-zinc-50 dark:ring-white/10"
              }`}
            >
              {displayContent}
            </div>
          </div>
        );
      })}
    </div>
  );
}