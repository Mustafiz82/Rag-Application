import type { ReactNode } from "react";

export function CardBody({ children }: { children: ReactNode }) {
  return <div className="px-6 pb-6 pt-5">{children}</div>;
}

