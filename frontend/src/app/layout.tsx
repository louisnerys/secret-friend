import type { Metadata, Viewport } from "next";
import { Epilogue, Manrope } from "next/font/google";
import "./globals.css";
import PwaRegister from "./PwaRegister";
import I18nProvider from "@/components/I18nProvider";

const epilogue = Epilogue({
  variable: "--font-epilogue",
  subsets: ["latin"],
  weight: ["400", "700", "800", "900"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#7a001a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "A Celebração - Amigo Oculto",
  description: "Amigo Oculto Inteligente com Chat Anônimo",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body
        className={`${epilogue.variable} ${manrope.variable} font-body bg-surface text-on-surface antialiased overflow-x-hidden min-h-screen`}
      >
        <I18nProvider>
          <PwaRegister />
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
