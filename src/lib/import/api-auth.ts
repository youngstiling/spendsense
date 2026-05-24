import { isDemoMode } from "@/lib/demo";
import { createClient } from "@/lib/supabase/server";

export async function getApiUserId(): Promise<
  { userId: string } | { error: string; status: number }
> {
  if (isDemoMode()) {
    return { error: "CSV import API requires Supabase auth. Use demo wizard client flow.", status: 503 };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Authentication required.", status: 401 };
  }

  return { userId: user.id };
}
