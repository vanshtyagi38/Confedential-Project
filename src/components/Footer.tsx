import { useState } from "react";
import { Shield } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

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

const Footer = () => {
  const [clickCounts, setClickCounts] = useState({ privacy: 0, terms: 0, refund: 0 });
  const [openPolicy, setOpenPolicy] = useState<PolicyType | null>(null);

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

  return (
    <>
      <footer className="mx-4 mt-8 mb-28 rounded-2xl border border-border bg-card/50 p-5">
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
          <button
            onClick={() => handlePolicyClick("privacy")}
            className="text-primary/70 hover:text-primary transition-colors"
          >
            Privacy policy
          </button>
          <span className="text-muted-foreground">·</span>
          <button
            onClick={() => handlePolicyClick("terms")}
            className="text-primary/70 hover:text-primary transition-colors"
          >
            Terms & conditions
          </button>
          <span className="text-muted-foreground">·</span>
          <button
            onClick={() => handlePolicyClick("refund")}
            className="text-primary/70 hover:text-primary transition-colors"
          >
            Refund policy
          </button>
        </div>
      </footer>

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
