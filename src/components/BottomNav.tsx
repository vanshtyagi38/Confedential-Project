import { Home, MessageCircle, Gift, Wallet, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthGuard } from "@/hooks/useAuthGuard";

const navItems = [
  { icon: Home, label: "Home", path: "/", public: true },
  { icon: MessageCircle, label: "Chats", path: "/chats", public: false },
  { icon: Gift, label: "Earn", path: "/earn", public: false },
  { icon: Wallet, label: "Recharge", path: "/recharge", public: false },
  { icon: User, label: "Profile", path: "/profile", public: false },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { requireAuth } = useAuthGuard();

  // Hide on chat pages
  if (location.pathname.startsWith("/chat/")) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-2xl items-center justify-around py-2">
        {navItems.map(({ icon: Icon, label, path, public: isPublic }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => isPublic ? navigate(path) : requireAuth(() => navigate(path))}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-medium transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
              {isActive && (
                <span className="mt-0.5 h-1 w-1 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
