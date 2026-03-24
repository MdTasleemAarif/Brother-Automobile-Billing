import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Brothers Automobiles — Billing",
  description: "Garage billing system for Brothers Automobiles",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-100">
        {/* Navbar */}
        <nav className="bg-blue-700 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-6">
            <Link href="/" className="font-bold text-lg tracking-tight">
              🔧 Brothers Automobiles
            </Link>
            <div className="flex-1" />
            <Link
              href="/bills/new"
              className="bg-white text-blue-700 font-semibold text-sm px-4 py-1.5 rounded-lg hover:bg-blue-50 transition"
            >
              + New Bill
            </Link>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
