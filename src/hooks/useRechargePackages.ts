import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useRechargePackages() {
  return useQuery({
    queryKey: ["active-recharge-packages"],
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase.from("recharge_packages").select("plan_id,label,price,minutes,bonus,highlight,is_night").eq("is_active", true).order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useFeaturedRecharge() {
  const query = useRechargePackages();
  const plan = query.data?.find(p => p.plan_id === "10day") ?? query.data?.find(p => p.highlight && !p.is_night) ?? query.data?.find(p => !p.is_night);
  return { ...query, plan };
}