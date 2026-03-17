import { NavLink, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard, Users, MessageSquare, CreditCard,
  BarChart3, Settings, Shield, LogOut, Activity, Heart, HelpCircle, UserPlus, Bell, ShieldCheck, Gauge, LineChart, Globe,
  ChevronDown, FileText, Zap, Layout
} from "lucide-react";

const links = [
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/admin/companions", icon: Heart, label: "Companions" },
  { to: "/admin/users", icon: Users, label: "Users" },
  { to: "/admin/conversations", icon: MessageSquare, label: "Conversations" },
  { to: "/admin/payments", icon: CreditCard, label: "Payments" },
  { to: "/admin/notifications", icon: Bell, label: "Notifications" },
  { to: "/admin/stats", icon: BarChart3, label: "Statistics" },
  { to: "/admin/activity", icon: Activity, label: "Activity Log" },
  { to: "/admin/support", icon: HelpCircle, label: "Help & Support" },
  { to: "/admin/wishlist", icon: UserPlus, label: "Wishlist" },
  { to: "/admin/api-analytics", icon: Gauge, label: "API Analytics" },
  { to: "/admin/ga4", icon: LineChart, label: "Google Analytics" },
];

const seoSubLinks = [
  { to: "/admin/seo", icon: LayoutDashboard, label: "Overview", end: true },
  { to: "/admin/seo/pages", icon: FileText, label: "All Pages" },
  { to: "/admin/seo/pages/new", icon: FileText, label: "New Page" },
  { to: "/admin/seo/bulk", icon: Zap, label: "Bulk Create" },
  { to: "/admin/seo/templates", icon: Layout, label: "Templates" },
];

const bottomLinks = [
  { to: "/admin/security", icon: ShieldCheck, label: "Security" },
  { to: "/admin/settings", icon: Settings, label: "Settings" },
];

const AdminSidebar = ({ onSignOut }: { onSignOut: () => void }) => {
  const location = useLocation();
  const isSeoActive = location.pathname.startsWith("/admin/seo");
  const [seoOpen, setSeoOpen] = useState(isSeoActive);

  const isActive = (path: string, end?: boolean) => {
    if (end) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const linkClass = (path: string, end?: boolean) =>
    `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
      isActive(path, end)
        ? "bg-primary text-primary-foreground shadow-md"
        : "text-muted-foreground hover:bg-muted hover:text-foreground"
    }`;

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-card flex flex-col">
      <div className="flex items-center gap-2 px-6 py-5 border-b border-border">
        <Shield className="h-6 w-6 text-primary" />
        <span className="text-lg font-bold text-foreground">Admin Panel</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {links.map((link) => (
          <NavLink key={link.to} to={link.to} end={link.end} className={() => linkClass(link.to, link.end)}>
            <link.icon className="h-5 w-5" />
            {link.label}
          </NavLink>
        ))}

        {/* SEO collapsible section */}
        <button
          onClick={() => setSeoOpen(!seoOpen)}
          className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
            isSeoActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <Globe className="h-5 w-5" />
          SEO Pages
          <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${seoOpen ? "rotate-180" : ""}`} />
        </button>
        {seoOpen && (
          <div className="ml-4 space-y-1 border-l border-border pl-3">
            {seoSubLinks.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end} className={() => linkClass(link.to, link.end)}>
                <link.icon className="h-4 w-4" />
                {link.label}
              </NavLink>
            ))}
          </div>
        )}

        {bottomLinks.map((link) => (
          <NavLink key={link.to} to={link.to} className={() => linkClass(link.to)}>
            <link.icon className="h-5 w-5" />
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-border p-3">
        <button
          onClick={onSignOut}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
