"use client";

import { StateCard } from "@/components/ui/StateCard";

export default function ProtectedError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <StateCard
      action={
        <button
          className="inline-flex h-11 items-center justify-center rounded-pill border border-border-subtle bg-surface-elevated px-5 text-sm font-semibold text-text-primary transition-colors duration-200 hover:bg-surface-active"
          onClick={() => reset()}
          type="button"
        >
          Try again
        </button>
      }
      description="Try again in a moment. Your private tournament view should be back under the lights shortly."
      eyebrow="Protected view offline"
      title="Couldn't load this screen."
      tone="error"
    />
  );
}
