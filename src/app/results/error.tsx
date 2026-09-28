"use client";

import { ScopeError } from "@/components/scope/ScopeError";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ScopeError kind="results" reset={reset} />;
}
