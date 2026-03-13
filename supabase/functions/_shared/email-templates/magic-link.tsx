/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
  token?: string
}

export const MagicLinkEmail = ({ siteName, confirmationUrl, token }: MagicLinkEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');`}</style>
    </Head>
    <Preview>Your login code for {siteName} is {token || 'ready'}</Preview>
    <Body style={main}>
      <Container style={wrapper}>
        {/* Header */}
        <Section style={header}>
          <Text style={logoText}>SingleTape</Text>
        </Section>

        {/* Main Card */}
        <Section style={card}>
          <Heading style={h1}>Sign in to {siteName}</Heading>
          <Text style={subtitle}>
            Use the code below or tap the button to sign in securely. No password needed.
          </Text>

          {/* OTP Code */}
          {token && (
            <Section style={otpSection}>
              <Text style={otpLabel}>Your login code</Text>
              <Text style={otpCode}>{String(token).slice(0, 6)}</Text>
              <Text style={otpExpiry}>This code expires in 10 minutes</Text>
            </Section>
          )}

          {/* Divider */}
          <Section style={dividerSection}>
            <Hr style={divider} />
            <Text style={dividerText}>or use the magic link</Text>
            <Hr style={divider} />
          </Section>

          {/* Magic Link Button */}
          <Section style={buttonSection}>
            <Button style={button} href={confirmationUrl}>
              Sign In to {siteName}
            </Button>
          </Section>

          <Text style={linkFallback}>
            If the button doesn't work,{' '}
            <Link href={confirmationUrl} style={link}>click here to sign in</Link>.
          </Text>
        </Section>

        {/* Privacy & Terms */}
        <Section style={legalSection}>
          <Text style={legalText}>
            By signing in, you agree to our{' '}
            <Link href="https://singletape.in/#terms" style={legalLink}>Terms of Service</Link>,{' '}
            <Link href="https://singletape.in/#privacy" style={legalLink}>Privacy Policy</Link>, and{' '}
            <Link href="https://singletape.in/#refund" style={legalLink}>Refund Policy</Link>.
          </Text>
          <Text style={legalText}>
            You confirm that you are 18+ and understand that {siteName} may include AI-generated characters.
          </Text>
        </Section>

        {/* Footer */}
        <Section style={footerSection}>
          <Text style={footerText}>
            If you didn't request this login link, you can safely ignore this email.
            No one can access your account without this code.
          </Text>
          <Text style={footerCopyright}>
            © {new Date().getFullYear()} {siteName}. All rights reserved.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

const main = {
  backgroundColor: '#f4f1ee',
  fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
  padding: '20px 0',
}

const wrapper = {
  maxWidth: '520px',
  margin: '0 auto',
}

const header = {
  textAlign: 'center' as const,
  padding: '30px 0 10px',
}

const logoText = {
  fontSize: '26px',
  fontWeight: '700' as const,
  color: '#d94072',
  margin: '0',
  letterSpacing: '-0.5px',
}

const card = {
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  padding: '40px 35px 30px',
  margin: '10px 16px 0',
  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
}

const h1 = {
  fontSize: '22px',
  fontWeight: '700' as const,
  color: '#1c2230',
  margin: '0 0 12px',
  textAlign: 'center' as const,
}

const subtitle = {
  fontSize: '14px',
  color: '#6a7085',
  lineHeight: '1.6',
  margin: '0 0 28px',
  textAlign: 'center' as const,
}

const otpSection = {
  backgroundColor: '#fdf2f5',
  borderRadius: '12px',
  padding: '24px 20px',
  textAlign: 'center' as const,
  margin: '0 0 20px',
}

const otpLabel = {
  fontSize: '12px',
  fontWeight: '600' as const,
  color: '#9a9ab0',
  textTransform: 'uppercase' as const,
  letterSpacing: '1.5px',
  margin: '0 0 10px',
}

const otpCode = {
  fontSize: '36px',
  fontWeight: '700' as const,
  color: '#d94072',
  letterSpacing: '8px',
  fontFamily: "'SF Mono', 'Fira Code', 'Courier New', monospace",
  margin: '0 0 8px',
}

const otpExpiry = {
  fontSize: '12px',
  color: '#999',
  margin: '0',
}

const dividerSection = {
  textAlign: 'center' as const,
  margin: '0 0 20px',
}

const divider = {
  borderColor: '#eee',
  margin: '0',
}

const dividerText = {
  fontSize: '12px',
  color: '#b0b0b0',
  margin: '12px 0',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
}

const buttonSection = {
  textAlign: 'center' as const,
  margin: '0 0 20px',
}

const button = {
  backgroundColor: '#d94072',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '600' as const,
  borderRadius: '12px',
  padding: '14px 36px',
  textDecoration: 'none',
  display: 'inline-block' as const,
}

const linkFallback = {
  fontSize: '11px',
  color: '#b0b0b0',
  lineHeight: '1.5',
  margin: '0',
  wordBreak: 'break-all' as const,
}

const link = {
  color: '#d94072',
  textDecoration: 'underline',
}

const legalSection = {
  padding: '20px 24px 0',
  margin: '0 16px',
}

const legalText = {
  fontSize: '11px',
  color: '#999',
  lineHeight: '1.6',
  margin: '0 0 8px',
  textAlign: 'center' as const,
}

const legalLink = {
  color: '#d94072',
  textDecoration: 'underline',
}

const footerSection = {
  padding: '20px 24px 30px',
  margin: '0 16px',
}

const footerText = {
  fontSize: '11px',
  color: '#b0b0b0',
  lineHeight: '1.6',
  margin: '0 0 6px',
  textAlign: 'center' as const,
}

const footerCopyright = {
  fontSize: '11px',
  color: '#ccc',
  margin: '0',
  textAlign: 'center' as const,
}
