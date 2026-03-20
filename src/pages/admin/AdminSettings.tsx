import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, Smartphone } from "lucide-react";

const AdminSettings = () => {
  const [chatLimit, setChatLimit] = useState("50");
  const [spinEnabled, setSpinEnabled] = useState(true);
  const [referralEnabled, setReferralEnabled] = useState(true);
  const [razorpayEnabled, setRazorpayEnabled] = useState(true);
  const [phonepeEnabled, setPhonepeEnabled] = useState(false);
  const [loadingGateways, setLoadingGateways] = useState(true);

  useEffect(() => {
    loadGatewaySettings();
  }, []);

  const loadGatewaySettings = async () => {
    const { data } = await (supabase as any)
      .from("payment_gateway_settings")
      .select("*")
      .eq("id", "default")
      .maybeSingle();
    if (data) {
      setRazorpayEnabled(data.razorpay_enabled);
      setPhonepeEnabled(data.phonepe_enabled);
    }
    setLoadingGateways(false);
  };

  const handleToggleGateway = async (gateway: "razorpay" | "phonepe", newValue: boolean) => {
    // Ensure at least one gateway stays enabled
    if (gateway === "razorpay" && !newValue && !phonepeEnabled) {
      toast.error("At least one payment gateway must be enabled");
      return;
    }
    if (gateway === "phonepe" && !newValue && !razorpayEnabled) {
      toast.error("At least one payment gateway must be enabled");
      return;
    }

    const update = gateway === "razorpay"
      ? { razorpay_enabled: newValue, updated_at: new Date().toISOString() }
      : { phonepe_enabled: newValue, updated_at: new Date().toISOString() };

    const { error } = await (supabase as any)
      .from("payment_gateway_settings")
      .update(update)
      .eq("id", "default");

    if (error) {
      toast.error("Failed to update gateway setting");
      return;
    }

    if (gateway === "razorpay") setRazorpayEnabled(newValue);
    else setPhonepeEnabled(newValue);
    toast.success(`${gateway === "razorpay" ? "Razorpay" : "PhonePe"} ${newValue ? "enabled" : "disabled"}`);
  };

  const handleSave = () => {
    toast.success("Settings saved");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/40">
          <CardHeader><CardTitle className="text-base">Chat Limits</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Max messages per conversation</Label>
              <Input value={chatLimit} onChange={e => setChatLimit(e.target.value)} type="number" className="mt-1 rounded-xl" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader><CardTitle className="text-base">Features</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Spin Wheel</Label>
              <Switch checked={spinEnabled} onCheckedChange={setSpinEnabled} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Referral System</Label>
              <Switch checked={referralEnabled} onCheckedChange={setReferralEnabled} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40 lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Payment Gateways</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {loadingGateways ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : (
              <>
                <div className="flex items-center justify-between rounded-xl border border-border p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                      <CreditCard className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Razorpay</p>
                      <p className="text-xs text-muted-foreground">UPI, Cards, Wallets, Net Banking</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold ${razorpayEnabled ? "text-green-500" : "text-muted-foreground"}`}>
                      {razorpayEnabled ? "Live" : "Off"}
                    </span>
                    <Switch checked={razorpayEnabled} onCheckedChange={(v) => handleToggleGateway("razorpay", v)} />
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-border p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                      <Smartphone className="h-5 w-5 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">PhonePe</p>
                      <p className="text-xs text-muted-foreground">UPI, PhonePe Wallet (Test Mode)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold ${phonepeEnabled ? "text-green-500" : "text-muted-foreground"}`}>
                      {phonepeEnabled ? "Live" : "Off"}
                    </span>
                    <Switch checked={phonepeEnabled} onCheckedChange={(v) => handleToggleGateway("phonepe", v)} />
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">⚠️ At least one payment gateway must be enabled at all times.</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Button onClick={handleSave} className="rounded-xl">Save Settings</Button>
    </div>
  );
};

export default AdminSettings;
