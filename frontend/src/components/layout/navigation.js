// Single source of truth for dashboard navigation.
// Every link below has a real route in AppRoutes.jsx rendering an
// honest placeholder page — nothing here pretends to work.
import {
  Building2,
  Database,
  Folder,
  HardDrive,
  KeyRound,
  LayoutDashboard,
  ListChecks,
  Radio,
  ScrollText,
  Settings,
  User,
} from "lucide-react";

export const NAV_SECTIONS = [
  {
    label: "Workspace",
    items: [
      { to: "/", label: "Overview", icon: LayoutDashboard, end: true },
      { to: "/organizations", label: "Organizations", icon: Building2 },
      { to: "/projects", label: "Projects", icon: Folder },
    ],
  },
  {
    label: "Build",
    items: [
      { to: "/api-keys", label: "API Keys", icon: KeyRound },
      { to: "/database", label: "Database", icon: Database },
      { to: "/files", label: "File Storage", icon: HardDrive },
    ],
  },
  {
    label: "Operations",
    items: [
      { to: "/logs", label: "Logs", icon: ScrollText },
      { to: "/jobs", label: "Jobs", icon: ListChecks },
      { to: "/realtime", label: "Realtime", icon: Radio },
    ],
  },
  {
    label: "Account",
    items: [
      { to: "/settings", label: "Settings", icon: Settings },
      { to: "/profile", label: "Profile", icon: User },
    ],
  },
];

// Resolve the current page title for the topbar from the pathname.
export function titleForPath(pathname) {
  for (const section of NAV_SECTIONS) {
    for (const item of section.items) {
      if (item.end ? pathname === item.to : pathname.startsWith(item.to)) {
        return item.label;
      }
    }
  }
  return "Workspace";
}
