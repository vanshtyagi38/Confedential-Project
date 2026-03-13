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

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
  token?: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
  token,
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');`}</style>
    </Head>
    <Preview>Your verification code for {siteName} is {token || 'ready'}</Preview>
    <Body style={main}>
      <Container style={wrapper}>
        {/* Header */}
        <Section style={header}>
          <Text style={logoText}>SingleTape</Text>
        </Section>

        {/* Main Card */}
        <Section style={card}>
          <Heading style={h1}>Verify your email</Heading>
          <Text style={subtitle}>
            Welcome to <strong>{siteName}</strong>! Use the code below to verify your email address and get started.
          </Text>

          {/* OTP Code */}
          {token && (
            <Section style={otpSection}>
              <Text style={otpLabel}>Your verification code</Text>
              <Text style={otpCode}>{String(token).slice(0, 6)}</Text>
              <Text style={otpExpiry}>This code expires in 10 minutes</Text>
            </Section>
          )}

          {/* Divider */}
          <Section style={dividerSection}>
            <Hr style={divider} />
            <Text style={dividerText}>or use the link below</Text>
            <Hr style={divider} />
          </Section>

          {/* Magic Link Button */}
          <Section style={buttonSection}>
            <Button style={button} href={confirmationUrl}>
              Verify & Continue
            </Button>
          </Section>

          <Text style={linkFallback}>
            If the button doesn't work, copy and paste this link into your browser:{' '}
            <Link href={confirmationUrl} style={link}>{confirmationUrl}</Link>
          </Text>
        </Section>

        {/* Privacy & Terms */}
        <Section style={legalSection}>
          <Text style={legalText}>
            By verifying your email and using {siteName}, you agree to our{' '}
            <Link href={`${siteUrl}/#terms`} style={legalLink}>Terms of Service</Link>,{' '}
            <Link href={`${siteUrl}/#privacy`} style={legalLink}>Privacy Policy</Link>, and{' '}
            <Link href={`${siteUrl}/#refund`} style={legalLink}>Refund Policy</Link>.
          </Text>
          <Text style={legalText}>
            You confirm that you are 18 years or older and understand that {siteName} may include AI-generated characters.
            This service is not a dating, escort, or matchmaking agency.
          </Text>
        </Section>

        {/* Footer */}
        <Section style={footerSection}>
          <Text style={footerText}>
            This email was sent to{' '}
            <Link href={`mailto:${recipient}`} style={footerLink}>{recipient}</Link>.
            If you didn't create an account on {siteName}, you can safely ignore this email.
          </Text>
          <Text style={footerCopyright}>
            © {new Date().getFullYear()} {siteName}. All rights reserved.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

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

const footerLink = {
  color: '#b0b0b0',
  textDecoration: 'underline',
}

const footerCopyright = {
  fontSize: '11px',
  color: '#ccc',
  margin: '0',
  textAlign: 'center' as const,
}
