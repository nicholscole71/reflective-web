"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function TopNav() {
  const pathname = usePathname();
  const router = useRouter();

  const active = (href: string) =>
    pathname === href
      ? "text-stone-900 border-stone-900"
      : "text-stone-500 border-transparent";

  const onSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.replace("/login");
  };

  return (
    <header className="w-full border-b border-[#dde2d8] bg-[#ffffffb3] backdrop-blur-md">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-4">
        <div className="flex items-center gap-6 text-sm tracking-wide">
          <Link href="/today" className={`border-b pb-1.5 ${active("/today")}`}>
            today
          </Link>
          <Link href="/entries" className={`border-b pb-1.5 ${active("/entries")}`}>
            entries
          </Link>
        </div>
        <button
          type="button"
          onClick={onSignOut}
          className="text-sm text-stone-500 transition hover:text-stone-700"
        >
          sign out
        </button>
      </div>
    </header>
  );
}
