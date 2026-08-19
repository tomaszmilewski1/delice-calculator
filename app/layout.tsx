import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Délice – Kalkulator tortów",
  description: "Kalkulator tortów – receptury, koszty i zamówienia.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
