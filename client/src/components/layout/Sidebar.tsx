import { NavLink } from "react-router-dom";
import { LayoutDashboard, FileText, LayoutTemplate, PlusCircle, Settings, Scale } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/documents", label: "My Documents", icon: FileText },
  { to: "/templates", label: "Templates", icon: LayoutTemplate },
  { to: "/documents/new", label: "New Document", icon: PlusCircle },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-1 flex-col gap-1 p-3">
      <div className="mb-4 flex items-center gap-2 px-2 py-1.5">
        <Scale className="h-5 w-5 text-primary" aria-hidden="true" />
        <span className="text-sm font-semibold tracking-tight">LegalEase</span>
      </div>
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onNavigate}
          end={to === "/documents"}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-background hover:text-foreground",
            )
          }
        >
          <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
