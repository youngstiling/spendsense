import { type NextRequest, NextResponse } from "next/server";
import { isDemoMode } from "@/lib/demo";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  try {
    if (isDemoMode()) {
      const path = request.nextUrl.pathname;
      if (path === "/" || path === "/login") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
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
