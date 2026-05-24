import type { ReactNode } from "react";

export function AuthScreen({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-white p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
        <p className="text-sm font-medium text-teal-700">Spend Intelligence</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">{title}</h1>
        <div className="mt-6">{children}</div>
      </div>
    </main>
  );
}

export function AuthSpinner({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-teal-600 border-t-transparent"
        aria-hidden
      />
      <p className="text-sm text-slate-600">{label}</p>
    </div>
  );
}
