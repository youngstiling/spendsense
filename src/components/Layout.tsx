import type { ReactNode } from "react";
import { SaasShell } from "@/components/saas/saas-shell";

export default function Layout({ children }: { children: ReactNode }) {
  return <SaasShell>{children}</SaasShell>;
}
