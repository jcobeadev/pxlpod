"use client";

import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await createClient().auth.signOut();
        router.push("/login");
        router.refresh();
      }}
      className="w-full border border-[#14140f] py-2 text-[12px] font-bold uppercase tracking-wide hover:bg-[#14140f] hover:text-white"
    >
      Sign out
    </button>
  );
}
