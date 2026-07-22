"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type IconName = "home" | "progress" | "log" | "routines" | "profile";

const navItems: {
  href: string;
  label: string;
  icon: IconName;
  isActive: (pathname: string) => boolean;
}[] = [
  {
    href: "/dashboard",
    label: "Home",
    icon: "home",
    isActive: (pathname) => pathname === "/dashboard",
  },
  {
    href: "/progress",
    label: "Progress",
    icon: "progress",
    isActive: (pathname) =>
      pathname === "/progress" || pathname.startsWith("/progress/"),
  },
  {
    href: "/workouts/new",
    label: "Log",
    icon: "log",
    isActive: (pathname) => pathname === "/workouts/new",
  },
  {
    href: "/routines",
    label: "Routines",
    icon: "routines",
    isActive: (pathname) => pathname.startsWith("/routines"),
  },
  {
    href: "/settings",
    label: "Profile",
    icon: "profile",
    isActive: (pathname) => pathname.startsWith("/settings"),
  },
];

function NavIcon({ name }: { name: IconName }) {
  const commonProps = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (name === "home") {
    return (
      <svg {...commonProps}>
        <path d="m3 11 9-8 9 8" />
        <path d="M5 10v10h14V10" />
        <path d="M9 20v-6h6v6" />
      </svg>
    );
  }

  if (name === "progress") {
    return (
      <svg {...commonProps}>
        <path d="m3 17 6-6 4 4 8-8" />
        <path d="M14 7h7v7" />
      </svg>
    );
  }

  if (name === "log") {
    return (
      <svg {...commonProps} width="22" height="22" strokeWidth="2.5">
        <path d="M12 5v14M5 12h14" />
      </svg>
    );
  }

  if (name === "routines") {
    return (
      <svg {...commonProps}>
        <path d="M9 6h11M9 12h11M9 18h11" />
        <path d="m4 6 1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2" />
      </svg>
    );
  }

  return (
    <svg {...commonProps}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary navigation"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-canvas/90 px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-16px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl md:hidden"
    >
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
        {navItems.map((item) => {
          const active = item.isActive(pathname);
          const isLog = item.icon === "log";

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[11px] font-bold transition active:scale-95 ${
                isLog
                  ? active
                    ? "bg-action text-action-foreground shadow-[0_8px_28px_rgba(0,0,0,0.35)] ring-1 ring-white/60"
                    : "border border-border-strong bg-action-secondary text-text-primary shadow-[0_8px_24px_rgba(0,0,0,0.24)] hover:bg-surface-elevated"
                  : active
                    ? "bg-action-secondary text-text-primary"
                    : "text-text-muted hover:bg-action-secondary hover:text-text-primary"
              }`}
            >
              <NavIcon name={item.icon} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
