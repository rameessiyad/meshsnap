"use client";

import { useSyncExternalStore } from "react";

import { formatRelativeTime } from "./utils";

// Refresh the text once a minute.
function subscribe(onChange: () => void) {
  const id = window.setInterval(onChange, 60_000);
  return () => window.clearInterval(id);
}

// The server renders an empty string; the browser fills in "2 days ago".
export default function RelativeTime({ iso }: { iso: string }) {
  const text = useSyncExternalStore(
    subscribe,
    () => formatRelativeTime(iso),
    () => "",
  );

  return (
    <time dateTime={iso} suppressHydrationWarning>
      {text}
    </time>
  );
}