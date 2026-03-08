import { Gift, Share2, Star, Users } from "lucide-react";
import BottomNav from "@/components/BottomNav";

const earnOptions = [
  { icon: Share2, title: "Refer a Friend", desc: "Get ₹25 for each referral", reward: "₹25" },
  { icon: Star, title: "Daily Check-in", desc: "Log in daily for rewards", reward: "₹5" },
  { icon: Users, title: "Invite 5 Friends", desc: "Complete the challenge", reward: "₹100" },
];

const EarnPage = () => {
  return (
    <div className="mx-auto min-h-screen max-w-lg bg-background pb-24">
      <div className="px-4 py-4">
        <h1 className="text-lg font-bold">Earn Rewards</h1>
        <p className="text-sm text-muted-foreground">Complete tasks to earn free credits</p>
      </div>

      <div className="space-y-3 px-4">
        {earnOptions.map(({ icon: Icon, title, desc, reward }) => (
          <div key={title} className="flex items-center gap-4 rounded-xl bg-card p-4 shadow-card">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary">
              <Icon className="h-6 w-6 text-accent" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold">{title}</h3>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
            <span className="text-sm font-bold text-accent">{reward}</span>
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
};

export default EarnPage;
