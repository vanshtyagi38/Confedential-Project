import { useState, useMemo } from "react";
import JustJoined from "@/components/JustJoined";
import { Shield, Share2, Copy, Zap, Clock, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanions } from "@/hooks/useCompanions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import SpinWheel, { SEGMENTS, segAngles } from "@/components/SpinWheel";
import InvitePopup from "@/components/InvitePopup";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PRIVACY_POLICY = `Privacy Policy

Singletape

Last updated: March 2026

1. Introduction

Welcome to Singletape ("the Platform", "Service", "Company", "we", "us", or "our").

Singletape is a social interaction platform operated by Singletape Technologies, a company based in Bengaluru, Karnataka, India.

The platform may include:
• AI-generated companions
• real user-to-user communication
• random chat features
• social discovery tools

This Privacy Policy explains how we collect, use, and protect your information when using the Service.

By accessing or using Singletape, you agree to the practices described in this Privacy Policy.

2. Information We Collect

Account Information
When creating an account we may collect:
• phone number or email address
• username or display name
• profile photo
• optional profile information

User Content
We may collect content created or shared by users including:
• chat messages
• images or media shared in chats
• profile information

AI Interactions
Messages sent to AI companions may be processed by artificial intelligence systems to generate responses and improve platform functionality.

Transaction Data
If users purchase paid features, we may collect:
• wallet recharge information
• payment confirmation data
• transaction history

Payments are processed securely through third-party payment gateways. Singletape does not store full card details.

Device & Technical Information
We may automatically collect:
• IP address
• device type
• browser type
• operating system
• usage analytics

Cookies
Cookies and similar technologies may be used to improve platform functionality and user experience.

3. How We Use Information

We may use collected information to:
• create and maintain user accounts
• enable communication between users
• generate AI responses
• process payments
• improve the platform and services
• detect fraud, spam, or abuse
• maintain platform security
• comply with legal obligations

Singletape does not sell personal data to advertisers.

4. AI Interaction Disclosure

Some features of the platform may involve AI-generated characters or automated responses.

Users acknowledge that:
• AI characters are fictional
• AI responses are generated automatically
• AI responses may sometimes be inaccurate or unpredictable
• AI interactions are provided for entertainment purposes only.

5. User-to-User Interaction

Users may communicate with other users through chat or random matching features.

Singletape does not verify the identity of all users and cannot guarantee the authenticity, intentions, or behavior of any user.

Users interact with others at their own risk.

6. Data Sharing

We may share information with:
• payment processing providers
• AI infrastructure providers
• analytics providers
• content moderation systems
• government or legal authorities when required by law

All service providers operate under strict confidentiality obligations.

7. Data Security

Singletape uses industry-standard security practices including encryption and secure server infrastructure to protect user data.

However, no digital platform can guarantee absolute security.

8. Data Retention

User information may be retained:
• while the account remains active
• as necessary to operate the Service
• as required by applicable law

Chat logs may be stored in anonymized form for service improvement.

9. User Rights

Users may request:
• access to personal data
• correction of inaccurate information
• deletion of their account

Requests can be submitted by contacting support.

10. Age Requirement

Singletape is strictly intended for users aged 18 years or older.

Accounts identified as belonging to minors may be removed immediately.

11. Changes to this Policy

Singletape may update this Privacy Policy periodically.

Continued use of the platform after changes indicates acceptance of the updated policy.

12. Contact

For privacy inquiries, contact:
Email: info@singletape.com
Company: Singletape Technologies
Location: Bengaluru, Karnataka, India`;

