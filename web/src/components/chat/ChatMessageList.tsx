export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function ChatMessageList({
  messages,
  streamStatus,
}: {
  messages: ChatMessage[];
  streamStatus?: string | null;
}) {
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
          } catch {
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
              {m.role === "assistant" ? (
                <div className="prose prose-sm max-w-none dark:prose-invert prose-pre:my-2 prose-pre:overflow-x-auto prose-code:before:content-[''] prose-code:after:content-['']">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code(props) {
                        const { className, children, ...rest } = props;
                        const isInline = !className;
                        if (isInline) {
                          return (
                            <code
                              className="rounded bg-zinc-100 px-1 py-0.5 text-[0.85em] dark:bg-zinc-800"
                              {...rest}
                            >
                              {children}
                            </code>
                          );
                        }
                        return (
                          <code className="block rounded-lg bg-zinc-100 p-3 text-xs dark:bg-zinc-900" {...rest}>
                            {children}
                          </code>
                        );
                      },
                    }}
                  >
                    {displayContent}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="whitespace-pre-wrap">{displayContent}</div>
              )}
            </div>
          </div>
        );
      })}
      {streamStatus ? (
        <div className="flex justify-start">
          <div className="rounded-xl bg-zinc-100 px-3 py-2 text-xs text-zinc-700 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:ring-white/10">
            {streamStatus}
          </div>
        </div>
      ) : null}
    </div>
  );
}