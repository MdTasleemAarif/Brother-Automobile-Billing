"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/quotation", label: "Quotation" },
  { href: "/earnings", label: "Earnings" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (pathname === "/login") return null;

  const logout = async () => {
    setIsLoggingOut(true);

    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/login");
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#87d8d8] bg-[#fffaf0]/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-2 sm:px-4">
        <div className="flex min-h-14 items-center gap-1.5 py-2 sm:h-16 sm:gap-3 sm:py-0">
          <Link href="/" className="flex min-w-0 shrink items-center gap-1.5 sm:gap-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-[#87d8d8] sm:h-10 sm:w-10">
              <Image
                src="/BA-logo.png"
                alt="Brothers Automobiles"
                width={40}
                height={40}
                className="h-full w-full object-contain"
                priority
              />
            </span>
            <span className="min-w-0 max-w-[74px] sm:max-w-none">
              <span className="block truncate text-[10px] font-extrabold tracking-tight text-[#082342] sm:text-[15px]">
                Brothers Automobiles
              </span>
              <span className="block truncate text-[8px] font-semibold uppercase tracking-[0.08em] text-[#0f9fa6] sm:text-[11px] sm:tracking-[0.18em]">
                Garage E-Billing
              </span>
            </span>
          </Link>

          <nav className="min-w-0 flex-1">
            <div className="flex items-center justify-end gap-0.5 sm:gap-1">
              {navItems.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-md px-1.5 py-1.5 text-[10px] font-bold transition sm:rounded-lg sm:px-3 sm:py-2 sm:text-sm ${
                      active
                        ? "bg-[#d9f3f2] text-[#082342] ring-1 ring-[#87d8d8]"
                        : "text-[#35526f] hover:bg-[#fff0d2] hover:text-[#082342]"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>

          <Link
            href="/bills/new"
            className="shrink-0 rounded-md bg-[#f7c948] px-2 py-1.5 text-[10px] font-extrabold text-[#082342] shadow-sm transition hover:bg-[#f47d61] hover:text-white sm:rounded-lg sm:px-4 sm:py-2 sm:text-sm"
          >
            + New Bill
          </Link>

          <button
            type="button"
            onClick={logout}
            disabled={isLoggingOut}
            className="shrink-0 rounded-md border border-[#f47d61]/50 bg-white px-1.5 py-1.5 text-[9px] font-extrabold text-[#a33f2f] shadow-sm transition hover:bg-[#fff0eb] disabled:opacity-60 sm:rounded-lg sm:px-3 sm:py-2 sm:text-sm"
          >
            {isLoggingOut ? "..." : "Logout"}
          </button>
        </div>
      </div>
    </header>
  );
}
