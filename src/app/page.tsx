"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Always go to dashboard (no auth for now)
    router.replace("/overview");
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <p className="text-slate-600">Loading Spend Intelligence...</p>
    </div>
  );
}
