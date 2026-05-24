import Link from "next/link";

const navItems = [
  { href: "/dashboard", label: "Home" },
  { href: "/workouts", label: "Workouts" },
  { href: "/workouts/new", label: "Log" },
  { href: "/exercises", label: "Exercises" },
  { href: "/settings", label: "Profile" },
];

export function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-200 bg-white/95 px-2 py-2 backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-xl px-2 py-2 text-center text-xs font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}