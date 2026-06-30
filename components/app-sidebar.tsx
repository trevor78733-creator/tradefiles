"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  LayoutDashboard,
  ListChecks,
  LogOut,
  NotebookPen,
  Target,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { signOutAction } from "@/actions/auth";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/notes", label: "Notes", icon: NotebookPen },
  { href: "/trades", label: "Trade Log", icon: ListChecks },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/plan", label: "Trading Plan & Goals", icon: Target },
];

export function AppSidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex md:w-60 md:flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="px-5 py-5 border-b border-sidebar-border">
        <Logo />
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map((l) => {
          const active =
            l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
          const Icon = l.icon;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
              )}
            >
              <Icon className="size-4" />
              {l.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-3 py-4 border-t border-sidebar-border">
        <form action={signOutAction}>
          <button
            type="submit"
            className="w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60 transition-colors"
          >
            <LogOut className="size-4" />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}

export function MobileTopBar() {
  const pathname = usePathname();
  return (
    <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-sidebar-border bg-sidebar">
      <Logo size="sm" />
      <nav className="flex gap-1">
        {links.map((l) => {
          const active =
            l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60"
              )}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
