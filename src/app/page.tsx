import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
        Spend Intelligence
      </h1>
      <p className="mt-4 max-w-md text-slate-500">
        Sign in to view your spend totals and transaction count.
      </p>
      <Link
        href="/login"
        className="mt-8 rounded-md bg-teal-600 px-8 py-3 text-sm font-semibold text-white shadow-sm hover:bg-teal-700"
      >
        Login
      </Link>
    </main>
  );
}
