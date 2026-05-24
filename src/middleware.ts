import { type NextRequest, NextResponse } from "next/server";
import { isAuthSkipped } from "@/lib/auth-config";
import { updateSession } from "@/lib/supabase/middleware";

const OPEN_PATH_PREFIXES = [
  "/dashboard",
  "/overview",
  "/spend-increases",
  "/overspending",
  "/suppliers",
  "/budget",
  "/risks",
  "/insights",
  "/chat",
  "/import",
  "/upload",
  "/login",
  "/auth",
];

export async function middleware(request: NextRequest) {
  try {
    const path = request.nextUrl.pathname;
    if (
      isAuthSkipped() ||
      OPEN_PATH_PREFIXES.some((prefix) => path.startsWith(prefix))
    ) {
      return NextResponse.next();
    }
    return await updateSession(request);
  } catch (err) {
    console.error("[middleware]", err);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
