import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Clock, ShieldCheck, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const RechargeOffer = () => {
  const { session, profile } = useAuth();
  const signedIn = Boolean(session && profile);
  const balance = profile?.balance_minutes ?? 0;
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    setDismissed(false);
  }, [session?.user.id, balance >= 10]);
  const { data: offers = [] } = useQuery({
    queryKey: ["discovery-recharge-offers"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from("recharge_packages")
        .select("plan_id,label,price,minutes,bonus,highlight,is_night")
        .eq("is_active", true).order("price", { ascending: true });
      if (error) throw error;
      return (data ?? []).filter(plan => !plan.is_night).slice(0, 3);
    },
  });

  if (offers.length === 0 || dismissed || (signedIn && balance >= 10)) return null;

  return (
    <section aria-labelledby="recharge-offer-title" className="mt-4 border-y border-primary/20 bg-primary/5 px-4 py-5">
      <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 text-primary">
        <Clock className="h-4 w-4" />
        <span className="text-xs font-semibold">More time for your conversations</span>
      </div>
      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground" aria-label="Close recharge offer" onClick={() => setDismissed(true)}>
        <X className="h-4 w-4" />
      </Button>
      </div>
      <h2 id="recharge-offer-title" className="mt-2 text-xl font-bold text-foreground">
        {signedIn && (profile?.balance_minutes ?? 0) <= 0 ? "Ready to keep chatting?" : "Find your connection. Keep chatting."}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {signedIn ? balance <= 0 ? "Your chat time has run out. Recharge now to continue your conversations." : `Only ${balance < 1 ? `${Math.round(balance * 60)} seconds` : `${Number(balance.toFixed(1))} minutes`} left. Recharge before your chat time runs out.` : "Start with 30 seconds free. Choose a recharge for longer chats."}
      </p>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {offers.map((offer, index) => (
          <Button key={offer.plan_id} asChild variant="outline" className="h-auto min-w-0 flex-col items-start gap-1 whitespace-normal rounded-xl border-primary/20 bg-card p-3 text-left">
            <Link to={signedIn ? `/recharge?plan=${encodeURIComponent(offer.plan_id)}` : "/onboarding"} aria-label={`${signedIn ? "Recharge" : "Sign up to recharge"} ₹${offer.price} for ${offer.minutes + offer.bonus} minutes`}>
              <span className="text-[10px] text-muted-foreground">{index === 0 ? "Lowest price" : offer.label}</span>
              <span className="text-lg font-bold text-foreground">₹{offer.price}</span>
              <span className="text-xs text-muted-foreground">{offer.minutes + offer.bonus} min</span>
            </Link>
          </Button>
        ))}
      </div>
      <Button asChild className="mt-4 w-full rounded-xl">
        <Link to={signedIn ? "/recharge" : "/onboarding"}>
          {signedIn ? "Recharge now · Keep chatting" : "Start my 30-second trial"}<ArrowRight />
        </Link>
      </Button>
      <Button variant="ghost" className="mt-1 w-full text-xs text-muted-foreground" onClick={() => setDismissed(true)}>Skip for now</Button>
      <div className="mt-3 flex items-start gap-2 text-[11px] text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
        <p>18+ only · Includes fictional AI companions · Payment required after your free trial</p>
      </div>
    </section>
  );
};

export default RechargeOffer;