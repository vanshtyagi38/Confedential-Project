/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Hey! Confirm your email for SingleTape 💕</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src="https://fckraevvqfvribyiqkdo.supabase.co/storage/v1/object/public/email-assets/logo-icon.png" width="48" height="48" alt="SingleTape" style={logo} />
        <Heading style={h1}>Welcome to SingleTape 🔥</Heading>
        <Text style={text}>
          Hey! Thanks for signing up. She's already waiting for you 💕
        </Text>
        <Text style={text}>
          Confirm your email (
          <Link href={`mailto:${recipient}`} style={link}>{recipient}</Link>
          ) to start chatting:
        </Text>
        <Button style={button} href={confirmationUrl}>
          Start Chatting 🔥
        </Button>
        <Text style={footer}>
          If you didn't create an account, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Plus Jakarta Sans', Arial, sans-serif" }
const container = { padding: '32px 28px' }
const logo = { borderRadius: '12px', marginBottom: '20px' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: 'hsl(220, 20%, 14%)', margin: '0 0 20px' }
const text = { fontSize: '15px', color: 'hsl(220, 10%, 46%)', lineHeight: '1.6', margin: '0 0 24px' }
const link = { color: 'inherit', textDecoration: 'underline' }
const button = { backgroundColor: 'hsl(348, 75%, 55%)', color: '#ffffff', fontSize: '15px', fontWeight: 'bold' as const, borderRadius: '12px', padding: '14px 24px', textDecoration: 'none' }
const footer = { fontSize: '12px', color: '#999999', margin: '32px 0 0' }
