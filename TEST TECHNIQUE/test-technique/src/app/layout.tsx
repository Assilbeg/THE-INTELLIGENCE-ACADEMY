import type { Metadata } from "next";
import { Bricolage_Grotesque, Assistant } from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
});

const assistant = Assistant({
  variable: "--font-assistant",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Test Technique - Intelligence Academy",
  description: "Test technique pour les candidats formateurs Intelligence Academy",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${bricolage.variable} ${assistant.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
