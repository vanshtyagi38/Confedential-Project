import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const AdminSettings = () => {
  const [chatLimit, setChatLimit] = useState("50");
  const [spinEnabled, setSpinEnabled] = useState(true);
  const [referralEnabled, setReferralEnabled] = useState(true);

  const handleSave = () => {
    // These settings would be stored in a settings table in production
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
      </div>

      <Button onClick={handleSave} className="rounded-xl">Save Settings</Button>
    </div>
  );
};

export default AdminSettings;
