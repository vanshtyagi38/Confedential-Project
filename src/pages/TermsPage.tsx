import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

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

const TermsPage = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/80 backdrop-blur-md px-4 py-3">
        <button onClick={() => navigate(-1)} className="rounded-full p-1.5 hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-base font-bold">Terms & Conditions</h1>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-6">
        <pre className="whitespace-pre-wrap text-sm text-muted-foreground font-sans leading-relaxed">
          {TERMS}
        </pre>
      </main>
    </div>
  );
};

export default TermsPage;
