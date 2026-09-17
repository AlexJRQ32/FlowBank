import type { Metadata } from "next";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.scss";

export const metadata: Metadata = {
  title: "FlowBank: track your credit-card due dates",
  description:
    "FlowBank helps you track credit-card due dates, invoices and payments.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es">
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
