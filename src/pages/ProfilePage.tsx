import { User, Settings, HelpCircle, LogOut } from "lucide-react";
import BottomNav from "@/components/BottomNav";

const ProfilePage = () => {
  return (
    <div className="mx-auto min-h-screen max-w-lg bg-background pb-24">
      <div className="px-4 py-4">
        <h1 className="text-lg font-bold">Profile</h1>
      </div>

      <div className="flex flex-col items-center py-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
          <User className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="mt-3 text-base font-bold">Guest User</h2>
        <p className="text-xs text-muted-foreground">Sign in to save your progress</p>
        <button className="mt-3 gradient-primary rounded-lg px-6 py-2 text-sm font-semibold text-primary-foreground">
          Sign In
        </button>
      </div>

      <div className="mx-4 space-y-1">
        {[
          { icon: Settings, label: "Settings" },
          { icon: HelpCircle, label: "Help & Support" },
          { icon: LogOut, label: "Log Out" },
        ].map(({ icon: Icon, label }) => (
          <button
            key={label}
            className="flex w-full items-center gap-3 rounded-xl p-4 text-sm font-medium transition-colors hover:bg-secondary"
          >
            <Icon className="h-5 w-5 text-muted-foreground" />
            {label}
          </button>
        ))}
      </div>

      <BottomNav />
    </div>
  );
};

export default ProfilePage;
