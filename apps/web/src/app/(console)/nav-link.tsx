"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
  return (
    <Link
      href={href}
      className={`px-3 py-2 text-[14px] font-semibold ${
        active ? "bg-[#14140f] text-white" : "text-[#14140f] hover:bg-[#efece4]"
      }`}
    >
      {children}
    </Link>
  );
}
