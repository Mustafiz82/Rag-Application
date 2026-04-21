"use client";

import { Button } from "@/components/ui/Button";
import { IoAddOutline } from "react-icons/io5";

function nextSessionId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

export function NewSessionButton() {
  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={() => {
        const id = nextSessionId();
        window.localStorage.setItem("sessionId", id);
        window.dispatchEvent(new CustomEvent("session:new", { detail: { sessionId: id } }));
      }}
    >
      <IoAddOutline className="h-4 w-4" />
      New session
    </Button>
  );
}

