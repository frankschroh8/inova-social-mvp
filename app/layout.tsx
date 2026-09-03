import type { Metadata } from "next";
import Layout from "@/components/layout/Layout";
import "./globals.css";

export const metadata: Metadata = {
  title: "Inova Social AI",
  description: "CRM imobiliário inteligente",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full">
        <Layout>{children}</Layout>
      </body>
    </html>
  );
}
