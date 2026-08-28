import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "Staffu | HRMS Portal",
    template: "%s | Staffu HRMS",
  },
  description:
    "Staffu HRMS Portal — modern SaaS HR, CRM, payroll, and workforce analytics.",
};

export const viewport: Viewport = {
  themeColor: "#4666e1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${nunito.variable} h-full`} suppressHydrationWarning>
      <body className={`${nunito.className} min-h-full antialiased`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
