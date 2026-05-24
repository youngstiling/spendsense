import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AuthListener } from "@/components/auth-listener";
import "./globals.css";

export const metadata: Metadata = {
  title: "Spend Intelligence",
  description: "Pub spend KPIs, charts, and insights from CSV import",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthListener />
        {children}
      </body>
    </html>
  );
}
