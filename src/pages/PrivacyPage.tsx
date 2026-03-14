import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

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

const PrivacyPage = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/80 backdrop-blur-md px-4 py-3">
        <button onClick={() => navigate(-1)} className="rounded-full p-1.5 hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-base font-bold">Privacy Policy</h1>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-6">
        <pre className="whitespace-pre-wrap text-sm text-muted-foreground font-sans leading-relaxed">
          {PRIVACY_POLICY}
        </pre>
      </main>
    </div>
  );
};

export default PrivacyPage;
