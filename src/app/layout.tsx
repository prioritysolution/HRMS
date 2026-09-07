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
    default: "PrioHRM | HRMS Portal",
    template: "%s | PrioHRM HRMS",
  },
  description:
    "PrioHRM HRMS Portal — modern SaaS HR, CRM, payroll, and workforce analytics.",
  icons: {
    icon: [
      { url: "/images/logos/prio-hrm-mark.png", sizes: "any", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png" }],
  },
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
