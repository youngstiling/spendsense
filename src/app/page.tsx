import { redirect } from "next/navigation";
import { isDemoMode } from "@/lib/demo";

export default function Home() {
  redirect(isDemoMode() ? "/dashboard" : "/login");
}
