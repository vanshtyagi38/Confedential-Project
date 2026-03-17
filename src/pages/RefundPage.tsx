import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageSEO from "@/components/PageSEO";

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

const RefundPage = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageSEO title="Refund Policy – SingleTape" description="SingleTape refund policy. Learn about eligible refunds and the refund process." path="/refund" />
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/80 backdrop-blur-md px-4 py-3">
        <button onClick={() => navigate(-1)} className="rounded-full p-1.5 hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-base font-bold">Refund Policy</h1>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-6">
        <pre className="whitespace-pre-wrap text-sm text-muted-foreground font-sans leading-relaxed">
          {REFUND_POLICY}
        </pre>
      </main>
    </div>
  );
};

export default RefundPage;
