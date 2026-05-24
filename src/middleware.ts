import { type NextRequest, NextResponse } from "next/server";
import { isAuthSkipped } from "@/lib/auth-config";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  try {
    if (isAuthSkipped()) {
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
