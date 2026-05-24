"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteAllSpendData } from "@/lib/spend-data";

export function DeleteDataButton({
  onDeleted,
  className = "",
  compact = false,
}: {
  onDeleted?: () => void;
  className?: string;
  /** Smaller style for nav bars */
  compact?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    if (
      !window.confirm(
        "Delete all spend data? This removes every imported transaction and cannot be undone."
      )
    ) {
      return;
    }

    setBusy(true);
    const { error } = await deleteAllSpendData();
    setBusy(false);

    if (error) {
      window.alert(error);
      return;
    }

    onDeleted?.();
    router.refresh();
  }

  const base = compact
    ? "rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
    : "w-full rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-800 hover:bg-red-100 disabled:opacity-50";

  return (
    <button
      type="button"
      disabled={busy}
      onClick={handleDelete}
      className={`${base} ${className}`.trim()}
    >
      {busy ? "Deleting…" : "Delete data"}
    </button>
  );
}
