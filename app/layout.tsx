import type { Metadata } from "next";
import "./style.css";

export const metadata: Metadata = {
  title: "Brújula · Tu próximo paso",
  description: "Encuentra oportunidades, construye tu ruta y conecta con una comunidad que crece contigo.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
