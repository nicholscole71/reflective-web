"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function TopNav() {
  const pathname = usePathname();
  const router = useRouter();

  const active = (href: string) =>
    pathname === href
      ? "text-[#F6F1EB] border-[#B38A5A]"
      : "text-[#C7BEB6] border-transparent";

  const onSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.replace("/login");
  };

  return (
    <header className="w-full border-b border-[rgba(255,255,255,0.06)] bg-[rgba(27,23,20,0.45)] backdrop-blur-md">
      <div className="mx-auto flex max-w-[980px] items-center justify-between px-6 py-5">
        <div className="flex items-center gap-8 text-sm tracking-[0.14em] uppercase">
          <Link
            href="/today"
            className={`border-b pb-1.5 transition-colors duration-200 ${active("/today")}`}
          >
            today
          </Link>
          <Link
            href="/entries"
            className={`border-b pb-1.5 transition-colors duration-200 ${active("/entries")}`}
          >
            entries
          </Link>
        </div>
        <button
          type="button"
          onClick={onSignOut}
          className="text-sm tracking-[0.1em] uppercase text-[#C7BEB6] transition hover:text-[#F6F1EB]"
        >
          sign out
        </button>
      </div>
    </header>
  );
}
