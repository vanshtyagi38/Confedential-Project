/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your verification code for SingleTape</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src="https://fckraevvqfvribyiqkdo.supabase.co/storage/v1/object/public/email-assets/logo-icon.png" width="48" height="48" alt="SingleTape" style={logo} />
        <Heading style={h1}>Confirm your identity</Heading>
        <Text style={text}>Use this code to verify it's you:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>
          This code expires shortly. If you didn't request this, ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Plus Jakarta Sans', Arial, sans-serif" }
const container = { padding: '32px 28px' }
const logo = { borderRadius: '12px', marginBottom: '20px' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: 'hsl(220, 20%, 14%)', margin: '0 0 20px' }
const text = { fontSize: '15px', color: 'hsl(220, 10%, 46%)', lineHeight: '1.6', margin: '0 0 24px' }
const codeStyle = { fontFamily: 'Courier, monospace', fontSize: '28px', fontWeight: 'bold' as const, color: 'hsl(348, 75%, 55%)', letterSpacing: '0.3em', margin: '0 0 30px' }
const footer = { fontSize: '12px', color: '#999999', margin: '32px 0 0' }
