import { Link, useRouter } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Building2,
  FileText,
  Star,
  Users,
  UserCog,
  Send,
  User,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { signOut } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type UserRole = "apprentice" | "apprentice_manager" | "placement_manager";

interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    to: "/dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
    roles: ["apprentice", "apprentice_manager", "placement_manager"],
  },
  {
    label: "Placements",
    to: "/placements",
    icon: <Building2 className="h-5 w-5" />,
    roles: ["apprentice", "apprentice_manager", "placement_manager"],
  },
  {
    label: "Applications",
    to: "/applications",
    icon: <FileText className="h-5 w-5" />,
    roles: ["apprentice", "apprentice_manager", "placement_manager"],
  },
  {
    label: "Reviews",
    to: "/reviews",
    icon: <Star className="h-5 w-5" />,
    roles: ["apprentice", "apprentice_manager", "placement_manager"],
  },
  {
    label: "Apprentices",
    to: "/apprentices",
    icon: <Users className="h-5 w-5" />,
    roles: ["apprentice_manager", "placement_manager"],
  },
  {
    label: "Managers",
    to: "/managers",
    icon: <UserCog className="h-5 w-5" />,
    roles: ["apprentice_manager"],
  },
  {
    label: "Requests",
    to: "/requests",
    icon: <Send className="h-5 w-5" />,
    roles: ["placement_manager"],
  },
  {
    label: "Profile",
    to: "/profile",
    icon: <User className="h-5 w-5" />,
    roles: ["apprentice", "apprentice_manager", "placement_manager"],
  },
];

const roleLabels: Record<UserRole, string> = {
  apprentice: "Apprentice",
  apprentice_manager: "Apprentice Manager",
  placement_manager: "Placement Manager",
};

interface SidebarProps {
  userName: string;
  userRole: UserRole;
}

export function Sidebar({ userName, userRole }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();

  const filteredItems = navItems.filter((item) => item.roles.includes(userRole));

  const handleSignOut = async () => {
    await signOut();
    router.navigate({ to: "/login" });
  };

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b px-6 py-5">
        <Building2 className="h-8 w-8 text-primary" />
        <div className="min-w-0">
          <h1 className="text-lg font-bold leading-tight">Placements</h1>
          <p className="truncate text-xs text-muted-foreground">
            {roleLabels[userRole]}
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {filteredItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground [&.active]:bg-accent [&.active]:text-accent-foreground"
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="border-t p-4">
        <div className="mb-3 flex items-center gap-3 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{userName}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start gap-2"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-4 z-50 md:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? "Close menu" : "Open menu"}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 border-r bg-background transition-transform md:translate-x-0 md:static md:z-auto",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