const TERMS = `Terms & Conditions

Singletape

Last updated: March 2026

1. Acceptance of Terms

By accessing or using Singletape, users agree to these Terms and Conditions.

If users do not agree, they must discontinue use of the platform immediately.

2. Service Description

Singletape is a technology platform that enables:
• social discovery
• AI-powered conversations
• user-to-user chat
• random chat matching
• optional premium features

The platform is provided for entertainment and social interaction purposes only.

3. Platform Role

Singletape operates solely as a technology platform.

The Company:
• does not control user conversations
• does not verify or guarantee user authenticity
• does not participate in relationships formed between users

Users acknowledge that the Company is not responsible for interactions between users.

4. AI Content Disclaimer

Some conversations on Singletape may involve AI-generated characters.

These characters:
• are fictional
• are not real individuals
• generate responses automatically

AI responses may contain inaccuracies or unexpected content.

Users interact with AI systems at their own risk.

5. User Conduct

Users agree not to:
• harass, threaten, or abuse other users
• share illegal, harmful, or offensive content
• impersonate individuals or organizations
• distribute malicious software
• attempt to hack, exploit, or manipulate the platform

Violation may result in account suspension or permanent termination.

6. Payments

Certain features may require payment including:
• wallet recharges
• premium features
• paid AI interactions

Payments are processed securely through third-party payment gateways.

Payments are generally non-refundable once used, except where required by law.

7. User Interaction Risk

Users acknowledge that interacting with others online may involve risks including:
• misleading information
• impersonation
• inappropriate or offensive content

Users assume full responsibility for their interactions.

8. Limitation of Liability

To the maximum extent permitted under the laws of India, Singletape and its owners shall not be liable for damages arising from:
• use of the Service
• user interactions
• AI-generated responses
• user-generated content
• service interruptions
• unauthorized access to accounts

Total liability shall not exceed the amount paid by the user to the Service within the preceding 30 days.

9. Indemnification

Users agree to defend and hold harmless Singletape Technologies, its owners, employees, and affiliates from any claims, damages, or expenses arising from:
• user-generated content
• misuse of the platform
• violation of these Terms

10. Account Termination

Singletape reserves the right to suspend or terminate accounts at its discretion for violations of these Terms or for safety and legal compliance.

11. Governing Law

These Terms are governed by the laws of India.

All disputes shall fall under the jurisdiction of courts located in Bengaluru, Karnataka, India.

12. Contact

For support or legal inquiries:
Singletape Technologies
Bengaluru, Karnataka, India
Email: info@singletape.com`;

const REFUND_POLICY = `Refund Policy

Singletape

Last updated: March 2026

1. General Policy

All purchases on Singletape, including wallet recharges and premium features, are generally non-refundable once the minutes or credits have been used or partially used.

2. Eligible Refunds

Refunds may be considered in the following cases:
• Technical errors that resulted in duplicate charges
• Minutes not credited to the account after successful payment
• Platform errors that prevented use of purchased features

3. Refund Process

To request a refund:
• Contact us at info@singletape.com within 7 days of the transaction
• Include your registered email, transaction details, and reason for the refund request

4. Processing Time

Approved refunds will be processed within 7-10 business days to the original payment method.

5. Non-Refundable Items

The following are not eligible for refunds:
• Minutes that have been used in conversations
• Spin wheel credits that have been used
• Promotional or bonus minutes

6. Contact

For refund inquiries:
Email: info@singletape.com
Company: Singletape Technologies
Location: Bengaluru, Karnataka, India`;

type PolicyType = "privacy" | "terms" | "refund";

function getRandomPrize(hasReferral10: boolean): number {
  const eligible = SEGMENTS.map((s, i) => ({
    ...s, idx: i, w: s.type === "locked" && !hasReferral10 ? 0 : s.weight,
  }));
  const total = eligible.reduce((sum, s) => sum + s.w, 0);
  let rand = Math.random() * total;
  for (const s of eligible) { rand -= s.w; if (rand <= 0) return s.idx; }
  return 0;
}

