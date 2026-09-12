import type { Metadata } from "next";
import "./globals.scss";

export const metadata: Metadata = {
  title: "FlowBank — track your credit-card due dates",
  description:
    "FlowBank helps you track credit-card due dates, invoices and payments.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
