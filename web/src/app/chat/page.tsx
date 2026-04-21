import { AppTopBar } from "@/components/navigation/AppTopBar";
import { Container } from "@/components/ui/Container";
import { ChatScreen } from "@/components/chat/ChatScreen";

export default function ChatPage() {
  return (
    <div className="min-h-full bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50">
      <AppTopBar active="chat" />

      <Container>
        <ChatScreen />
      </Container>
    </div>
  );
}