const Footer = () => {
  const navigate = useNavigate();
  const { session, profile, refreshProfile } = useAuth();
  const { companions } = useCompanions();
  const [clickCounts, setClickCounts] = useState({ privacy: 0, terms: 0, refund: 0 });
  const [openPolicy, setOpenPolicy] = useState<PolicyType | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState<number | null>(null);

  const spinCredits = profile?.spin_credits || 0;
  const referralCode = profile?.referral_code || "";
  const referralLink = `${window.location.origin}/onboarding?ref=${referralCode}`;

  const topMatches = useMemo(() => {
    if (!profile) return companions.slice(0, 6);
    return companions
      .filter((c) => c.gender === profile.preferred_gender)
      .slice(0, 6);
  }, [companions, profile]);

  const rechargeOffers = [
    { label: "30 min", price: "₹199", original: "₹299", tag: "STARTER" },
    { label: "60 min", price: "₹249", original: "₹399", tag: "POPULAR 🔥" },
    { label: "3 Hours", price: "₹499", original: "₹799", tag: "BEST VALUE" },
  ];

  const handlePolicyClick = (type: PolicyType) => {
    const newCount = clickCounts[type] + 1;
    setClickCounts(prev => ({ ...prev, [type]: newCount }));
    if (newCount >= 5) {
      setOpenPolicy(type);
      setClickCounts(prev => ({ ...prev, [type]: 0 }));
    }
  };

  const getPolicyContent = (type: PolicyType) => {
    switch (type) {
      case "privacy": return PRIVACY_POLICY;
      case "terms": return TERMS;
      case "refund": return REFUND_POLICY;
    }
  };

  const getPolicyTitle = (type: PolicyType) => {
    switch (type) {
      case "privacy": return "Privacy Policy";
      case "terms": return "Terms & Conditions";
      case "refund": return "Refund Policy";
    }
  };

  const handleSpinClick = async () => {
    if (spinning) return;
    if (spinCredits <= 0) { setInviteOpen(true); return; }

    const winnerIndex = getRandomPrize(false);
    const centerAngle = segAngles[winnerIndex].center;
    const targetRotation = rotation + 1800 + (360 - centerAngle);
    setRotation(targetRotation);
    setSpinning(true);
    setWinner(null);

    if (session?.user) {
      await (supabase as any).from("user_profiles").update({ spin_credits: spinCredits - 1 }).eq("user_id", session.user.id);
      await refreshProfile();
    }

    setTimeout(async () => {
      setSpinning(false);
      setWinner(winnerIndex);
      const prize = SEGMENTS[winnerIndex];
      if (session?.user && profile) {
        if (prize.type === "free_spin") {
          await (supabase as any).from("user_profiles").update({ spin_credits: (profile.spin_credits || 0) }).eq("user_id", session.user.id);
          await refreshProfile();
          toast.success("🎡 You won a Free Spin!");
        } else {
          await Promise.all([
            (supabase as any).from("user_profiles").update({ balance_minutes: profile.balance_minutes + prize.minutes }).eq("user_id", session.user.id),
            (supabase as any).from("wallet_transactions").insert({ user_id: session.user.id, type: "credit", minutes: prize.minutes, amount: 0, description: `🎡 Spin wheel prize: +${prize.minutes} minutes!` }),
          ]);
          await refreshProfile();
          toast.success(`🎉 You won ${prize.minutes} free minutes!`);
        }
      }
    }, 4000);
  };

  return (
    <>
      {/* Spin Wheel Section */}
      <div className="mx-4 mt-8 rounded-2xl border border-border bg-card/50 p-4 text-center">
        <h3 className="text-sm font-bold mb-1">🎡 Spin & Win Free Minutes</h3>
        <p className="text-[11px] text-muted-foreground mb-3">
          {spinCredits > 0 ? `You have ${spinCredits} spin${spinCredits !== 1 ? "s" : ""}!` : "Invite friends to earn spins!"}
        </p>
        <div className="flex justify-center">
          <div className="scale-[0.65] -my-12">
            <SpinWheel spinning={spinning} rotation={rotation} onSpinClick={handleSpinClick} disabled={spinning} hasReferral10={false} />
          </div>
        </div>
        {winner !== null && !spinning && (
          <div className="mt-2 animate-fade-in rounded-xl bg-primary/10 px-4 py-2">
            <p className="text-sm font-bold text-primary">
              {SEGMENTS[winner].type === "free_spin" ? "🎡 Free Spin! Go again!" : `🎉 You won ${SEGMENTS[winner].minutes} minutes!`}
            </p>
          </div>
        )}
      </div>

      {/* Invite Section */}
      <div className="mx-4 mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Share2 className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold">Invite & Earn Free Spins 🎡</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">Share via social apps. Your friend gets 5 min free, you get a spin!</p>
        <button
          onClick={() => setInviteOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl gradient-primary py-3 text-sm font-bold text-primary-foreground transition-transform active:scale-95"
        >
          <Share2 className="h-4 w-4" />
          Invite Now
        </button>
      </div>

      {/* Recharge Offers */}
      <div className="mx-4 mt-4">
        <h3 className="text-sm font-bold px-1 mb-2">⚡ Quick Recharge Offers</h3>
        <div className="grid grid-cols-3 gap-2">
          {rechargeOffers.map((offer) => (
            <button
              key={offer.label}
              onClick={() => navigate("/recharge")}
              className="rounded-2xl border border-border bg-card p-3 text-center transition-all active:scale-95 hover:border-primary/30"
            >
              <span className="block text-[9px] font-bold text-primary">{offer.tag}</span>
              <span className="block text-sm font-extrabold mt-1">{offer.label}</span>
              <span className="block text-xs font-bold text-primary mt-0.5">{offer.price}</span>
              <span className="block text-[10px] text-muted-foreground line-through">{offer.original}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Top Match Profiles Grid */}
      {topMatches.length > 0 && (
        <div className="mx-4 mt-4">
          <h3 className="text-sm font-bold px-1 mb-2">🔥 Top Matches</h3>
          <div className="grid grid-cols-3 gap-2">
            {topMatches.map((c) => (
              <button
                key={c.id}
                onClick={() => navigate(`/chat/${c.id}`)}
                className="overflow-hidden rounded-2xl bg-card shadow-card transition-all active:scale-95"
              >
                <div className="relative aspect-[3/4]">
                  <img src={c.image} alt={c.name} className="h-full w-full object-cover" loading="lazy" />
                  <div className="gradient-card-overlay absolute inset-0" />
                  <div className="absolute bottom-1.5 left-1.5">
                    <p className="text-[11px] font-bold text-white drop-shadow-md">{c.name}, {c.age}</p>
                  </div>
                  <div className="absolute right-1 top-1 flex items-center gap-0.5 rounded-full bg-green-500/90 px-1 py-0.5">
                    <span className="h-1 w-1 rounded-full bg-white animate-pulse-soft" />
                    <span className="text-[7px] font-bold text-white">LIVE</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}


      {/* Just Joined - above policy */}
      <JustJoined />

      {/* Policy Footer */}
      <footer className="mx-4 mt-4 mb-28 rounded-2xl border border-border bg-card/50 p-5">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Shield className="h-4 w-4 text-primary" />
          <p className="text-xs font-bold text-foreground">
            This platform is 100% safe, secure and keeps privacy.
          </p>
        </div>

        <div className="text-center mb-4">
          <h3 className="text-sm font-extrabold text-foreground">Singletape</h3>
          <p className="text-[11px] text-muted-foreground mt-1">Social discovery & AI companions</p>
        </div>

        <div className="text-[10px] text-muted-foreground text-center leading-relaxed mb-4">
          <p className="font-semibold text-foreground/80 mb-1">Disclaimer:</p>
          <p>Some interactions on Singletape may involve AI-generated characters.</p>
          <p>These characters are fictional and created by artificial intelligence.</p>
          <p>Users may also interact with real users on the platform.</p>
          <p className="mt-1">Singletape is not a dating guarantee service, escort service, or matchmaking agency.</p>
          <p className="mt-1 font-semibold text-foreground/70">18+ only.</p>
        </div>

        <p className="text-[10px] text-muted-foreground text-center mb-3">
          © 2026 Singletape. All rights reserved.
        </p>

        <div className="flex items-center justify-center gap-1 text-[10px]">
          <a href="/privacy" className="text-primary/70 hover:text-primary transition-colors">
            Privacy policy
          </a>
          <span className="text-muted-foreground">·</span>
          <a href="/terms" className="text-primary/70 hover:text-primary transition-colors">
            Terms & conditions
          </a>
          <span className="text-muted-foreground">·</span>
          <a href="/refund" className="text-primary/70 hover:text-primary transition-colors">
            Refund policy
          </a>
        </div>
      </footer>

      <InvitePopup open={inviteOpen} onClose={() => setInviteOpen(false)} referralCode={referralCode} referralLink={referralLink} />

      <Dialog open={!!openPolicy} onOpenChange={() => setOpenPolicy(null)}>
        <DialogContent className="max-w-lg max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{openPolicy && getPolicyTitle(openPolicy)}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-4">
            <pre className="whitespace-pre-wrap text-xs text-muted-foreground font-sans leading-relaxed">
              {openPolicy && getPolicyContent(openPolicy)}
            </pre>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Footer;
