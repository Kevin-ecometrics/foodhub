// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { OrderProvider } from "@/app/context/OrderContext";
import { SessionProvider } from "@/app/context/SessionContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Casa Jardin Burgers - Sistema Gestión Meseros",
  description:
    "Sistema profesional de gestión para restaurantes Casa Jardin Burgers. Administra pedidos en tiempo real, controla mesas y recibe notificaciones instantáneas. Optimiza tu servicio con nuestro panel mesero.",
  keywords:
    "Casa Jardin Burgers, restaurante, mesero, pedidos, gestión restaurante, sistema meseros, ordenes comida, administración mesas",
  authors: [{ name: "Ecommetrica" }],
  publisher: "Ecommetrica",
  robots: "index, follow",
  metadataBase: new URL("https://foodhub-software.vercel.app"),
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProvider>
          <OrderProvider>{children}</OrderProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
