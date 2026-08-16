import Link from "next/link";
import { requireStaff } from "../../lib/auth";
import { SignOutButton } from "./sign-out";
import { NavLink } from "./nav-link";

/** The signed-in console shell: sidebar nav + the operator's tenant identity. */
export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireStaff();

  return (
    <div className="min-h-screen grid grid-cols-[240px_1fr]">
      <aside className="border-r border-[#14140f] bg-white flex flex-col">
        <div className="p-5 border-b border-[#d8d4ca]">
          <Link href="/" className="font-display text-2xl uppercase leading-none">
            Poplab
          </Link>
          <p className="mt-1.5 text-[13px] font-semibold">{staff.tenantName}</p>
          <p className="text-[11px] uppercase tracking-widest text-[#7a736a]">{staff.role}</p>
        </div>

        <nav className="flex flex-col p-3 gap-0.5">
          <NavLink href="/">Dashboard</NavLink>
          <NavLink href="/templates">Templates</NavLink>
          <NavLink href="/events">Events</NavLink>
        </nav>

        <div className="mt-auto p-4 border-t border-[#d8d4ca]">
          <p className="text-[11px] text-[#7a736a] truncate mb-2">{staff.email}</p>
          <SignOutButton />
        </div>
      </aside>

      <main className="overflow-y-auto">{children}</main>
    </div>
  );
}
