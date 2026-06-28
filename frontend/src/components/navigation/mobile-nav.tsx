import Link from "next/link";

const navItems = [
  { href: "/dashboard", label: "Home" },
  { href: "/workouts", label: "Workouts" },
  { href: "/workouts/new", label: "Log" },
  { href: "/routines", label: "Routines" },
  { href: "/settings", label: "Profile" },
];

export function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-black/75 px-2 pb-3 pt-2 shadow-[0_-16px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-2xl px-2 py-2.5 text-center text-xs font-bold text-neutral-400 transition hover:bg-white/10 hover:text-white"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}