"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

/** W-01 Sign in. Email + password for the operator console. */
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }
    router.push("/");
    router.refresh();
  };

  return (
    <main className="min-h-screen grid place-items-center bg-[#dcdcd8] p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <div className="font-display text-4xl uppercase leading-none">Poplab</div>
          <p className="mt-2 text-sm text-[#7a736a]">Operator console</p>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-3 bg-white border border-[#14140f] p-6">
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#7a736a]">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border border-[#14140f] px-3 py-2.5 text-[15px] outline-none focus:bg-[#faf9f5]"
              placeholder="you@yourbooth.com"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#7a736a]">Password</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border border-[#14140f] px-3 py-2.5 text-[15px] outline-none focus:bg-[#faf9f5]"
            />
          </label>

          {error ? <p className="text-[13px] text-[#a33418]">{error}</p> : null}

          <button
            type="submit"
            disabled={busy}
            className="mt-2 bg-[#14140f] text-white font-bold uppercase tracking-wide py-3 disabled:opacity-50"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
