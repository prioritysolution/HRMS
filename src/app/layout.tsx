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
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon/favicon-64x64.png", sizes: "64x64", type: "image/png" },
      { url: "/favicon/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon/favicon-128x128.png", sizes: "128x128", type: "image/png" },
      { url: "/favicon/favicon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/favicon/favicon-256x256.png", sizes: "256x256", type: "image/png" },
      { url: "/favicon/favicon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: [{ url: "/favicon.ico" }],
    apple: [
      { url: "/favicon/favicon-180x180.png", sizes: "180x180", type: "image/png" },
      { url: "/favicon/favicon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/favicon/favicon-144x144.png", sizes: "144x144", type: "image/png" },
    ],
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
