import { Settings, HelpCircle, LogOut, Clock, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import BottomNav from "@/components/BottomNav";
import onboardBoy from "@/assets/onboard-boy.png";
import onboardGirl from "@/assets/onboard-girl.png";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { session, profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/onboarding", { replace: true });
  };

  const avatarImg = profile?.gender === "male" ? onboardBoy : onboardGirl;

  return (
    <div className="mx-auto min-h-[100dvh] max-w-lg bg-background pb-24">
      <div className="px-4 py-4">
        <h1 className="text-lg font-bold">Profile</h1>
      </div>

      <div className="flex flex-col items-center py-6">
        <img src={avatarImg} alt="Avatar" className="h-20 w-20 rounded-full object-cover shadow-elevated" />
        <h2 className="mt-3 text-base font-bold">
          {profile?.display_name || "User"}
        </h2>
        <p className="text-xs text-muted-foreground">{session?.user?.email}</p>

        <div className="mt-4 flex gap-4">
          <div className="flex items-center gap-1.5 rounded-full bg-card px-4 py-2 shadow-card">
            <Clock className="h-4 w-4 text-accent" />
            <span className="text-sm font-bold">{Math.floor(profile?.balance_minutes || 0)} min</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-card px-4 py-2 shadow-card">
            <span className="text-sm font-medium text-muted-foreground">Age: {profile?.age}</span>
          </div>
        </div>
      </div>

      <div className="mx-4 space-y-1">
        <button
          onClick={() => navigate("/recharge")}
          className="flex w-full items-center gap-3 rounded-xl p-4 text-sm font-medium transition-colors hover:bg-secondary"
        >
          <Clock className="h-5 w-5 text-muted-foreground" />
          Recharge Minutes
        </button>
        <button className="flex w-full items-center gap-3 rounded-xl p-4 text-sm font-medium transition-colors hover:bg-secondary">
          <Shield className="h-5 w-5 text-muted-foreground" />
          Privacy & Security
        </button>
        <button className="flex w-full items-center gap-3 rounded-xl p-4 text-sm font-medium transition-colors hover:bg-secondary">
          <HelpCircle className="h-5 w-5 text-muted-foreground" />
          Help & Support
        </button>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-xl p-4 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </div>

      <BottomNav />
    </div>
  );
};

export default ProfilePage;
