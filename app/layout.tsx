import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'HireBuzz — Jobs in Dubai',
  description:
    'Real-time job alerts in Dubai across all industries. Updated daily from Bayt, GulfTalent, NaukriGulf, Indeed, and Adzuna.',
  manifest: '/manifest.json',
  themeColor: '#2563eb',
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>{children}</body>
    </html>
  )
}

